import "@/polyfills/crypto";
import { useState, useRef, useCallback } from "react";
import SimplePeer from "simple-peer/simplepeer.min.js";
import { useSocket } from "./useSocket";
import { callService } from "@/api/entities";
import { toast } from "sonner";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC() {
  const { socket, emit } = useSocket();
  const [isCalling, setIsCalling] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState(null); // 'video' | 'voice'
  const [incomingCall, setIncomingCall] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const [activePeerEmail, setActivePeerEmail] = useState(null);
  const callIdRef = useRef(null);
  const callTimeoutRef = useRef(null);

  // Get user media (camera/microphone)
  const getMedia = useCallback(async (type) => {
    try {
      const constraints = {
        audio: true,
        video: type === "video" ? { width: 1280, height: 720 } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Error getting media:", error);
      toast.error(`Camera/Microphone access denied: ${error.message}`);
      throw error;
    }
  }, []);

  // Initialize peer connection
  const initializePeer = useCallback((initiator = false, stream) => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }

    // Ensure crypto.getRandomValues exists for simple-peer/randombytes
    try {
      if (typeof globalThis !== "undefined") {
        const g = globalThis;
        if (!g.crypto) {
          g.crypto = {};
        }
        if (typeof g.crypto.getRandomValues !== "function") {
          g.crypto.getRandomValues = function getRandomValues(arr) {
            if (!(arr instanceof Uint8Array)) {
              throw new TypeError("Expected Uint8Array");
            }
            for (let i = 0; i < arr.length; i += 1) {
              arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
          };
        }
      }
    } catch (e) {
      console.warn("Could not polyfill crypto.getRandomValues for WebRTC:", e);
    }

    const peer = new SimplePeer({
      initiator,
      trickle: true,
      config: RTC_CONFIG,
      stream: stream || localStreamRef.current,
    });

    peer.on("signal", (data) => {
      console.log("Signal generated:", data.type);
      // Send signal to other user via socket
    });

    peer.on("stream", (remoteStream) => {
      console.log("Received remote stream");
      setRemoteStream(remoteStream);
    });

    peer.on("connect", () => {
      console.log("Peer connected!");
      setIsInCall(true);
      // Clear any "no answer" timeout once the peer connection is established
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
      toast.error("Connection error");
    });

    peer.on("close", () => {
      console.log("Peer connection closed");
      endCall();
    });

    peerRef.current = peer;
    return peer;
  }, []);

  // Start a call
  const startCall = useCallback(
    async (matchId, receiverEmail, type = "video") => {
      if (!matchId || !receiverEmail) {
        toast.error("Unable to start call. Missing match or receiver.");
        return;
      }

      try {
        setIsCalling(true);
        setCallType(type);
        setActivePeerEmail(receiverEmail);

        // Create call record first so we have call_id
        let callId = null;
        try {
          const initRes = await callService.initiate({
            match_id: matchId,
            type,
          });
          callId = initRes?.call_id || null;
        } catch (error) {
          const resp = error?.response;
          const data = resp?.data;

          // If there's an active call already, try to end it once and retry
          if (resp?.status === 400 && data?.call_id) {
            try {
              await callService.end({ call_id: data.call_id });
            } catch (endErr) {
              console.error("Failed to clear existing call:", endErr);
            }
            const retryRes = await callService.initiate({
              match_id: matchId,
              type,
            });
            callId = retryRes?.call_id || null;
          } else {
            throw error;
          }
        }

        callIdRef.current = callId;

        // Get media stream
        const stream = await getMedia(type);

        // Initialize peer as initiator
        const peer = initializePeer(true, stream);

        // Set up signal handler for offer + ICE
        peer.on("signal", (data) => {
          if (data?.type === "offer") {
            emit(
              "call_initiate",
              {
                receiver_email: receiverEmail,
                call_type: type,
                offer: data,
                call_id: callIdRef.current,
              },
              (response) => {
                if (!response?.success) {
                  toast.error(response?.error || "User unavailable");
                  endCall();
                }
              }
            );
          } else {
            // Treat other signals as ICE candidates
            emit("ice_candidate", {
              target_email: receiverEmail,
              candidate: data,
            });
          }
        });

        // Start "no answer" timeout (e.g., 30 seconds)
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
        }
        callTimeoutRef.current = setTimeout(() => {
          callTimeoutRef.current = null;
          if (!isInCall) {
            toast.info("No answer. Ending call.");
            endCall();
          }
        }, 30000);

        toast.success(`Calling ${receiverEmail}...`);
      } catch (error) {
        console.error("Error starting call:", error);
        let message = error?.response?.data?.error || error.message || "Failed to start call";
        if (!error?.response && (error?.code === "ERR_NETWORK" || error?.message === "Network Error")) {
          message = "Cannot reach server. Make sure the backend is running (npm run dev in server/).";
        }
        toast.error(message);
        setIsCalling(false);
        setActivePeerEmail(null);
        callIdRef.current = null;
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }
        throw error;
      }
    },
    [getMedia, initializePeer, emit]
  );

  // Accept incoming call
  const acceptCall = useCallback(async (fromEmail, callType) => {
    try {
      setCallType(callType);
      setActivePeerEmail(fromEmail);
      const stream = await getMedia(callType);
      const peer = initializePeer(false, stream);

      // Handle answer + ICE back to initiator
      peer.on("signal", (data) => {
        if (data?.type === "answer") {
          emit("call_accept", {
            initiator_email: fromEmail,
            answer: data,
          });
        } else {
          emit("ice_candidate", {
            target_email: fromEmail,
            candidate: data,
          });
        }
      });

      // Apply remote offer from incomingCall
      const offer = incomingCall?.offer;
      if (offer) {
        peer.signal(offer);
      }

      // Accept call in database
      const callData = incomingCall;
      if (callData?.call_id) {
        callIdRef.current = callData.call_id;
        await callService.accept({ call_id: callData.call_id });
      }

      setIsInCall(true);
      setIncomingCall(null);
      toast.success("Call connected");
    } catch (error) {
      console.error("Error accepting call:", error);
      toast.error("Failed to accept call");
    }
  }, [getMedia, initializePeer, emit, incomingCall]);

  // Reject incoming call
  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      emit("call_reject", {
        initiator_email: incomingCall.from_email,
      });

      if (incomingCall.call_id) {
        await callService.reject({ call_id: incomingCall.call_id });
      }

      setIncomingCall(null);
      toast.success("Call rejected");
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  }, [incomingCall, emit]);

  // End call
  const endCall = useCallback(async () => {
    try {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      // Notify remote peer
      if (activePeerEmail) {
        emit("call_end", { target_email: activePeerEmail });
      }
      // Destroy peer connection
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }

      // Stop media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      // Reset state
      setRemoteStream(null);
      setLocalStream(null);
      setIsCalling(false);
      setIsInCall(false);
      setCallType(null);
      setIsMuted(false);
      setIsVideoOff(false);
      setActivePeerEmail(null);

      // Update call record in database
      const callId = callIdRef.current;
      callIdRef.current = null;
      if (callId) {
        try {
          await callService.end({ call_id: callId });
        } catch (err) {
          console.error("Error ending call on server:", err);
        }
      }

      toast.info("Call ended");
    } catch (error) {
      console.error("Error ending call:", error);
    }
  }, [activePeerEmail, emit]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback((candidate) => {
    if (peerRef.current) {
      peerRef.current.signal(candidate);
    }
  }, []);

  // Generic remote signal handler (offer/answer/candidate)
  const handleRemoteSignal = useCallback((signal) => {
    if (peerRef.current && signal) {
      peerRef.current.signal(signal);
    }
  }, []);

  return {
    // State
    isCalling,
    isInCall,
    callType,
    incomingCall,
    remoteStream,
    localStream,
    isMuted,
    isVideoOff,
    activePeerEmail,

    // Actions
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    handleIceCandidate,
    handleRemoteSignal,

    // Utilities
    getMedia,
    setIncomingCall,
  };
}
