import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { relationshipCoachService, matchService, profileService } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { MessageCircle, User, Loader2, Sparkles, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ConversationStarterSelector() {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [starters, setStarters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedTone, setSelectedTone] = useState("all");

  // Fetch mutual matches
  const { data: mutualMatches, isLoading: loadingMatches } = useQuery({
    queryKey: ["mutualMatches"],
    queryFn: matchService.getMutual,
  });

  const TONES = [
    { value: "all", label: "All Tones", icon: "🎨" },
    { value: "curious", label: "Curious", icon: "🤔" },
    { value: "playful", label: "Playful", icon: "😄" },
    { value: "warm", label: "Warm", icon: "😊" },
    { value: "flirty", label: "Flirty", icon: "😏" },
    { value: "sincere", label: "Sincere", icon: "💝" },
  ];

  async function generateStarters(match) {
    if (!match?._id) {
      toast.error("Invalid match selected");
      return;
    }
    
    setLoading(true);
    try {
      const data = await relationshipCoachService.getConversationStarters(match._id);
      setStarters(data.starters || []);
      setSelectedMatch(match);
      toast.success(`Generated ${data.starters?.length || 0} conversation starters!`);
    } catch (err) {
      console.error("Error generating starters:", err);
      const errorMsg = err.response?.data?.error || "Failed to generate conversation starters. Make sure both profiles are complete.";
      toast.error(errorMsg);
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

  if (loadingMatches) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Match Selection */}
      {!selectedMatch ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-600" />
              Select a Match
            </CardTitle>
            <p className="text-sm text-gray-500">
              Choose a match to generate personalized conversation starters
            </p>
          </CardHeader>
          <CardContent>
            {(!mutualMatches || mutualMatches.length === 0) ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  No mutual matches yet. Keep swiping!
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {mutualMatches.map((match) => (
                  <MatchCard
                    key={match._id}
                    match={match}
                    onSelect={() => generateStarters(match)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Selected Match Header */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center text-white font-bold">
                    {selectedMatch.matched_email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {selectedMatch.matched_email}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {new Date(selectedMatch.matched_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setSelectedMatch(null);
                    setStarters([]);
                  }}
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                >
                  Change Match
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Tone Filter */}
          {starters.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
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

          {/* Conversation Starters List */}
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                  <span className="ml-2 text-sm text-gray-500">Generating AI openers...</span>
                </div>
              </CardContent>
            </Card>
          ) : starters.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    Click "Generate" to get AI-powered conversation starters
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
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
        </>
      )}
    </div>
  );
}

function MatchCard({ match, onSelect }) {
  const { user } = useAuth();
  const currentEmail = user?.email;
  const otherEmail = currentEmail
    ? match.user1_email === currentEmail
      ? match.user2_email
      : match.user1_email
    : null;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", otherEmail],
    queryFn: () => {
      if (!otherEmail) return Promise.resolve(null);
      return profileService.getByEmail(otherEmail);
    },
    enabled: !!otherEmail,
  });

  const matchedAt = match?.matched_at || match?.createdAt;

  return (
    <button
      onClick={onSelect}
      className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-rose-300 transition-all text-left group"
      disabled={isLoading}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center text-white font-bold">
          {profile?.display_name?.charAt(0) || otherEmail?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">
            {profile?.display_name || otherEmail || "Loading..."}
          </h4>
          <p className="text-xs text-gray-500">
            {profile?.age ? `${profile.age} years` : ''} {matchedAt && `• ${new Date(matchedAt).toLocaleDateString()}`}
          </p>
        </div>
        <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-rose-500 transition-colors" />
      </div>
      
      {/* Shared interests preview */}
      {profile?.interests && profile.interests.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {profile.interests.slice(0, 2).map((interest, idx) => (
            <span
              key={idx}
              className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"
            >
              {interest}
            </span>
          ))}
          {profile.interests.length > 2 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              +{profile.interests.length - 2} more
            </span>
          )}
        </div>
      )}
      
      {isLoading && (
        <div className="mt-2 text-xs text-gray-400 italic">
          Loading profile...
        </div>
      )}
    </button>
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
    <Card className="border-purple-100 hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
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
      </CardContent>
    </Card>
  );
}
