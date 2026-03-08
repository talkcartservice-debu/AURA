import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupService, profileService } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { X, Send, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProfileAvatar from "@/components/ProfileAvatar";
import { format } from "date-fns";

export default function GroupChatModal({ group, onClose }) {
  const { user } = useAuth();
  const { on, off } = useSocket();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [profiles, setProfiles] = useState({});
  const scrollRef = useRef(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["groupMessages", group._id],
    queryFn: () => groupService.getMessages(group._id),
  });

  useEffect(() => {
    const handleGroupMessage = (payload) => {
      if (payload?.group_id === group._id) {
        qc.invalidateQueries(["groupMessages", group._id]);
      }
    };

    on("group_message_received", handleGroupMessage);
    return () => off("group_message_received", handleGroupMessage);
  }, [on, off, group._id, qc]);

  const sendMutation = useMutation({
    mutationFn: (content) => groupService.sendMessage(group._id, content),
    onSuccess: () => {
      qc.invalidateQueries(["groupMessages", group._id]);
      setText("");
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load profiles for senders
  useEffect(() => {
    if (!messages) return;
    const emails = [...new Set(messages.map((m) => m.sender_email))];
    emails.forEach(async (email) => {
      if (!profiles[email]) {
        try {
          const p = await profileService.getByEmail(email);
          setProfiles((prev) => ({ ...prev, [email]: p }));
        } catch {}
      }
    });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || sendMutation.isPending) return;
    sendMutation.mutate(text.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg h-[80vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-rose-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
              {group.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{group.name}</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Group Chat</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Send className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages?.map((m) => {
              const isMe = m.sender_email === user?.email;
              const profile = profiles[m.sender_email];
              return (
                <div key={m._id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  {!isMe && (
                    <div className="flex-shrink-0 mt-auto">
                      <ProfileAvatar profile={profile} size="xs" />
                    </div>
                  )}
                  <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && (
                      <span className="text-[10px] font-bold text-gray-400 ml-1 mb-1 capitalize">
                        {profile?.display_name || m.sender_email.split('@')[0]}
                      </span>
                    )}
                    <div className={`px-4 py-2 rounded-2xl text-sm ${
                      isMe 
                        ? "bg-purple-600 text-white rounded-br-none" 
                        : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-none"
                    }`}>
                      {m.content}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 px-1">
                      {format(new Date(m.createdAt), "HH:mm")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="rounded-xl flex-1 bg-gray-50 border-none focus-visible:ring-purple-500"
          />
          <Button 
            type="submit" 
            disabled={!text.trim() || sendMutation.isPending}
            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4"
          >
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
