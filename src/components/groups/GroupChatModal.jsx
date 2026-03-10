import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupService, profileService, uploadService } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { X, Send, Loader2, User, AlertCircle, Camera, Image as ImageIcon, Smile, Users, MoreVertical, LogOut, Reply, Pencil, Trash2, CornerUpLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function GroupChatModal({ group, onClose }) {
  const { user } = useAuth();
  const { on, off } = useSocket();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [profiles, setProfiles] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["groupMessages", group._id],
    queryFn: () => groupService.getMessages(group._id),
  });

  const { data: membersProfiles } = useQuery({
    queryKey: ["groupMembers", group._id],
    queryFn: () => groupService.getMembers(group._id),
    enabled: showMembers
  });

  const leaveMutation = useMutation({
    mutationFn: () => groupService.leave(group._id),
    onSuccess: () => {
      qc.invalidateQueries(["groups"]);
      toast.success("You have left the group");
      onClose();
    },
    onError: () => toast.error("Failed to leave group")
  });

  useEffect(() => {
    const handleGroupMessage = (payload) => {
      if (payload?.group_id?.toString() === group?._id?.toString()) {
        qc.invalidateQueries(["groupMessages", group._id]);
      }
    };

    const handleMessageEdited = (payload) => {
      if (payload?.group_id?.toString() === group?._id?.toString()) {
        qc.invalidateQueries(["groupMessages", group._id]);
      }
    };

    const handleMessageDeleted = (payload) => {
      if (payload?.group_id?.toString() === group?._id?.toString()) {
        qc.invalidateQueries(["groupMessages", group._id]);
      }
    };

    on("group_message_received", handleGroupMessage);
    on("group_message_edited", handleMessageEdited);
    on("group_message_deleted", handleMessageDeleted);
    return () => {
      off("group_message_received", handleGroupMessage);
      off("group_message_edited", handleMessageEdited);
      off("group_message_deleted", handleMessageDeleted);
    };
  }, [on, off, group._id, qc]);

  const sendMutation = useMutation({
    mutationFn: (data) => groupService.sendMessage(group._id, data),
    onSuccess: () => {
      qc.invalidateQueries(["groupMessages", group._id]);
      setText("");
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (err) => {
      console.error("Failed to send message:", err);
      toast.error(err.response?.data?.error || "Failed to send message. Please try again.");
    }
  });

  const editMutation = useMutation({
    mutationFn: (data) => groupService.editMessage(group._id, editingMessage._id, data.content),
    onSuccess: () => {
      qc.invalidateQueries(["groupMessages", group._id]);
      setEditingMessage(null);
      setText("");
    },
    onError: () => toast.error("Failed to edit message")
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId) => groupService.deleteMessage(group._id, messageId),
    onSuccess: () => qc.invalidateQueries(["groupMessages", group._id]),
    onError: () => toast.error("Failed to delete message")
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

  const handleReply = (msg) => {
    setReplyingTo(msg);
    setEditingMessage(null);
    textareaRef.current?.focus();
  };

  const handleEdit = (msg) => {
    setEditingMessage(msg);
    setReplyingTo(null);
    setText(msg.content);
    textareaRef.current?.focus();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !selectedFile) || sendMutation.isPending || editMutation.isPending || isUploading) return;
    
    if (editingMessage) {
      editMutation.mutate({ content: text.trim() });
      return;
    }

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
    setReplyingTo(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-rose-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-rose-500 p-[1px] shadow-lg shadow-purple-200">
              <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-purple-600 font-black text-lg">
                {group.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <h3 className="font-black text-gray-900 leading-tight">{group.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.1em] font-black">
                  {group.member_emails.length} Members
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowMembers(!showMembers)} 
              className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-95 group ${showMembers ? "bg-purple-100 text-purple-600" : "hover:bg-gray-100 text-gray-400"}`}
            >
              <Users className="w-5 h-5 group-hover:text-purple-600 transition-colors" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-2xl transition-all active:scale-95 group">
                  <MoreVertical className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl border-gray-100 shadow-xl overflow-hidden min-w-[160px]">
                <DropdownMenuItem 
                  onClick={() => {
                    if (confirm("Are you sure you want to leave this group?")) leaveMutation.mutate();
                  }}
                  className="gap-2 font-bold text-rose-600 focus:text-rose-600 focus:bg-rose-50 px-4 py-3"
                >
                  <LogOut className="w-4 h-4" /> Leave Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-2xl transition-all active:scale-95 group">
              <X className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden flex flex-col">
          {/* Members Overlay */}
          {showMembers && (
            <div className="absolute inset-0 z-40 bg-white flex flex-col animate-in slide-in-from-right duration-300">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Group Members</h4>
                <button 
                  onClick={() => setShowMembers(false)}
                  className="text-xs font-bold text-rose-500 hover:underline"
                >
                  Back to chat
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {membersProfiles ? (
                  membersProfiles.map(profile => (
                    <div key={profile.user_email} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar profile={profile} size="md" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{profile.display_name}</p>
                          <p className="text-[10px] text-gray-500 font-medium">@{profile.user_email.split('@')[0]}</p>
                        </div>
                      </div>
                      {profile.user_email === group.creator_email && (
                        <span className="text-[9px] font-black bg-purple-100 text-purple-600 px-2 py-1 rounded-lg uppercase tracking-wider">Creator</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600 mb-2" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading members...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[#FDFCFD] scroll-smooth">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading messages</p>
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-[240px] mx-auto">
              <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-purple-50 to-rose-50 flex items-center justify-center mb-6 shadow-sm">
                <Send className="w-8 h-8 text-purple-400 -rotate-12" />
              </div>
              <h4 className="font-black text-gray-900 mb-2">No messages yet</h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">Be the first to share something with the group!</p>
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

                    {/* Reply Context */}
                    {repliedTo && (
                      <div className={`text-[10px] py-1 px-3 mb-1 rounded-t-xl bg-gray-100/50 border-l-2 border-rose-400 max-w-full truncate opacity-70 flex items-center gap-1`}>
                        <CornerUpLeft className="w-3 h-3" />
                        <span className="font-bold">{repliedTo.sender_email === user?.email ? "You" : (profiles[repliedTo.sender_email]?.display_name || repliedTo.sender_email.split('@')[0])}:</span>
                        <span className="truncate">{repliedTo.content || "Image"}</span>
                      </div>
                    )}

                    <div className="relative flex items-center gap-2">
                      <div className={`shadow-sm transition-all hover:shadow-md ${
                        isMe 
                          ? "bg-gradient-to-br from-purple-600 to-rose-600 text-white rounded-[1.5rem] rounded-br-none" 
                          : "bg-white text-gray-800 border border-gray-100 rounded-[1.5rem] rounded-bl-none"
                      } overflow-hidden ${repliedTo ? "rounded-tr-none" : ""}`}>
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
                      <span className="text-[9px] font-bold text-gray-400 uppercase">
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
          <div className="px-6 py-4 bg-white border-t border-gray-50">
            <div className="relative inline-block">
              <img 
                src={previewUrl} 
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-purple-50 shadow-xl" 
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
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-100 pb-safe-offset-4">
          {/* Reply/Edit Context Bar */}
          {(replyingTo || editingMessage) && (
            <div className="px-6 py-2 bg-gray-50 flex items-center justify-between border-b border-gray-100 animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 overflow-hidden">
                {replyingTo ? (
                  <>
                    <Reply className="w-3.5 h-3.5 text-rose-500" />
                    <div className="text-xs truncate">
                      <span className="font-bold text-gray-900">Replying to {profiles[replyingTo.sender_email]?.display_name || replyingTo.sender_email.split('@')[0]}</span>
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

          <form onSubmit={handleSend} className="p-6">
            <div className="flex items-end gap-3 bg-gray-50/80 p-2 rounded-[2rem] border border-gray-100 focus-within:border-purple-200 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-purple-50 transition-all">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-purple-600 hover:shadow-md transition-all active:scale-90 shrink-0"
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
                    className="w-11 h-11 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-rose-500 hover:shadow-md transition-all active:scale-90 shrink-0"
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
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={editingMessage ? "Edit message..." : replyingTo ? "Type a reply..." : "Write a message..."}
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
                disabled={(!text.trim() && !selectedFile) || sendMutation.isPending || editMutation.isPending || isUploading}
                className="w-11 h-11 rounded-full bg-gradient-to-r from-purple-600 to-rose-600 hover:shadow-lg hover:shadow-purple-200 text-white p-0 transition-all active:scale-90 disabled:opacity-50 disabled:grayscale shrink-0"
              >
                {sendMutation.isPending || editMutation.isPending || isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : editingMessage ? <CheckCircle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
