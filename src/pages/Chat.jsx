import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { messageService, matchService, profileService } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import ProfileAvatar from "@/components/ProfileAvatar";
import OnlineStatusBadge from "@/components/ui/OnlineStatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CallButtons from "@/components/calls/CallButtons";

export default function Chat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState({});
  const bottomRef = useRef(null);

  const { data: matches } = useQuery({ queryKey: ["mutualMatches"], queryFn: matchService.getMutual });
  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", matchId],
    queryFn: () => messageService.getByMatch(matchId),
    enabled: !!matchId,
    refetchInterval: 3000,
  });

  // Currently active match (for header info / presence)
  const activeMatch = matches?.find((m) => m._id === matchId) || null;
  const activeOtherEmail = activeMatch
    ? activeMatch.user1_email === user?.email
      ? activeMatch.user2_email
      : activeMatch.user1_email
    : null;
  const activeProfile = activeOtherEmail ? profiles[activeOtherEmail] : null;

  // Preload profiles for matched users to show display names/avatars
  useEffect(() => {
    if (!matches || !user?.email) return;
    matches.forEach(async (m) => {
      const otherEmail =
        m.user1_email === user.email ? m.user2_email : m.user1_email;
      if (!profiles[otherEmail]) {
        try {
          const p = await profileService.getByEmail(otherEmail);
          setProfiles((prev) => ({ ...prev, [otherEmail]: p }));
        } catch {
          // Ignore profile fetch errors for chat list
        }
      }
    });
  }, [matches, user?.email, profiles]);

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (matchId) {
      messageService.markRead(matchId).catch(console.error);
    }
  }, [matchId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!matchId) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Chat</h1>
        {!matches || matches.length === 0 ? (
          <p className="text-gray-400 text-center py-20">No matches yet. Start discovering!</p>
        ) : (
          <div className="space-y-2">
            {matches.map((m) => {
              const otherEmail = m.user1_email === user?.email ? m.user2_email : m.user1_email;
              const profile = profiles[otherEmail];
              return (
                <button
                  key={m._id}
                  onClick={() => navigate(`/chat/${m._id}`)}
                  className="w-full flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-rose-200 hover:shadow-md transition-all text-left"
                >
                  <div className="relative">
                    <ProfileAvatar profile={profile} size="md" />
                    <OnlineStatusBadge email={otherEmail} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {profile?.display_name || otherEmail}
                    </p>
                    <p className="text-xs text-gray-400">Tap to chat</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!msg.trim()) return;
    setSending(true);
    await messageService.send({ 
      match_id: matchId, 
      content: msg.trim(),
      is_disappearing: false, // Can be toggled in future
    });
    setMsg("");
    refetch();
    setSending(false);
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/matches")} className="p-1"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
          <div className="flex flex-col">
            <h2 className="font-bold text-gray-900">
              {activeProfile?.display_name || "Chat"}
            </h2>
            {activeOtherEmail && (
              <span className="text-xs text-gray-500 truncate max-w-[12rem]">
                {activeOtherEmail}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <OnlineStatusBadge email={activeOtherEmail} size="lg" showLabel />
          {matchId && activeOtherEmail && (
            <CallButtons matchId={matchId} receiverEmail={activeOtherEmail} />
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(messages || []).map((m) => (
          <div key={m._id} className={`flex ${m.sender_email === user?.email ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${m.sender_email === user?.email ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white" : "bg-gray-100 text-gray-800"}`}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2">
        <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message..." className="rounded-xl flex-1" />
        <Button type="submit" disabled={sending || !msg.trim()} className="rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white px-4">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
}
