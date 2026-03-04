import { useState, useRef, useCallback } from "react";
import Peer from "simple-peer";
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

    const peer = new Peer({
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
  const startCall = useCallback(async (receiverEmail, type = "video") => {
    try {
      setIsCalling(true);
      setCallType(type);

      // Get media stream
      const stream = await getMedia(type);

      // Initialize peer as initiator
      const peer = initializePeer(true, stream);

      // Set up signal handler
      peer.on("signal", (data) => {
        emit("call_initiate", {
          receiver_email: receiverEmail,
          call_type: type,
          offer: data,
        }, (response) => {
          if (!response.success) {
            toast.error("User unavailable");
            endCall();
          }
        });
      });

      // Create call record in database
      await callService.initiate({
        match_id: receiverEmail, // Should be actual match ID
        type,
      });

      toast.success(`Calling ${receiverEmail}...`);
    } catch (error) {
      console.error("Error starting call:", error);
      setIsCalling(false);
      throw error;
    }
  }, [getMedia, initializePeer, emit]);

  // Accept incoming call
  const acceptCall = useCallback(async (fromEmail, callType) => {
    try {
      setCallType(callType);
      const stream = await getMedia(callType);
      const peer = initializePeer(false, stream);

      peer.on("signal", (data) => {
        emit("call_accept", {
          initiator_email: fromEmail,
          answer: data,
        });
      });

      // Accept call in database
      const callData = incomingCall;
      if (callData?.call_id) {
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

      toast.info("Call ended");
    } catch (error) {
      console.error("Error ending call:", error);
    }
  }, []);

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

    // Actions
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    handleIceCandidate,

    // Utilities
    getMedia,
  };
}
