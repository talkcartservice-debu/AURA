import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { matchService, likeService, profileService, subscriptionService } from "@/api/entities";
import MatchCard from "@/components/discover/MatchCard";
import SearchFilters from "@/components/discover/SearchFilters";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import OnlineStatusBadge from "@/components/ui/OnlineStatusBadge";
import { Loader2, Sparkles, Crown } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Discover() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState(null);
  const { data: myProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["myProfile"],
    queryFn: profileService.getMe,
  });
  const { data: dailyMatches, isLoading, refetch } = useQuery({
    queryKey: ["dailyMatches"],
    queryFn: matchService.getDaily,
    enabled: !!myProfile?.profile_complete,
  });
  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionService.get,
  });
  const [profiles, setProfiles] = useState({});
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    if (!dailyMatches) return;
    dailyMatches.forEach(async (dm) => {
      if (!profiles[dm.matched_email]) {
        try {
          const p = await profileService.getByEmail(dm.matched_email);
          setProfiles((prev) => ({ ...prev, [dm.matched_email]: p }));
        } catch {}
      }
    });
  }, [dailyMatches]);

  if (profileLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>;
  if (!myProfile?.profile_complete) return <UserNotRegisteredError />;

  const pending = (dailyMatches || []).filter((m) => m.status === "pending");
  const filtered = filters ? pending.filter((m) => {
    const p = profiles[m.matched_email];
    if (!p) return true;
    
    // Basic filters (free)
    if (filters.ageMin && p.age < filters.ageMin) return false;
    if (filters.ageMax && p.age > filters.ageMax) return false;
    if (filters.relationshipGoals?.length && !filters.relationshipGoals.includes(p.relationship_goals)) return false;
    if (filters.interests?.length && !filters.interests.some((i) => (p.interests || []).includes(i))) return false;
    
    // Premium filters
    if (filters.datingIntent?.length && !filters.datingIntent.includes(p.dating_intent)) return false;
    if (filters.values?.length && !filters.values.some((v) => (p.values || []).includes(v))) return false;
    
    // Lifestyle filters
    if (filters.lifestyle?.smoking && p.lifestyle?.smoking !== filters.lifestyle.smoking) return false;
    if (filters.lifestyle?.drinking && p.lifestyle?.drinking !== filters.lifestyle.drinking) return false;
    
    return true;
  }) : pending;

  const isPremium = subscription?.plan === "premium" && subscription?.is_active;

  async function handleLike(dm) {
    setActioningId(dm._id);
    try {
      const res = await likeService.create({ to_email: dm.matched_email, daily_match_id: dm._id });
      if (res.is_mutual) toast.success("It's a match! 💕");
      await matchService.updateDaily(dm._id, "liked");
      refetch();
    } catch {}
    setActioningId(null);
  }

  async function handleSuperLike(dm) {
    setActioningId(dm._id);
    try {
      // Check if user has Super Likes remaining
      if (!subscription || subscription.plan === "free") {
        toast.error("Super Likes require Premium subscription");
        return;
      }
      if (subscription.super_likes_used >= subscription.super_likes_limit) {
        toast.error("No Super Likes remaining. Purchase more in Premium!");
        return;
      }

      // Send the Super Like (backend will validate and increment counter)
      const res = await likeService.create({ 
        to_email: dm.matched_email, 
        daily_match_id: dm._id,
        is_super_like: true,
      });
      
      if (res.is_mutual) {
        toast.success("It's a match! 💕");
      } else {
        toast.success("Super Like sent! ⭐");
      }
      
      await matchService.updateDaily(dm._id, "liked");
      refetch();
      qc.invalidateQueries(["subscription"]);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send Super Like");
    }
    setActioningId(null);
  }

  async function handlePass(dm) {
    setActioningId(dm._id);
    await matchService.updateDaily(dm._id, "passed");
    refetch();
    setActioningId(null);
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      {!isPremium && (
        <div className="mb-4 bg-gradient-to-r from-purple-600 to-rose-500 rounded-2xl p-3 flex items-center justify-between text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            <div className="text-xs">
              <div className="font-semibold">Unlock more matches with Silver Premium</div>
              <div className="text-white/80">Upgrade to Silver Premium for advanced filters & visibility.</div>
            </div>
          </div>
          <button
            onClick={() => navigate("/premium")}
            className="ml-3 px-3 py-1 text-xs font-semibold rounded-full bg-white text-purple-600 hover:bg-purple-50"
          >
            Go Premium
          </button>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" /> Discover
        </h1>
      </div>
      <SearchFilters onFiltersChange={setFilters} />
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400">No more matches for today. Come back tomorrow!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((dm) => (
            <MatchCard
              key={dm._id}
              dailyMatch={dm}
              profile={profiles[dm.matched_email] || {}}
              myProfile={myProfile}
              onLike={handleLike}
              onPass={handlePass}
              onSuperLike={handleSuperLike}
              disabled={actioningId === dm._id}
              subscription={subscription}
            />
          ))}
        </div>
      )}
    </div>
  );
}
