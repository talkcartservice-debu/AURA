import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { messageService, matchService, profileService, callService } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import ProfileAvatar from "@/components/ProfileAvatar";
import OnlineStatusBadge from "@/components/ui/OnlineStatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, ArrowLeft, Check, CheckCheck, MoreVertical, ShieldAlert, UserMinus, MessageCircleOff, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import CallButtons from "@/components/calls/CallButtons";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { useCallContext } from "@/components/calls/CallProvider";

export default function Chat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState({});
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [forwardSourceMessage, setForwardSourceMessage] = useState(null);
  const [forwardTargetId, setForwardTargetId] = useState("");
  const bottomRef = useRef(null);
  const { on, off, emit } = useSocket();
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const callContext = useCallContext();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [isUnmatching, setIsUnmatching] = useState(false);

  const { data: matches } = useQuery({ queryKey: ["mutualMatches"], queryFn: matchService.getMutual });
  const { data: missedCalls } = useQuery({
    queryKey: ["missedCalls"],
    queryFn: callService.getMissed,
    refetchOnWindowFocus: true,
  });
  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", matchId],
    queryFn: () => messageService.getByMatch(matchId),
    enabled: !!matchId,
    refetchInterval: 3000,
  });
  const { data: callHistory } = useQuery({
    queryKey: ["callHistory", matchId],
    queryFn: () => callService.getHistory(matchId),
    enabled: !!matchId,
  });

  // Currently active match (for header info / presence)
  const activeMatch = matches?.find((m) => m._id === matchId) || null;
  const activeOtherEmail = activeMatch
    ? activeMatch.user1_email === user?.email
      ? activeMatch.user2_email
      : activeMatch.user1_email
    : null;
  const activeProfile = activeOtherEmail ? profiles[activeOtherEmail] : null;

  // Preload profiles for matched users and missed-call initiators
  useEffect(() => {
    if (!user?.email) return;
    const emailsToLoad = new Set();

    if (matches) {
      matches.forEach((m) => {
        const otherEmail =
          m.user1_email === user.email ? m.user2_email : m.user1_email;
        if (!profiles[otherEmail]) emailsToLoad.add(otherEmail);
      });
    }
    if (missedCalls) {
      missedCalls.forEach((call) => {
        if (call.initiator_email && !profiles[call.initiator_email]) {
          emailsToLoad.add(call.initiator_email);
        }
      });
    }

    emailsToLoad.forEach(async (email) => {
      try {
        const p = await profileService.getByEmail(email);
        setProfiles((prev) => ({ ...prev, [email]: p }));
      } catch {
        // Ignore profile fetch errors
      }
    });
  }, [matches, missedCalls, user?.email, profiles]);

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (matchId) {
      messageService.markRead(matchId).catch(console.error);
    }
  }, [matchId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Listen for typing indicators from partner
  useEffect(() => {
    function handleTyping(payload) {
      if (!payload) return;
      const { from_email, match_id } = payload;
      if (from_email === activeOtherEmail && match_id === matchId) {
        setIsPartnerTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsPartnerTyping(false);
        }, 2500);
      }
    }

    function handleStopTyping(payload) {
      const { from_email, match_id } = payload || {};
      if (from_email === activeOtherEmail && match_id === matchId) {
        setIsPartnerTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    }

    on("typing", handleTyping);
    on("stop_typing", handleStopTyping);

    function handleMessagesRead(payload) {
      if (payload?.match_id === matchId) {
        refetch();
      }
    }
    on("messages_read", handleMessagesRead);

    function handleMessageReceived(payload) {
      if (payload?.match_id === matchId) {
        refetch();
        messageService.markRead(matchId).catch(console.error);
      }
    }
    on("message_received", handleMessageReceived);

    return () => {
      off("typing");
      off("stop_typing");
      off("messages_read");
      off("message_received");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [on, off, activeOtherEmail, matchId, refetch]);

  // Emit typing events when user is typing
  useEffect(() => {
    if (!matchId || !activeOtherEmail) return;
    if (!msg.trim()) {
      emit("stop_typing", { target_email: activeOtherEmail, match_id: matchId });
      return;
    }

    emit("typing", { target_email: activeOtherEmail, match_id: matchId });

    const timeout = setTimeout(() => {
      emit("stop_typing", { target_email: activeOtherEmail, match_id: matchId });
    }, 2000);

    return () => clearTimeout(timeout);
  }, [msg, matchId, activeOtherEmail, emit]);

  if (!matchId) {
    const missedList = missedCalls || [];
    return (
      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Chat</h1>

        {/* Missed calls */}
        {missedList.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Missed calls
            </h2>
            <div className="space-y-2">
              {missedList.map((call) => {
                const matchIdFromCall = call.match_id?._id ?? call.match_id;
                const hasMatch = !!matchIdFromCall;
                const callerEmail = call.initiator_email;
                const profile = profiles[callerEmail];
                const callTypeLabel = call.type === "video" ? "Video" : "Voice";
                const dateLabel = call.createdAt
                  ? new Date(call.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return (
                  <div
                    key={call._id}
                    className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-2xl"
                  >
                    <ProfileAvatar profile={profile || null} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {profile?.display_name || callerEmail}
                      </p>
                      <p className="text-xs text-rose-600">
                        Missed {callTypeLabel.toLowerCase()} call · {dateLabel}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl shrink-0"
                      disabled={!hasMatch}
                      onClick={() => hasMatch && navigate(`/chat/${matchIdFromCall}`)}
                    >
                      Chat
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!matches || matches.length === 0 ? (
          <EmptyState
            icon={MessageCircleOff}
            title="No messages yet"
            description="Your matches will appear here once you both like each other. Start discovering new profiles!"
            actionLabel="Discover Profiles"
            onAction={() => navigate("/discover")}
            className="py-12"
          />
        ) : (
          <div className="space-y-2">
            {missedList.length > 0 && (
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Messages
              </h2>
            )}
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
    try {
      const content = msg.trim();

      if (editingMessage) {
        await messageService.edit(editingMessage._id, content);
        toast.success("Message updated");
        setEditingMessage(null);
      } else {
        let finalContent = content;
        if (replyTo) {
          const snippet = replyTo.content.slice(0, 120);
          finalContent = `↩️ Replying to: "${snippet}"\n\n${content}`;
        }
        await messageService.send({
          match_id: matchId,
          content: finalContent,
          is_disappearing: false, // Can be toggled in future
        });
      }
      setMsg("");
      setReplyTo(null);
      setSelectedMessage(null);
      await refetch();
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteMessage(message) {
    try {
      await messageService.delete(message._id);
      toast.success("Message deleted");
      setSelectedMessage(null);
      await refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete message");
    }
  }

  function handleStartEdit(message) {
    setEditingMessage(message);
    setMsg(message.content);
    setReplyTo(null);
    setSelectedMessage(null);
  }

  function handleStartReply(message) {
    setReplyTo(message);
    setSelectedMessage(null);
  }

  function handleStartForward(message) {
    setForwardSourceMessage(message);
    setForwardTargetId("");
    setSelectedMessage(null);
  }

  async function handleForwardSend() {
    if (!forwardSourceMessage || !forwardTargetId) return;
    try {
      await messageService.send({
        match_id: forwardTargetId,
        content: forwardSourceMessage.content,
        is_disappearing: false,
      });
      toast.success("Message forwarded");
      setForwardSourceMessage(null);
      setForwardTargetId("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to forward message");
    }
  }

  async function handleUnmatch() {
    if (!matchId) return;
    if (!confirm("Are you sure you want to unmatch? This will delete your conversation.")) return;
    setIsUnmatching(true);
    try {
      await matchService.unmatch(matchId);
      toast.success("Unmatched successfully");
      navigate("/matches");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to unmatch");
    } finally {
      setIsUnmatching(false);
    }
  }

  async function handleReportSubmit() {
    if (!matchId || !reportReason) return;
    setIsReporting(true);
    try {
      await matchService.report({
        match_id: matchId,
        reported_email: activeOtherEmail,
        reason: reportReason,
        details: reportDetails
      });
      toast.success("User reported and unmatched");
      setShowReportDialog(false);
      navigate("/matches");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to report");
    } finally {
      setIsReporting(false);
    }
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
            {callContext?.isInCall && (
              <span className="text-[11px] text-emerald-500 font-medium">
                In call
              </span>
            )}
            {/* Call history summary for this match */}
            {callHistory && callHistory.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                {(() => {
                  const missedCount = callHistory.filter((c) => c.status === "missed").length;
                  const lastCall = callHistory[0];
                  const lastLabel =
                    lastCall.status === "missed"
                      ? "Missed"
                      : lastCall.status === "ended" || lastCall.status === "accepted"
                        ? (lastCall.duration ? `${Math.floor(lastCall.duration / 60)}m` : "Called")
                        : lastCall.status;
                  return (
                    <>
                      {missedCount > 0 && (
                        <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          {missedCount} missed
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        Last: {lastLabel} {lastCall.type === "video" ? "video" : "voice"} ·{" "}
                        {new Date(lastCall.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <OnlineStatusBadge email={activeOtherEmail} size="lg" showLabel />
          {matchId && activeOtherEmail && (
            <CallButtons matchId={matchId} receiverEmail={activeOtherEmail} />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl">
              <DropdownMenuItem 
                onClick={handleUnmatch}
                disabled={isUnmatching}
                className="text-gray-600 gap-2 cursor-pointer"
              >
                <UserMinus className="w-4 h-4" /> Unmatch
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowReportDialog(true)}
                className="text-rose-600 focus:text-rose-600 gap-2 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" /> Report User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Tell us why you're reporting this user. They will be automatically unmatched.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Reason</label>
              <select 
                className="w-full p-3 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="">Select a reason</option>
                <option value="inappropriate_behavior">Inappropriate behavior</option>
                <option value="spam_or_scam">Spam or scam</option>
                <option value="fake_profile">Fake profile</option>
                <option value="harassment">Harassment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Details (Optional)</label>
              <Textarea 
                placeholder="Provide more information..."
                className="rounded-xl min-h-[100px]"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setShowReportDialog(false)} className="rounded-xl">Cancel</Button>
            <Button 
              onClick={handleReportSubmit} 
              disabled={!reportReason || isReporting}
              className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
            >
              {isReporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(messages || []).map((m) => {
          const isOwn = m.sender_email === user?.email;
          const isSelected = selectedMessage?._id === m._id;
          return (
            <div
              key={m._id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              onClick={() => setSelectedMessage(m)}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm cursor-pointer ${
                  isOwn
                    ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white"
                    : "bg-gray-100 text-gray-800"
                } ${isSelected ? "ring-2 ring-rose-300" : ""}`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                <div className="mt-1 flex items-center justify-between text-[10px] opacity-70">
                  <span>
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {m.edited ? " · edited" : ""}
                  </span>
                  {isOwn && (
                    <span className="flex items-center gap-1">
                      {m.is_read ? (
                        <>
                          <CheckCheck className="w-3 h-3 text-sky-400" />
                          <span className="hidden xs:inline">Seen</span>
                        </>
                      ) : (
                        <Check className="w-3 h-3 text-gray-300" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {/* Typing indicator */}
      {isPartnerTyping && (
        <div className="px-4 pb-1 text-xs text-gray-500">
          {activeProfile?.display_name || "They"} is typing...
        </div>
      )}
      {/* Message action bar */}
      {selectedMessage && (
        <div className="px-4 pb-2 border-t border-gray-100 bg-white flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-500 max-w-[50%] truncate">
            Selected: {selectedMessage.content.slice(0, 60)}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl h-7 px-3 text-xs"
              onClick={() => handleStartReply(selectedMessage)}
            >
              Reply
            </Button>
            {selectedMessage.sender_email === user?.email && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-7 px-3 text-xs"
                  onClick={() => handleStartEdit(selectedMessage)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-7 px-3 text-xs text-red-600 border-red-200"
                  onClick={() => handleDeleteMessage(selectedMessage)}
                >
                  Delete
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl h-7 px-3 text-xs"
              onClick={() => handleStartForward(selectedMessage)}
            >
              Forward
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl h-7 px-3 text-xs text-gray-500"
              onClick={() => setSelectedMessage(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      {/* Reply / Edit / Forward context bars */}
      {replyTo && (
        <div className="px-4 pt-2 pb-1 bg-gray-50 border-t border-gray-100 text-xs text-gray-700">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Replying to</span>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setReplyTo(null)}
            >
              ✕
            </button>
          </div>
          <p className="truncate text-gray-500">
            {replyTo.content}
          </p>
        </div>
      )}
      {editingMessage && (
        <div className="px-4 pt-2 pb-1 bg-yellow-50 border-t border-yellow-100 text-xs text-yellow-800 flex items-center justify-between">
          <span>Editing your message</span>
          <button
            type="button"
            className="text-yellow-600 hover:text-yellow-800"
            onClick={() => {
              setEditingMessage(null);
              setMsg("");
            }}
          >
            Cancel
          </button>
        </div>
      )}
      {forwardSourceMessage && (
        <div className="px-4 pt-2 pb-2 bg-blue-50 border-t border-blue-100 text-xs text-blue-800">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold">Forward message to another match</span>
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800"
              onClick={() => {
                setForwardSourceMessage(null);
                setForwardTargetId("");
              }}
            >
              Cancel
            </button>
          </div>
          <p className="truncate text-blue-700 mb-1">
            {forwardSourceMessage.content}
          </p>
          <div className="flex items-center gap-2">
            <select
              className="flex-1 border rounded-lg px-2 py-1 text-xs"
              value={forwardTargetId}
              onChange={(e) => setForwardTargetId(e.target.value)}
            >
              <option value="">Select match…</option>
              {(matches || [])
                .filter((m) => m._id !== matchId)
                .map((m) => {
                  const otherEmail =
                    m.user1_email === user?.email ? m.user2_email : m.user1_email;
                  const profile = profiles[otherEmail];
                  const label = profile?.display_name || otherEmail;
                  return (
                    <option key={m._id} value={m._id}>
                      {label}
                    </option>
                  );
                })}
            </select>
            <Button
              type="button"
              size="sm"
              className="rounded-xl h-8 px-3 text-xs"
              disabled={!forwardTargetId}
              onClick={handleForwardSend}
            >
              Send
            </Button>
          </div>
        </div>
      )}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2">
        <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message..." className="rounded-xl flex-1" />
        <Button type="submit" disabled={sending || !msg.trim()} className="rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white px-4">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
}
