import { Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallContext } from "@/components/calls/CallProvider";
import { toast } from "sonner";

export default function CallButtons({ matchId, receiverEmail }) {
  const callContext = useCallContext();
  const startCall = callContext?.startCall;
  const isInCall = callContext?.isInCall;
  const isCalling = callContext?.isCalling;

  const handleVoiceCall = async () => {
    try {
      if (!startCall) return;
      await startCall(matchId, receiverEmail, "voice");
    } catch (error) {
      console.error("Voice call error:", error);
    }
  };

  const handleVideoCall = async () => {
    try {
      if (!startCall) return;
      await startCall(matchId, receiverEmail, "video");
    } catch (error) {
      console.error("Video call error:", error);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={!startCall || isInCall || isCalling}
        onClick={handleVoiceCall}
        className="rounded-xl hover:bg-green-50 hover:border-green-200 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        title={isInCall ? "Already in call" : isCalling ? "Calling..." : "Voice Call"}
      >
        <Phone className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!startCall || isInCall || isCalling}
        onClick={handleVideoCall}
        className="rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        title={isInCall ? "Already in call" : isCalling ? "Calling..." : "Video Call"}
      >
        <Video className="w-4 h-4" />
      </Button>
    </div>
  );
}
