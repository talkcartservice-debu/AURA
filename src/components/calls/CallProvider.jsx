import { useEffect, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useWebRTC } from "@/hooks/useWebRTC";
import IncomingCallModal from "./IncomingCallModal";
import ActiveCallWindow from "./ActiveCallWindow";
import { toast } from "sonner";

export default function CallProvider({ children }) {
  const { on, off, emit } = useSocket();
  const {
    isInCall,
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
  } = useWebRTC();
  
  const ringtoneRef = useRef(null);
  const vibrationIntervalRef = useRef(null);

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

    // Handle call accepted
    on("call_accepted", (data) => {
      console.log("✅ Call accepted by:", data.from_email);
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
    });

    // Handle ICE candidates
    on("ice_candidate", (data) => {
      console.log("❄️ ICE candidate from:", data.from_email);
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
  }, [on, off, setIncomingCall]);

  // Play ringtone sound
  const playRingtone = () => {
    // Stop any existing ringtone
    stopRingtone();
    
    // Create audio element with ringtone
    ringtoneRef.current = new Audio('/ringtones/call_ringtone.mp3');
    ringtoneRef.current.loop = true;
    ringtoneRef.current.volume = 0.7;
    ringtoneRef.current.play().catch(err => {
      console.warn('Could not play ringtone:', err);
    });
  };

  // Stop ringtone
  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current = null;
    }
  };

  // Start vibration pattern (vibrate-pause-vibrate)
  const startVibration = () => {
    if ('vibrate' in navigator) {
      // Vibration pattern: 1000ms on, 500ms off, repeat
      vibrationIntervalRef.current = setInterval(() => {
        navigator.vibrate([1000, 500, 1000]);
      }, 2500);
      
      // Initial vibration
      navigator.vibrate([1000, 500, 1000]);
    }
  };

  // Stop vibration
  const stopVibration = () => {
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0); // Stop all vibrations
    }
  };

  return (
    <>
      {children}
      
      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
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
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onEndCall={endCall}
        />
      )}
    </>
  );
}
