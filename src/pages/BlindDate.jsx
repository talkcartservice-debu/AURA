import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { blindDateService, profileService } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProfileAvatar from "@/components/ProfileAvatar";
import {
  Loader2, EyeOff, Send, Sparkles, Heart, X, MessageCircle,
  Users, PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function BlindDate() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: myProfile } = useQuery({ queryKey: ["myProfile"], queryFn: profileService.getMe });
  const { data: activeData, isLoading, refetch } = useQuery({
    queryKey: ["blindDate"],
    queryFn: blindDateService.getActive,
  });

  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [justRevealed, setJustRevealed] = useState(false);
  const messagesEndRef = useRef(null);

  const blindDate = activeData?.blindDate;
  const partnerProfile = activeData?.partnerProfile;
  const isOptedIn = myProfile?.blind_date_available;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [blindDate?.messages]);

  async function handleOptIn() {
    try {
      await blindDateService.optIn();
      qc.invalidateQueries(["myProfile"]);
      toast.success("You're now available for blind dates!");
    } catch { toast.error("Failed to opt in"); }
  }

  async function handleOptOut() {
    try {
      await blindDateService.optOut();
      qc.invalidateQueries(["myProfile"]);
      toast.success("Opted out of blind dates");
    } catch { toast.error("Failed to opt out"); }
  }

  async function handleStart() {
    setStarting(true);
    try {
      await blindDateService.start();
      refetch();
      toast.success("Blind date started! Say hi to your mystery match!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not start blind date");
    }
    setStarting(false);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await blindDateService.sendMessage(message.trim());
      setMessage("");
      if (res.justRevealed) {
        setJustRevealed(true);
        toast.success("Profiles revealed! You can now see each other!");
      }
      refetch();
    } catch { toast.error("Failed to send message"); }
    setSending(false);
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      await blindDateService.cancel();
      refetch();
      toast.success("Blind date cancelled");
    } catch { toast.error("Failed to cancel"); }
    setCancelling(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  // No active blind date
  if (!blindDate) {
    return (
      <div className="max-w-lg mx-auto p-4">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white mb-6">
          <EyeOff className="w-12 h-12 mb-4 opacity-80" />
          <h1 className="text-3xl font-black mb-2">Blind Date</h1>
          <p className="text-white/80 text-sm">
            Match with someone anonymously. Chat first, reveal later!
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="font-bold text-gray-900 mb-4">How it works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-sm font-bold text-indigo-600">1</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Get matched anonymously</p>
                <p className="text-xs text-gray-500">You'll see compatibility score and shared interests, but no photos or names</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-sm font-bold text-indigo-600">2</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Chat with conversation prompts</p>
                <p className="text-xs text-gray-500">Break the ice with fun prompts and get to know each other</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-sm font-bold text-indigo-600">3</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Profiles revealed after 3 messages each</p>
                <p className="text-xs text-gray-500">Once you've both sent 3 messages, identities are revealed!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          {!isOptedIn ? (
            <div className="text-center">
              <Users className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">Opt in to be available for blind dates from other users</p>
              <Button onClick={handleOptIn} className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
                Opt In to Blind Dates
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button onClick={handleStart} disabled={starting} className="w-full rounded-2xl h-12 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-semibold text-lg">
                {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start a Blind Date"}
              </Button>
              <Button onClick={handleOptOut} variant="outline" className="w-full rounded-2xl text-gray-400">
                Opt Out
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active blind date
  const isUser1 = blindDate.user1_email === user?.email;
  const myMsgCount = isUser1 ? blindDate.user1_message_count : blindDate.user2_message_count;
  const theirMsgCount = isUser1 ? blindDate.user2_message_count : blindDate.user1_message_count;
  const msgsUntilReveal = Math.max(0, 3 - myMsgCount) + Math.max(0, 3 - theirMsgCount);

  return (
    <div className="max-w-lg mx-auto p-4 flex flex-col" style={{ height: "calc(100vh - 5rem)" }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-4 mb-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {blindDate.revealed && partnerProfile ? (
              <ProfileAvatar profile={partnerProfile} size="md" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <EyeOff className="w-6 h-6 text-white/80" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-lg">
                {blindDate.revealed && partnerProfile ? partnerProfile.display_name : "Mystery Match"}
              </h2>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Sparkles className="w-3 h-3" />
                <span>{blindDate.compatibility_score}% compatible</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            {!blindDate.revealed && (
              <div className="text-xs text-white/70">
                {msgsUntilReveal > 0 ? `${msgsUntilReveal} msgs to reveal` : "Revealing..."}
              </div>
            )}
            {blindDate.revealed && (
              <span className="bg-green-400/20 text-green-200 text-xs px-2 py-1 rounded-full">Revealed!</span>
            )}
          </div>
        </div>

        {/* Shared interests */}
        {blindDate.shared_interests?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {blindDate.shared_interests.map((i) => (
              <span key={i} className="px-2 py-0.5 bg-white/15 text-white text-xs rounded-full">{i}</span>
            ))}
          </div>
        )}
      </div>

      {/* Reveal Animation */}
      <AnimatePresence>
        {justRevealed && partnerProfile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-gradient-to-br from-rose-50 to-purple-50 border border-rose-200 rounded-2xl p-6 mb-4 text-center"
          >
            <PartyPopper className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="font-bold text-gray-900 text-lg mb-1">Identity Revealed!</h3>
            <p className="text-sm text-gray-500 mb-3">Meet your blind date match:</p>
            <div className="flex items-center justify-center gap-3">
              <ProfileAvatar profile={partnerProfile} size="lg" />
              <div className="text-left">
                <p className="font-bold text-gray-900">{partnerProfile.display_name}</p>
                {partnerProfile.age && <p className="text-sm text-gray-500">{partnerProfile.age} years old</p>}
                {partnerProfile.location && <p className="text-xs text-gray-400">{partnerProfile.location}</p>}
              </div>
            </div>
            <Button onClick={() => setJustRevealed(false)} variant="outline" className="mt-4 rounded-xl text-xs">
              Continue Chatting
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation Prompt */}
      {blindDate.conversation_prompt && blindDate.messages?.length === 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4 text-center">
          <MessageCircle className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-indigo-600 uppercase mb-1">Conversation Starter</p>
          <p className="text-sm text-indigo-800 italic">"{blindDate.conversation_prompt}"</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 px-1">
        {(blindDate.messages || []).map((msg, i) => {
          const isMine = msg.sender_email === user?.email;
          return (
            <div key={i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                isMine
                  ? "bg-gradient-to-r from-indigo-600 to-purple-700 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${isMine ? "text-white/50" : "text-gray-400"}`}>
                  {new Date(msg.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {blindDate.status === "active" && (
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="rounded-xl flex-1"
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !message.trim()} className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-4">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      )}

      {/* Cancel */}
      {blindDate.status === "active" && (
        <Button onClick={handleCancel} disabled={cancelling} variant="ghost" className="mt-2 text-gray-400 text-xs">
          {cancelling ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <X className="w-3 h-3 mr-1" />}
          End Blind Date
        </Button>
      )}

      {/* Revealed status */}
      {blindDate.status === "revealed" && !justRevealed && (
        <div className="text-center py-3 bg-green-50 rounded-2xl mt-2">
          <p className="text-sm text-green-600 font-medium flex items-center justify-center gap-1">
            <Heart className="w-4 h-4" /> Profiles have been revealed!
          </p>
        </div>
      )}
    </div>
  );
}
