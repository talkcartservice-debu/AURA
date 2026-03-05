import { Phone, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileAvatar from "@/components/ProfileAvatar";

export default function IncomingCallModal({ incomingCall, peerProfile, onAccept, onReject }) {
  if (!incomingCall) return null;

  const isVideoCall = incomingCall.call_type === "video";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <ProfileAvatar profile={peerProfile || null} size="xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {isVideoCall ? "📹 Video Call" : "📞 Voice Call"}
          </h2>
          <p className="text-gray-600">
            {(peerProfile?.display_name || incomingCall.from_email) + " is calling..."}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          {/* Reject Button */}
          <Button
            onClick={onReject}
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
            size="icon"
          >
            <X className="w-8 h-8" />
          </Button>

          {/* Accept Button */}
          <Button
            onClick={() => onAccept(incomingCall.from_email, incomingCall.call_type)}
            className={`h-16 w-16 rounded-full ${
              isVideoCall 
                ? "bg-blue-500 hover:bg-blue-600" 
                : "bg-green-500 hover:bg-green-600"
            } text-white`}
            size="icon"
          >
            {isVideoCall ? (
              <Video className="w-8 h-8" />
            ) : (
              <Phone className="w-8 h-8" />
            )}
          </Button>
        </div>

        {/* Caller Info */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Call started at {new Date(incomingCall.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
