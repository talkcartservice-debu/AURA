import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventService, profileService, uploadService } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { X, Send, Loader2, User, AlertCircle, Camera, Image as ImageIcon, Smile, ArrowLeft, MoreVertical, Reply, Pencil, Trash2, CornerUpLeft, CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EmojiPicker from "emoji-picker-react";
import ProfileAvatar from "@/components/ProfileAvatar";
import { format } from "date-fns";
import { toast } from "sonner";

export default function EventChatScreen() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on, off } = useSocket();
  const qc = useQueryClient();
  
  const [text, setText] = useState("");
  const [profiles, setProfiles] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Fetch Event Details
  const { data: events } = useQuery({ 
    queryKey: ["events"], 
    queryFn: () => eventService.list() 
  });
  const event = events?.find(e => e._id === eventId);

  // Fetch Messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ["eventMessages", eventId],
    queryFn: () => eventService.getMessages(eventId),
    enabled: !!eventId,
  });

  useEffect(() => {
    const handleEventMessage = (payload) => {
      if (payload?.event_id?.toString() === eventId) {
        qc.invalidateQueries(["eventMessages", eventId]);
      }
    };

    on("event_message_received", handleEventMessage);
    on("event_message_deleted", () => qc.invalidateQueries(["eventMessages", eventId]));
    on("event_message_edited", () => qc.invalidateQueries(["eventMessages", eventId]));
    
    return () => {
      off("event_message_received", handleEventMessage);
      off("event_message_deleted");
      off("event_message_edited");
    };
  }, [on, off, eventId, qc]);

  const sendMutation = useMutation({
    mutationFn: (data) => eventService.sendMessage(eventId, data),
    onSuccess: () => {
      qc.invalidateQueries(["eventMessages", eventId]);
      setText("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setReplyingTo(null);
    },
    onError: (err) => {
      console.error("Failed to send message:", err);
      toast.error(err.response?.data?.error || "Failed to send message.");
    }
  });

  const editMutation = useMutation({
    mutationFn: ({ messageId, content }) => eventService.editMessage(eventId, messageId, content),
    onSuccess: () => {
      qc.invalidateQueries(["eventMessages", eventId]);
      setEditingMessage(null);
      setText("");
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Failed to edit message");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId) => eventService.deleteMessage(eventId, messageId),
    onSuccess: () => {
      qc.invalidateQueries(["eventMessages", eventId]);
      toast.success("Message deleted");
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Failed to delete message");
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
    if (!text.trim() && !selectedFile) return;

    if (editingMessage) {
      editMutation.mutate({ messageId: editingMessage._id, content: text.trim() });
      return;
    }
    
    if (sendMutation.isPending || isUploading) return;
    
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
      image_url: imageUrl,
      reply_to: replyingTo?._id
    });
  };

  const handleEdit = (msg) => {
    setEditingMessage(msg);
    setReplyingTo(null);
    setText(msg.content);
    textareaRef.current?.focus();
  };

  const handleReply = (msg) => {
    setReplyingTo(msg);
    setEditingMessage(null);
    textareaRef.current?.focus();
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

  const isCreator = event?.creator_email === user?.email;
  const isAttendee = event?.rsvp_emails?.includes(user?.email);
  const isPending = event?.pending_rsvp_emails?.includes(user?.email);

  if (!event && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="font-bold text-gray-900">Event not found</h3>
        <Button onClick={() => navigate("/events")} variant="link" className="text-rose-500 mt-2">
          Back to Events
        </Button>
      </div>
    );
  }

  if (event && !isCreator && !isAttendee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="w-20 h-20 rounded-[2.5rem] bg-rose-50 flex items-center justify-center mb-6 shadow-sm ring-4 ring-white">
          <Shield className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Private Event Chat</h2>
        <p className="text-gray-500 text-sm max-w-xs mb-8">
          {isPending 
            ? "Your request to join this event is pending approval from the host." 
            : "You must RSVP and be approved by the host to access this chat."}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {!isPending && (
            <Button 
              onClick={() => eventService.rsvp(eventId).then(() => qc.invalidateQueries(["events"]))}
              className="w-full rounded-2xl h-12 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold"
            >
              Request to Join Event
            </Button>
          )}
          <Button 
            onClick={() => navigate("/events")} 
            variant="outline" 
            className="w-full rounded-2xl h-12 border-gray-200 text-gray-600 font-bold"
          >
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-white sticky top-0 z-10">
        <button 
          onClick={() => navigate("/events")} 
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-all active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white text-lg font-black shrink-0 shadow-sm">
            {event?.cover_emoji || "📅"}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 leading-tight truncate">{event?.title || "Loading..."}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Live Event Chat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-[#FDFCFD] scroll-smooth">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Syncing Chat</p>
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-[240px] mx-auto opacity-60">
            <div className="w-20 h-20 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mb-6">
              <Send className="w-8 h-8 text-gray-300 -rotate-12" />
            </div>
            <h4 className="font-black text-gray-900 mb-2">No messages yet</h4>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">Start the conversation about the event!</p>
          </div>
        ) : (
          messages?.map((m, idx) => {
            const isMe = m.sender_email === user?.email;
            const profile = profiles[m.sender_email];
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showAvatar = !isMe && prevMsg?.sender_email !== m.sender_email;
            const repliedTo = m.reply_to ? messages.find(msg => msg._id === m.reply_to) : null;
            
            return (
              <div key={m._id} className={`flex gap-3 group/msg ${isMe ? "flex-row-reverse" : "flex-row"} ${!showAvatar && !isMe ? "pl-11" : ""}`}>
                {showAvatar && (
                  <div className="flex-shrink-0 mt-auto mb-1">
                    <div className="ring-2 ring-white shadow-sm rounded-xl overflow-hidden">
                      <ProfileAvatar profile={profile} size="sm" />
                    </div>
                  </div>
                )}
                <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  {showAvatar && (
                    <span className="text-[9px] font-black text-gray-400 mb-1 ml-1 uppercase tracking-widest">
                      {profile?.display_name || m.sender_email.split('@')[0]}
                    </span>
                  )}
                  
                  {/* Reply Context */}
                  {repliedTo && (
                    <div className={`text-[10px] py-1 px-3 mb-1 rounded-t-xl bg-gray-100/50 border-l-2 border-rose-400 max-w-full truncate opacity-70 flex items-center gap-1`}>
                      <CornerUpLeft className="w-3 h-3" />
                      <span className="font-bold">{repliedTo.sender_email === user?.email ? "You" : (profiles[repliedTo.sender_email]?.display_name || repliedTo.sender_email.split('@')[0])}:</span>
                      <span className="truncate">{repliedTo.content || "Image"}</span>
                    </div>
                  )}

                  <div className="relative flex items-center gap-2">
                    <div className={`shadow-sm transition-all ${
                      isMe 
                        ? "bg-gradient-to-br from-rose-500 to-purple-600 text-white rounded-2xl rounded-br-none" 
                        : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-none"
                    } overflow-hidden ${repliedTo ? "rounded-tr-none" : ""}`}>
                      {m.image_url && (
                        <div className="p-1">
                          <img 
                            src={m.image_url} 
                            alt="Shared" 
                            className="max-w-full rounded-xl object-cover max-h-[300px] cursor-pointer"
                            onClick={() => window.open(m.image_url, '_blank')}
                          />
                        </div>
                      )}
                      {m.content && (
                        <div className="px-4 py-2 text-sm font-medium leading-relaxed">
                          {m.content}
                        </div>
                      )}
                    </div>

                    {/* Message Actions Dropdown */}
                    <div className={`opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center shrink-0 ${isMe ? "order-first" : ""}`}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-gray-100">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isMe ? "end" : "start"} className="rounded-xl border-gray-100 shadow-xl">
                          <DropdownMenuItem onClick={() => handleReply(m)} className="gap-2 font-medium">
                            <Reply className="w-4 h-4" /> Reply
                          </DropdownMenuItem>
                          {isMe && (
                            <>
                              <DropdownMenuItem onClick={() => handleEdit(m)} className="gap-2 font-medium">
                                <Pencil className="w-4 h-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  if (confirm("Delete this message?")) deleteMutation.mutate(m._id);
                                }} 
                                className="gap-2 font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 px-1">
                    <span className="text-[8px] font-bold text-gray-400">
                      {format(new Date(m.createdAt), "HH:mm")}
                    </span>
                    {m.edited && (
                      <span className="text-[8px] font-bold text-gray-400 italic">· edited</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Preview for selected image */}
      {previewUrl && (
        <div className="px-4 py-3 bg-white border-t border-gray-50 flex items-center gap-3">
          <div className="relative shrink-0">
            <img 
              src={previewUrl} 
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-rose-50" 
              alt="Upload preview" 
            />
            <button 
              onClick={clearSelectedFile}
              className="absolute -top-2 -right-2 bg-gray-900 text-white p-1 rounded-full shadow-lg"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image Ready</p>
            <p className="text-xs text-gray-500 truncate">{selectedFile?.name}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-white border-t border-gray-100 pb-safe-offset-4">
        {/* Reply/Edit Context Bar */}
        {(replyingTo || editingMessage) && (
          <div className="px-4 py-2 bg-gray-50 flex items-center justify-between border-b border-gray-100 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 overflow-hidden">
              {replyingTo ? (
                <>
                  <Reply className="w-3.5 h-3.5 text-rose-500" />
                  <div className="text-xs truncate">
                    <span className="font-bold">Replying to {profiles[replyingTo.sender_email]?.display_name || replyingTo.sender_email.split('@')[0]}</span>
                    <p className="text-gray-500 truncate">{replyingTo.content || "Image"}</p>
                  </div>
                </>
              ) : (
                <>
                  <Pencil className="w-3.5 h-3.5 text-purple-500" />
                  <div className="text-xs truncate">
                    <span className="font-bold text-purple-600 uppercase tracking-widest text-[10px]">Editing Message</span>
                    <p className="text-gray-500 truncate">{editingMessage.content}</p>
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={() => {
                setReplyingTo(null);
                setEditingMessage(null);
                if (editingMessage) setText("");
              }}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="p-4">
          <div className="flex items-end gap-2 bg-gray-50 p-1.5 rounded-3xl border border-gray-100 focus-within:border-rose-200 focus-within:bg-white transition-all">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-rose-500 transition-all shrink-0"
              disabled={!!editingMessage}
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
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-purple-500 transition-all shrink-0"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden mb-2" side="top" align="start">
                <EmojiPicker 
                  onEmojiClick={onEmojiClick}
                  autoFocusSearch={false}
                  theme="light"
                  width={300}
                  height={350}
                />
              </PopoverContent>
            </Popover>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={editingMessage ? "Edit message..." : replyingTo ? "Type a reply..." : "Type your message..."}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium py-2.5 max-h-32 min-h-[40px] resize-none"
            />
            <Button 
              type="submit" 
              disabled={(!text.trim() && !selectedFile) || sendMutation.isPending || editMutation.isPending || isUploading}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white p-0 transition-all active:scale-90 shrink-0"
            >
              {sendMutation.isPending || editMutation.isPending || isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingMessage ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
