import { Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebRTC } from "@/hooks/useWebRTC";
import { toast } from "sonner";

export default function CallButtons({ matchId, receiverEmail }) {
  const { startCall, isInCall, isCalling } = useWebRTC();

  const handleVoiceCall = async () => {
    try {
      await startCall(receiverEmail, "voice");
    } catch (error) {
      console.error("Voice call error:", error);
    }
  };

  const handleVideoCall = async () => {
    try {
      await startCall(receiverEmail, "video");
    } catch (error) {
      console.error("Video call error:", error);
    }
  };

  // Don't show buttons if already in call
  if (isInCall || isCalling) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleVoiceCall}
        className="rounded-xl hover:bg-green-50 hover:border-green-200 hover:text-green-600"
        title="Voice Call"
      >
        <Phone className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleVideoCall}
        className="rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
        title="Video Call"
      >
        <Video className="w-4 h-4" />
      </Button>
    </div>
  );
}
