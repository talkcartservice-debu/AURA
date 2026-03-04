import { useState } from "react";
import { Copy, Check, RefreshCw, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ConversationStarterCard({ matchId, matchInfo }) {
  const [starters, setStarters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedTone, setSelectedTone] = useState("all");

  const TONES = [
    { value: "all", label: "All Tones", icon: "🎨" },
    { value: "curious", label: "Curious", icon: "🤔" },
    { value: "playful", label: "Playful", icon: "😄" },
    { value: "warm", label: "Warm", icon: "😊" },
    { value: "flirty", label: "Flirty", icon: "😏" },
    { value: "sincere", label: "Sincere", icon: "💝" },
  ];

  async function generateStarters() {
    if (!matchId) return;
    
    setLoading(true);
    try {
      const data = await relationshipCoachService.getConversationStarters(matchId);
      setStarters(data.starters || []);
    } catch (err) {
      toast.error("Failed to generate conversation starters");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text, id) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  }

  const filteredStarters = selectedTone === "all" 
    ? starters 
    : starters.filter(s => s.tone === selectedTone);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-600" />
              AI Conversation Starters
            </CardTitle>
            {matchInfo && (
              <p className="text-sm text-gray-500 mt-1">
                For: {matchInfo.matched_with}
                {matchInfo.shared_interests?.length > 0 && (
                  <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    {matchInfo.shared_interests.length} shared interests
                  </span>
                )}
              </p>
            )}
          </div>
          <Button
            onClick={generateStarters}
            disabled={loading || !matchId}
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Generate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Tone Filter */}
        {starters.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {TONES.map((tone) => (
              <button
                key={tone.value}
                onClick={() => setSelectedTone(tone.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedTone === tone.value
                    ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tone.icon} {tone.label}
              </button>
            ))}
          </div>
        )}

        {/* Starters List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin text-rose-500">
              <RefreshCw className="w-6 h-6" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Generating personalized openers...</p>
          </div>
        ) : starters.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              Click "Generate" to get AI-powered conversation starters based on your profiles
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStarters.map((starter, idx) => (
              <StarterMessage
                key={idx}
                starter={starter}
                onCopy={() => copyToClipboard(starter.message, idx)}
                isCopied={copiedId === idx}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StarterMessage({ starter, onCopy, isCopied }) {
  const toneEmojis = {
    curious: "🤔",
    playful: "😄",
    warm: "😊",
    flirty: "😏",
    sincere: "💝",
    adventurous: "🎯",
    romantic: "💫",
  };

  return (
    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{toneEmojis[starter.tone] || "💡"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-purple-600 uppercase">
              {starter.tone}
            </span>
            {starter.context && (
              <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                {starter.context}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-900 leading-relaxed">{starter.message}</p>
          
          <div className="flex items-center gap-2 mt-3">
            <Button
              onClick={onCopy}
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </Button>
            <span className="text-xs text-gray-500">
              Personalized for your match
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
