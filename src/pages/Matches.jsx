import { useQuery } from "@tanstack/react-query";
import { matchService, profileService, messageService } from "@/api/entities";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileAvatar from "@/components/ProfileAvatar";
import OnlineStatusBadge from "@/components/ui/OnlineStatusBadge";
import { Heart, Loader2, MessageCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import MatchFeedbackModal from "@/components/matches/MatchFeedbackModal";
import { toast } from "sonner";

export default function Matches() {
  const navigate = useNavigate();
  const { data: matches, isLoading } = useQuery({ queryKey: ["mutualMatches"], queryFn: matchService.getMutual });
  const { data: myProfile } = useQuery({ queryKey: ["myProfile"], queryFn: profileService.getMe });
  const { data: lastMessages } = useQuery({ 
    queryKey: ["lastMessages"], 
    queryFn: messageService.getLastMessages,
    refetchInterval: 5000, // Poll for new messages
  });
  const [profiles, setProfiles] = useState({});
  const [feedbackMatch, setFeedbackMatch] = useState(null);

  async function handleFeedback(data) {
    await matchService.submitFeedback(data);
    toast.success("Thanks for your feedback!");
  }

  useEffect(() => {
    if (!matches || !myProfile) return;
    matches.forEach(async (m) => {
      const otherEmail = m.user1_email === myProfile.user_email ? m.user2_email : m.user1_email;
      if (!profiles[otherEmail]) {
        try {
          const p = await profileService.getByEmail(otherEmail);
          setProfiles((prev) => ({ ...prev, [otherEmail]: p }));
        } catch {}
      }
    });
  }, [matches, myProfile]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>;

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-6">
        <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> Matches
      </h1>
      {(!matches || matches.length === 0) ? (
        <div className="text-center py-20"><p className="text-gray-400">No matches yet. Keep discovering!</p></div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => {
            const otherEmail = m.user1_email === myProfile?.user_email ? m.user2_email : m.user1_email;
            const profile = profiles[otherEmail];
            const lastMsgData = lastMessages?.find(lm => lm.match_id === m._id);
            const lastMessage = lastMsgData?.last_message;
            const unreadCount = lastMsgData?.unread_count || 0;
            
            return (
              <div
                key={m._id}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:border-rose-200 transition-all"
              >
                {/* Match user's actual profile photo */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-100 bg-gradient-to-br from-rose-400 to-purple-500">
                    {profile?.photos?.[0] ? (
                      <img
                        src={profile.photos[0]}
                        alt={profile.display_name || otherEmail}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                        {(profile?.display_name || otherEmail || "?")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <OnlineStatusBadge email={otherEmail} size="sm" />
                </div>

                {/* User information (name, age, location, last message) */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-sm truncate">
                      {profile?.display_name || otherEmail}
                      {profile?.age && (
                        <span className="text-xs text-gray-500 font-normal">, {profile.age}</span>
                      )}
                    </h3>
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {profile?.location && (
                    <p className="text-[11px] text-gray-400 truncate">
                      {profile.location}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 truncate">
                    {lastMessage
                      ? lastMessage.sender_email === myProfile?.user_email
                        ? `You: ${lastMessage.content}`
                        : lastMessage.content
                      : profile?.bio || "No bio yet"}
                  </p>
                  {lastMessage && (
                    <p className="text-xs text-gray-300 mt-0.5">
                      {new Date(lastMessage.created_at).toLocaleDateString()}{" "}
                      at{" "}
                      {new Date(lastMessage.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => setFeedbackMatch(m)} className="rounded-xl shrink-0" title="Rate match">
                  <Star className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={() => navigate(`/chat/${m._id}`)} className={`rounded-xl shrink-0 ${unreadCount > 0 ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      {feedbackMatch && (
        <MatchFeedbackModal
          match={feedbackMatch}
          onClose={() => setFeedbackMatch(null)}
          onSubmit={handleFeedback}
        />
      )}
    </div>
  );
}
