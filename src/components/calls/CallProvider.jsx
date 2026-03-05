import { useEffect, useRef, useState, createContext, useContext } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useWebRTC } from "@/hooks/useWebRTC";
import IncomingCallModal from "./IncomingCallModal";
import ActiveCallWindow from "./ActiveCallWindow";
import { toast } from "sonner";
import { profileService } from "@/api/entities";

const CallContext = createContext(null);

export function useCallContext() {
  return useContext(CallContext);
}

export default function CallProvider({ children }) {
  const { on, off, emit } = useSocket();
  const {
    isInCall,
    isCalling,
    startCall,
    activePeerEmail,
    incomingCall,
    remoteStream,
    localStream,
    isMuted,
    isVideoOff,
    callType,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    setIncomingCall,
    handleRemoteSignal,
  } = useWebRTC();
  
  const ringtoneRef = useRef(null);
  const vibrationIntervalRef = useRef(null);
  const hasUserInteractedRef = useRef(false);
  const hasShownAudioWarningRef = useRef(false);
  const [peerProfile, setPeerProfile] = useState(null);

  const currentPeerEmail = incomingCall?.from_email || activePeerEmail || null;

  // Load profile for the current peer (for avatar / display name)
  useEffect(() => {
    let cancelled = false;

    if (!currentPeerEmail) {
      setPeerProfile(null);
      return undefined;
    }

    (async () => {
      try {
        const profile = await profileService.getByEmail(currentPeerEmail);
        if (!cancelled) {
          setPeerProfile(profile);
        }
      } catch {
        if (!cancelled) {
          setPeerProfile(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentPeerEmail]);

  // Track first user interaction to satisfy browser vibration requirement
  useEffect(() => {
    const markInteracted = () => {
      hasUserInteractedRef.current = true;
      window.removeEventListener("pointerdown", markInteracted);
      window.removeEventListener("keydown", markInteracted);

       // If a call is already incoming when the user first interacts,
       // try starting ringtone + vibration again now that gestures are allowed.
       if (incomingCall) {
         playRingtone();
         startVibration();
       }
    };

    window.addEventListener("pointerdown", markInteracted);
    window.addEventListener("keydown", markInteracted);

    return () => {
      window.removeEventListener("pointerdown", markInteracted);
      window.removeEventListener("keydown", markInteracted);
    };
  }, [incomingCall]);

  // Set up socket listeners for calls
  useEffect(() => {
    // Handle incoming call
    on("call_received", (data) => {
      console.log("📞 Incoming call:", data);
      
      // Store incoming call data in state
      if (setIncomingCall) {
        setIncomingCall(data);
      }
      
      // Play ringtone
      playRingtone();
      
      // Vibrate device (if supported)
      startVibration();
      
      toast.info(`Incoming ${data.call_type} call from ${data.from_email}`);
    });

    // Handle call accepted (answer from callee)
    on("call_accepted", (data) => {
      console.log("✅ Call accepted by:", data.from_email);
      if (data?.answer && handleRemoteSignal) {
        handleRemoteSignal(data.answer);
      }
      stopRingtone();
      stopVibration();
    });

    // Handle call rejected
    on("call_rejected", (data) => {
      console.log("❌ Call rejected by:", data.from_email);
      toast.error("Call was rejected");
      stopRingtone();
      stopVibration();
    });

    // Handle call ended
    on("call_ended", (data) => {
      console.log("📞 Call ended by:", data.from_email);
      toast.info("Call ended");
      stopRingtone();
      stopVibration();
      endCall();
    });

    // Handle ICE candidates
    on("ice_candidate", (data) => {
      console.log("❄️ ICE candidate from:", data.from_email);
      if (data?.candidate && handleRemoteSignal) {
        handleRemoteSignal(data.candidate);
      }
    });

    // Cleanup
    return () => {
      off("call_received");
      off("call_accepted");
      off("call_rejected");
      off("call_ended");
      off("ice_candidate");
      stopRingtone();
      stopVibration();
    };
  }, [on, off, setIncomingCall, handleRemoteSignal, endCall]);

  // Play ringtone sound
  function playRingtone() {
    // Stop any existing ringtone
    stopRingtone();
    
    // Create audio element with ringtone
    ringtoneRef.current = new Audio('/ringtones/call_ringtone.mp3');
    ringtoneRef.current.loop = true;
    ringtoneRef.current.volume = 0.7;
    ringtoneRef.current.play().catch(err => {
      console.warn("Could not play ringtone:", err);

      // Show a one-time hint if autoplay is blocked
      if (!hasShownAudioWarningRef.current) {
        hasShownAudioWarningRef.current = true;
        toast.info("Tap anywhere to enable ringtone and vibration for incoming calls.");
      }
    });
  }

  // Stop ringtone
  function stopRingtone() {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current = null;
    }
  }

  // Start vibration pattern (vibrate-pause-vibrate)
  function startVibration() {
    if (
      hasUserInteractedRef.current &&
      typeof navigator !== "undefined" &&
      "vibrate" in navigator
    ) {
      // Vibration pattern: 1000ms on, 500ms off, repeat
      vibrationIntervalRef.current = setInterval(() => {
        navigator.vibrate([1000, 500, 1000]);
      }, 2500);

      // Initial vibration
      navigator.vibrate([1000, 500, 1000]);
    }
  }

  // Stop vibration (only call navigator.vibrate when user has interacted, to avoid Chrome intervention)
  function stopVibration() {
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    if (
      hasUserInteractedRef.current &&
      typeof navigator !== "undefined" &&
      "vibrate" in navigator
    ) {
      try {
        navigator.vibrate(0);
      } catch {
        // Ignore if blocked by browser
      }
    }
  }

  return (
    <CallContext.Provider
      value={{
        isInCall,
        isCalling,
        callType,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
      }}
    >
      {children}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
          peerProfile={peerProfile}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* Active Call Window */}
      {isInCall && (
        <ActiveCallWindow
          callType={callType}
          remoteStream={remoteStream}
          localStream={localStream}
          peerEmail={activePeerEmail}
          peerProfile={peerProfile}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onEndCall={endCall}
        />
      )}
    </CallContext.Provider>
  );
}
