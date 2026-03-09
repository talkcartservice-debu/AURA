import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventService, profileService, uploadService } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { X, Send, Loader2, User, AlertCircle, Camera, Image as ImageIcon, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker from "emoji-picker-react";
import ProfileAvatar from "@/components/ProfileAvatar";
import { format } from "date-fns";
import { toast } from "sonner";

export default function EventChatModal({ event, onClose }) {
  const { user } = useAuth();
  const { on, off } = useSocket();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [profiles, setProfiles] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["eventMessages", event._id],
    queryFn: () => eventService.getMessages(event._id),
  });

  useEffect(() => {
    const handleEventMessage = (payload) => {
      if (payload?.event_id?.toString() === event?._id?.toString()) {
        qc.invalidateQueries(["eventMessages", event._id]);
      }
    };

    on("event_message_received", handleEventMessage);
    return () => off("event_message_received", handleEventMessage);
  }, [on, off, event._id, qc]);

  const sendMutation = useMutation({
    mutationFn: (data) => eventService.sendMessage(event._id, data),
    onSuccess: () => {
      qc.invalidateQueries(["eventMessages", event._id]);
      setText("");
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (err) => {
      console.error("Failed to send message:", err);
      toast.error(err.response?.data?.error || "Failed to send message. Please try again.");
    }
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !selectedFile) || sendMutation.isPending || isUploading) return;
    
    let imageUrl = null;
    if (selectedFile) {
      setIsUploading(true);
      try {
        imageUrl = await uploadService.single(selectedFile);
      } catch (err) {
        toast.error("Failed to upload image");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    sendMutation.mutate({ 
      content: text.trim(), 
      image_url: imageUrl 
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, previewUrl]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-lg h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 p-[1px] shadow-lg shadow-blue-200">
              <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-blue-600 font-black text-lg">
                {event.cover_emoji || "📅"}
              </div>
            </div>
            <div>
              <h3 className="font-black text-gray-900 leading-tight">{event.title}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.1em] font-black">Event Chat</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-2xl transition-all active:scale-95 group">
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[#FDFCFD] scroll-smooth">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading messages</p>
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-[240px] mx-auto">
              <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-6 shadow-sm">
                <Send className="w-8 h-8 text-blue-400 -rotate-12" />
              </div>
              <h4 className="font-black text-gray-900 mb-2">No messages yet</h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">Chat with other attendees about the event!</p>
            </div>
          ) : (
            messages?.map((m, idx) => {
              const isMe = m.sender_email === user?.email;
              const profile = profiles[m.sender_email];
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const showAvatar = !isMe && prevMsg?.sender_email !== m.sender_email;
              
              return (
                <div key={m._id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"} ${!showAvatar && !isMe ? "pl-11" : ""}`}>
                  {showAvatar && (
                    <div className="flex-shrink-0 mt-auto mb-1">
                      <div className="ring-2 ring-white shadow-sm rounded-2xl overflow-hidden">
                        <ProfileAvatar profile={profile} size="sm" />
                      </div>
                    </div>
                  )}
                  <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {showAvatar && (
                      <span className="text-[10px] font-black text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                        {profile?.display_name || m.sender_email.split('@')[0]}
                      </span>
                    )}
                    <div className={`shadow-sm transition-all hover:shadow-md ${
                      isMe 
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-[1.5rem] rounded-br-none" 
                        : "bg-white text-gray-800 border border-gray-100 rounded-[1.5rem] rounded-bl-none"
                    } overflow-hidden`}>
                      {m.image_url && (
                        <div className="p-1">
                          <img 
                            src={m.image_url} 
                            alt="Shared" 
                            className="max-w-full rounded-2xl object-cover max-h-[300px] cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => window.open(m.image_url, '_blank')}
                          />
                        </div>
                      )}
                      {m.content && (
                        <div className="px-4 py-2.5 text-sm font-medium leading-relaxed">
                          {m.content}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 mt-1.5 px-2 uppercase">
                      {format(new Date(m.createdAt), "HH:mm")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Preview for selected image */}
        {previewUrl && (
          <div className="px-6 py-4 bg-white border-t border-gray-50">
            <div className="relative inline-block">
              <img 
                src={previewUrl} 
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-blue-50 shadow-xl" 
                alt="Upload preview" 
              />
              <button 
                onClick={clearSelectedFile}
                className="absolute -top-2 -right-2 bg-gray-900 text-white p-1.5 rounded-full shadow-lg hover:bg-black transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
              {isUploading && (
                <div className="absolute inset-0 bg-white/60 rounded-2xl flex items-center justify-center backdrop-blur-[2px]">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <form onSubmit={handleSend} className="p-6 bg-white border-t border-gray-100">
          <div className="flex items-end gap-3 bg-gray-50/80 p-2 rounded-[2rem] border border-gray-100 focus-within:border-blue-200 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-blue-50 transition-all">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-blue-600 hover:shadow-md transition-all active:scale-90"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
            />
            
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-11 h-11 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-blue-500 hover:shadow-md transition-all active:scale-90"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden mb-2" side="top" align="start">
                <EmojiPicker 
                  onEmojiClick={onEmojiClick}
                  autoFocusSearch={false}
                  theme="light"
                  width={320}
                  height={400}
                />
              </PopoverContent>
            </Popover>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message..."
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium py-3 max-h-32 min-h-[44px] resize-none"
            />
            <Button 
              type="submit" 
              disabled={(!text.trim() && !selectedFile) || sendMutation.isPending || isUploading}
              className="w-11 h-11 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-200 text-white p-0 transition-all active:scale-90 disabled:opacity-50 disabled:grayscale"
            >
              {sendMutation.isPending || isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
