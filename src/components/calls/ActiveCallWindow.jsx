import { useRef, useEffect } from "react";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileAvatar from "@/components/ProfileAvatar";

export default function ActiveCallWindow({ 
  callType, 
  remoteStream, 
  localStream, 
  isMuted, 
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onEndCall 
}) {
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      {/* Remote Video (Full Screen) */}
      {callType === "video" && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Local Video (Picture-in-Picture) */}
      {callType === "video" && !isVideoOff && (
        <div className="absolute top-4 right-4 w-32 h-48 md:w-48 md:h-64 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-700">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Call Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <div className="bg-black/60 backdrop-blur-md rounded-3xl p-4 flex gap-4">
          {/* Mute/Unmute */}
          <Button
            onClick={onToggleMute}
            variant="outline"
            size="icon"
            className={`h-14 w-14 rounded-full ${
              isMuted 
                ? "bg-red-500 hover:bg-red-600 text-white border-red-500" 
                : "bg-white/20 hover:bg-white/30 text-white border-white/30"
            }`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          {/* Video On/Off */}
          {callType === "video" && (
            <Button
              onClick={onToggleVideo}
              variant="outline"
              size="icon"
              className={`h-14 w-14 rounded-full ${
                isVideoOff 
                  ? "bg-red-500 hover:bg-red-600 text-white border-red-500" 
                  : "bg-white/20 hover:bg-white/30 text-white border-white/30"
              }`}
            >
              {isVideoOff ? (
                <VideoOff className="w-6 h-6" />
              ) : (
                <VideoIcon className="w-6 h-6" />
              )}
            </Button>
          )}

          {/* End Call */}
          <Button
            onClick={onEndCall}
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white border-red-500"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Caller Info (Voice Call) */}
      {callType === "voice" && (
        <div className="absolute top-8 left-0 right-0 flex justify-center">
          <div className="bg-black/60 backdrop-blur-md rounded-3xl p-6 text-center">
            <ProfileAvatar profile={null} size="xl" />
            <h2 className="text-white text-xl font-bold mt-4">
              {callType === "video" ? "Video Call" : "Voice Call"}
            </h2>
            <p className="text-white/70 text-sm mt-1">
              {isMuted && "🔇 Muted"} {isVideoOff && "📷 Camera Off"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
