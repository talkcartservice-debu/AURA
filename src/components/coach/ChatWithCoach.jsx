import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { relationshipCoachService, matchService } from "@/api/entities";
import { Send, Trash2, Sparkles, MessageCircle, Loader2, RotateCcw, Heart, Shield, Lightbulb, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatWithCoach() {
  const [inputMessage, setInputMessage] = useState("");
  const [activeMatchContext, setActiveMatchContext] = useState(null);
  const messagesEndRef = useRef(null);
  const qc = useQueryClient();

  // Fetch chat history
  const { data: chatData, isLoading } = useQuery({
    queryKey: ["coachChatHistory"],
    queryFn: () => relationshipCoachService.getChatHistory(50),
    refetchInterval: 30000,
  });

  // Fetch mutual matches for context
  const { data: mutualMatches } = useQuery({
    queryKey: ["mutualMatches"],
    queryFn: matchService.getMutual,
  });

  // Coaching style mutation
  const setStyleMutation = useMutation({
    mutationFn: (style) => relationshipCoachService.setCoachingStyle(style),
    onSuccess: (data) => {
      qc.invalidateQueries(["coachChatHistory"]);
      if (data?.coaching_style) {
        toast.success(`Coach style set to ${data.coaching_style}`);
      }
    },
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: (message) => relationshipCoachService.chatWithCoach({
      message,
      match_id: activeMatchContext?._id
    }),
    onSuccess: () => {
      qc.invalidateQueries(["coachChatHistory"]);
      setInputMessage("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to send message");
    },
  });

  // Clear history mutation
  const clearHistory = useMutation({
    mutationFn: () => relationshipCoachService.clearChatHistory(),
    onSuccess: () => {
      qc.invalidateQueries(["coachChatHistory"]);
      toast.success("Conversation cleared - fresh start!");
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatData?.messages]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    sendMessage.mutate(inputMessage);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messages = chatData?.messages || [];
  const sessionCount = chatData?.session_count || 0;
  const coachingStyle = chatData?.coaching_style || "supportive";

  // Category icons
  const categoryIcons = {
    general_advice: <Lightbulb className="w-3 h-3" />,
    relationship_question: <Heart className="w-3 h-3" />,
    dating_tip: <Sparkles className="w-3 h-3" />,
    confidence_building: <Shield className="w-3 h-3" />,
    communication_help: <MessageCircle className="w-3 h-3" />,
    breakup_support: <RotateCcw className="w-3 h-3" />,
    first_date_prep: <Sparkles className="w-3 h-3" />,
    red_flag_discussion: <Shield className="w-3 h-3" />,
    goal_setting: <Lightbulb className="w-3 h-3" />,
    other: <MessageCircle className="w-3 h-3" />,
  };

  // Category colors
  const categoryColors = {
    general_advice: "bg-blue-100 text-blue-700",
    relationship_question: "bg-pink-100 text-pink-700",
    dating_tip: "bg-purple-100 text-purple-700",
    confidence_building: "bg-green-100 text-green-700",
    communication_help: "bg-indigo-100 text-indigo-700",
    breakup_support: "bg-gray-100 text-gray-700",
    first_date_prep: "bg-orange-100 text-orange-700",
    red_flag_discussion: "bg-red-100 text-red-700",
    goal_setting: "bg-teal-100 text-teal-700",
    other: "bg-gray-100 text-gray-700",
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            <span className="ml-2 text-sm text-gray-500">Loading conversation...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Header */}
      <CardHeader className="border-b bg-gradient-to-r from-rose-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Relationship Coach</CardTitle>
              <CardDescription>
                {activeMatchContext ? (
                  <span className="text-purple-600 font-medium flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Discussing {activeMatchContext.matched_email}
                  </span>
                ) : (
                  `Session #${sessionCount + 1}`
                )}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              className="text-xs border rounded-lg px-2 py-1 bg-white text-gray-700 focus:ring-2 focus:ring-purple-200"
              value={coachingStyle}
              onChange={(e) => setStyleMutation.mutate(e.target.value)}
              disabled={setStyleMutation.isPending}
            >
              <option value="supportive">Supportive</option>
              <option value="direct">Direct</option>
              <option value="gentle">Gentle</option>
              <option value="motivational">Motivational</option>
              <option value="analytical">Analytical</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearHistory.mutate()}
              disabled={clearHistory.isPending || messages.length === 0}
              className="rounded-xl border-gray-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Match Context Bar */}
      {mutualMatches?.length > 0 && (
        <div className="bg-white border-b px-4 py-2 overflow-x-auto flex gap-2 no-scrollbar">
          <Button
            variant={!activeMatchContext ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveMatchContext(null)}
            className="text-[10px] h-7 whitespace-nowrap rounded-full"
          >
            General Advice
          </Button>
          {mutualMatches.map(m => (
            <Button
              key={m._id}
              variant={activeMatchContext?._id === m._id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveMatchContext(m)}
              className={`text-[10px] h-7 whitespace-nowrap rounded-full ${activeMatchContext?._id === m._id ? "bg-purple-100 text-purple-700" : ""}`}
            >
              Match: {m.matched_email.split('@')[0]}
            </Button>
          ))}
        </div>
      )}

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Welcome! I'm Your AI Relationship Coach 💕
            </h3>
            <p className="text-sm text-gray-600 max-w-md mb-6">
              I'm here to help you navigate love, dating, and relationships. Ask me anything!
            </p>
            
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              <SuggestionChip 
                icon="💬"
                text="How do I start a conversation?"
                onClick={() => setInputMessage("How do I start a conversation with someone I'm interested in?")}
              />
              <SuggestionChip 
                icon="🎯"
                text="First date tips"
                onClick={() => setInputMessage("I have a first date coming up. Any tips?")}
              />
              <SuggestionChip 
                icon="🛡️"
                text="Red flags to watch for"
                onClick={() => setInputMessage("What are some red flags I should watch out for?")}
              />
              <SuggestionChip 
                icon="💪"
                text="Build my confidence"
                onClick={() => setInputMessage("I need help building my dating confidence")}
              />
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                message={msg}
                isLast={idx === messages.length - 1}
                categoryIcon={categoryIcons[msg.category]}
                categoryColor={categoryColors[msg.category]}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
        </AnimatePresence>
        
        {sendMessage.isPending && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%] shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-500 font-medium italic">Coach is typing...</span>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind..."
            className="flex-1 resize-none rounded-xl min-h-[60px] max-h-[120px]"
            disabled={sendMessage.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim() || sendMessage.isPending}
            className="rounded-xl px-6 self-end"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5 mr-1" />
                Send
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Your AI coach provides supportive, judgment-free guidance 💙
        </p>
      </div>
    </Card>
  );
}

function SuggestionChip({ icon, text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 bg-white border-2 border-gray-200 hover:border-rose-300 rounded-xl text-xs text-left transition-all"
    >
      <span className="mr-1">{icon}</span>
      {text}
    </button>
  );
}

function MessageBubble({ message, isLast, categoryIcon, categoryColor }) {
  const isUser = message.role === "user";
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
        isUser 
          ? "bg-gray-200 border border-gray-300" 
          : "bg-gradient-to-br from-rose-400 to-purple-600"
      }`}>
        {isUser ? (
          <span className="text-[10px] font-bold text-gray-600">ME</span>
        ) : (
          <MessageCircle className="w-4 h-4 text-white" />
        )}
      </div>
      
      {/* Message Content */}
      <div className={`max-w-[85%] ${isUser ? "text-right" : ""}`}>
        <div className={`rounded-2xl px-4 py-3 shadow-sm ${
          isUser 
            ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-tr-none" 
            : "bg-white border border-gray-200 rounded-tl-none text-gray-800"
        }`}>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        
        {/* Metadata */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-1.5 ml-1">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${categoryColor}`}>
              {categoryIcon}
              {message.category.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            <span className="text-[10px] text-gray-400">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
