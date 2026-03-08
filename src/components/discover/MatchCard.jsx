import { useRef, useState } from "react";
import {
  Heart,
  X,
  MapPin,
  Sparkles,
  Target,
  ShieldCheck,
  Flame,
  Lightbulb,
  Loader2,
  Brain,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  motion,
  useMotionValue,
  useAnimation,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import ProfileAvatar from "@/components/ProfileAvatar";
import OnlineStatusBadge from "@/components/ui/OnlineStatusBadge";
import { generateIcebreaker as generateIcebreakerAI } from "@/api/llmService";

const GOAL_LABELS = {
  long_term: "Long-term relationship",
  casual_dating: "Casual dating",
  friendship_first: "Friendship first",
  marriage_minded: "Marriage-minded",
  open_to_anything: "Open to anything",
};

export default function MatchCard({
  dailyMatch,
  profile,
  myProfile,
  onLike,
  onPass,
  onSuperLike,
  disabled,
  subscription,
}) {
  const myInterests = myProfile?.interests || [];
  const theirInterests = profile?.interests || [];
  const shared = myInterests.filter((i) => theirInterests.includes(i));
  const other = theirInterests
    .filter((i) => !myInterests.includes(i))
    .slice(0, 3);
  const score = dailyMatch.compatibility_score || 0;
  const [icebreaker, setIcebreaker] = useState(null);
  const [loadingIce, setLoadingIce] = useState(false);

  async function generateIcebreaker() {
    setLoadingIce(true);
    try {
      const res = await generateIcebreakerAI({
        profile,
        myProfile,
        shared,
        score,
      });
      setIcebreaker({
        message:
          res.message ||
          "Hey! Your profile really caught my eye 😊 — tell me more about yourself!",
        tone: res.tone || "warm",
      });
    } catch {
      setIcebreaker({
        message:
          "Hey! Your profile caught my eye — I'd love to learn more about you! 😊",
        tone: "warm",
      });
    }
    setLoadingIce(false);
  }

  const x = useMotionValue(0);
  const controls = useAnimation();
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [30, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, -30], [1, 0]);
  const superLikeOpacity = useTransform(x, [-50, 50], [0, 1]);
  const scale = useTransform(x, [-150, 0, 150], [0.95, 1, 0.95]);
  const dragRef = useRef(null);
  const [isSuperLiking, setIsSuperLiking] = useState(false);

  // Enhanced haptic feedback
  const triggerHaptic = (pattern = 'light') => {
    if (navigator.vibrate) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [10, 20, 30],
        error: [30, 30, 30],
      };
      navigator.vibrate(patterns[pattern] || patterns.light);
    }
  };

  const hasSuperLikes = subscription && 
    subscription.plan !== "free" && 
    subscription.super_likes_used < subscription.super_likes_limit;

  const handleSuperLike = () => {
    if (!hasSuperLikes) return;
    onSuperLike(dailyMatch);
  };

  const handleDragEnd = (_, info) => {
    if (disabled) return;
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      // Swipe right - LIKE
      triggerHaptic('success');
      controls
        .start({ 
          x: window.innerWidth + 100, 
          opacity: 0, 
          rotate: 20,
          transition: { duration: 0.4, ease: "easeOut" } 
        })
        .then(() => onLike(dailyMatch));
    } else if (info.offset.x < -threshold) {
      // Swipe left - PASS
      triggerHaptic('medium');
      controls
        .start({ 
          x: -(window.innerWidth + 100), 
          opacity: 0, 
          rotate: -20,
          transition: { duration: 0.4, ease: "easeOut" } 
        })
        .then(() => onPass(dailyMatch));
    } else if (Math.abs(info.offset.y) > 100 && info.offset.y < 0 && Math.abs(info.offset.x) < 50) {
      // Swipe up - SUPER LIKE
      if (hasSuperLikes) {
        triggerHaptic('heavy');
        setIsSuperLiking(true);
        controls
          .start({ 
            y: -window.innerHeight - 100, 
            opacity: 0,
            rotate: 0,
            transition: { duration: 0.5, ease: "easeOut" } 
          })
          .then(() => {
            onSuperLike(dailyMatch);
            setIsSuperLiking(false);
          });
      } else {
        triggerHaptic('error');
        // Snap back
        controls.start({
          x: 0,
          y: 0,
          transition: { type: "spring", stiffness: 400, damping: 25 },
        });
      }
    } else {
      // Return to center
      controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        transition: { type: "spring", stiffness: 350, damping: 22 },
      });
    }
  };

  return (
    <div className="relative">
      {/* Floating particles for Super Like */}
      {isSuperLiking && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 1, 
                scale: 0, 
                x: "50%", 
                y: "80%" 
              }}
              animate={{ 
                opacity: 0, 
                scale: Math.random() * 1.5 + 0.5,
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * -100 - 50}%`,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute w-3 h-3 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full"
            />
          ))}
        </div>
      )}

      {/* Enhanced Like indicator with animation */}
      <AnimatePresence>
        {x.get() > 30 && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
            animate={{ scale: 1.2, opacity: likeOpacity, rotate: -12 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="absolute top-6 left-6 z-20 bg-gradient-to-br from-green-500 to-emerald-600 text-white font-black text-2xl px-5 py-2.5 rounded-2xl border-4 border-green-300 shadow-lg pointer-events-none"
          >
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 fill-white animate-pulse" />
              LIKE
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Pass indicator */}
      <AnimatePresence>
        {x.get() < -30 && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: 12 }}
            animate={{ scale: 1.2, opacity: passOpacity, rotate: 12 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="absolute top-6 right-6 z-20 bg-gradient-to-br from-gray-500 to-gray-600 text-white font-black text-2xl px-5 py-2.5 rounded-2xl border-4 border-gray-300 shadow-lg pointer-events-none"
          >
            <div className="flex items-center gap-2">
              X
              <span className="text-xl">PASS</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Super Like indicator on swipe up */}
      <AnimatePresence>
        {isSuperLiking && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: "20%" }}
            animate={{ scale: 1, opacity: superLikeOpacity, y: "50%" }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-black text-3xl px-8 py-4 rounded-3xl border-4 border-blue-300 shadow-2xl">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 fill-white animate-spin" style={{ animationDuration: '3s' }} />
                SUPER LIKE!
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        ref={dragRef}
        drag={!disabled ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        whileTap={{ cursor: 'grabbing', scale: 0.98 }}
        style={{ x, rotate, scale }}
        animate={controls}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
        className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y select-none"
      >
        {/* Profile Photo Banner */}
        {profile?.photos?.[0] ? (
          <div className="relative h-64 w-full bg-gradient-to-br from-rose-100 to-purple-100">
            <img
              src={profile.photos[0]}
              alt={profile.display_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ProfileAvatar profile={profile} size="lg" />
                    <OnlineStatusBadge email={dailyMatch.matched_email} size="md" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl flex items-center gap-1.5 flex-wrap drop-shadow-lg">
                      {profile.display_name}
                      {profile.age && (
                        <span className="font-normal text-white/90">
                          , {profile.age}
                        </span>
                      )}
                      {profile.is_verified && (
                        <ShieldCheck
                          className="w-4 h-4 text-blue-300 fill-blue-400/30 flex-shrink-0"
                          title="Verified"
                        />
                      )}
                      {profile.is_personality_verified && (
                        <Brain
                          className="w-4 h-4 text-purple-300 flex-shrink-0"
                          title="Verified Personality"
                        />
                      )}
                      {profile.is_hot_love && (
                        <Flame
                          className="w-4 h-4 text-orange-300 fill-orange-400/30 flex-shrink-0"
                          title="Silver Premium member"
                        />
                      )}
                    </h3>
                    {profile.location && (
                      <div className="flex items-center gap-1 text-white/90 text-sm mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {profile.location}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-3.5 py-2 text-center border border-white/30">
                  <div className="text-2xl font-black text-white leading-none">
                    {score}%
                  </div>
                  <div className="text-rose-100 text-xs mt-0.5">match</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* No Photo - Use Gradient Header */
          <div className="bg-gradient-to-br from-rose-500 to-purple-600 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ProfileAvatar profile={profile} size="md" />
                  <OnlineStatusBadge email={dailyMatch.matched_email} size="sm" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl flex items-center gap-1.5 flex-wrap">
                    {profile.display_name}
                    {profile.age && (
                      <span className="font-normal text-rose-100">
                        , {profile.age}
                      </span>
                    )}
                    {profile.is_verified && (
                      <ShieldCheck
                        className="w-4 h-4 text-blue-300 fill-blue-400/30 flex-shrink-0"
                        title="Verified"
                      />
                    )}
                    {profile.is_personality_verified && (
                      <Brain
                        className="w-4 h-4 text-purple-300 flex-shrink-0"
                        title="Verified Personality"
                      />
                    )}
                    {profile.is_hot_love && (
                      <Flame
                        className="w-4 h-4 text-orange-300 fill-orange-400/30 flex-shrink-0"
                        title="Silver Premium member"
                      />
                    )}
                  </h3>
                  {profile.location && (
                    <div className="flex items-center gap-1 text-rose-100 text-sm mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {profile.location}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-3.5 py-2 text-center border border-white/30">
                <div className="text-2xl font-black text-white leading-none">
                  {score}%
                </div>
                <div className="text-rose-100 text-xs mt-0.5">match</div>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-5">
          {profile.bio && (
            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
              {profile.bio}
            </p>
          )}

          {/* Why you match */}
          {dailyMatch.compatibility_reasons?.length > 0 && (
            <div className="bg-purple-50 rounded-2xl p-3.5 mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">
                  Why you match
                </span>
              </div>
              <ul className="space-y-1">
                {dailyMatch.compatibility_reasons.slice(0, 3).map((r, i) => (
                  <li
                    key={i}
                    className="text-xs text-purple-700 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                    {r}
                  </li>
                ))}
                {dailyMatch.intent_aligned && (
                  <li className="text-xs text-purple-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                    Looking for the same type of relationship
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Interests */}
          {(shared.length > 0 || other.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {shared.slice(0, 4).map((i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-rose-50 text-rose-600 text-xs font-medium rounded-full border border-rose-100"
                >
                  💕 {i}
                </span>
              ))}
              {other.map((i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-full border border-gray-100"
                >
                  {i}
                </span>
              ))}
            </div>
          )}

          {/* Goal */}
          {profile.relationship_goals && (
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <Target className="w-3.5 h-3.5" />
              <span>{GOAL_LABELS[profile.relationship_goals]}</span>
            </div>
          )}

          {/* AI Icebreaker */}
          <div className="mb-4">
            {!icebreaker ? (
              <button
                onClick={generateIcebreaker}
                disabled={loadingIce}
                className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-xl px-3 py-2 transition-all w-full justify-center"
              >
                {loadingIce ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Lightbulb className="w-3 h-3" />
                )}
                {loadingIce
                  ? "Crafting your icebreaker..."
                  : "✨ Generate AI Icebreaker"}
              </button>
            ) : (
              <div className="bg-gradient-to-br from-purple-50 to-rose-50 border border-purple-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">
                      Icebreaker
                    </span>
                  </div>
                  {icebreaker.tone && (
                    <span className="text-xs text-rose-400 capitalize bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                      {icebreaker.tone}
                    </span>
                  )}
                </div>
                <p className="text-xs text-purple-800 leading-relaxed italic">
                  "{icebreaker.message}"
                </p>
                <button
                  onClick={generateIcebreaker}
                  className="text-xs text-purple-400 mt-1.5 hover:text-purple-600 flex items-center gap-1"
                >
                  <Loader2 className="w-2.5 h-2.5" /> Try another
                </button>
              </div>
            )}
          </div>

          {/* Actions - inline in card body (hidden on mobile, visible on desktop) */}
          <div className="hidden md:flex gap-3 mt-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={() => {
                  triggerHaptic('light');
                  onPass(dailyMatch);
                }}
                disabled={disabled}
                className="flex-1 h-12 rounded-2xl border-2 border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 font-semibold transition-all"
              >
                <X className="w-5 h-5 mr-1.5" />
                Pass
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => {
                  triggerHaptic('success');
                  onLike(dailyMatch);
                }}
                disabled={disabled}
                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-semibold shadow-md shadow-rose-200 transition-all"
              >
                <Heart className="w-5 h-5 mr-1.5 fill-white" />
                Like
              </Button>
            </motion.div>
            
            {subscription && subscription.plan !== "free" && (
              <motion.div 
                whileHover={hasSuperLikes ? { scale: 1.05 } : {}}
                whileTap={hasSuperLikes ? { scale: 0.95 } : {}}
              >
                <Button
                  onClick={() => {
                    if (hasSuperLikes) {
                      triggerHaptic('heavy');
                      handleSuperLike();
                    }
                  }}
                  disabled={disabled || !hasSuperLikes}
                  className={`h-12 px-6 rounded-2xl font-semibold shadow-md transition-all ${
                    hasSuperLikes
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-700 text-white shadow-blue-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                  }`}
                  title={hasSuperLikes ? "Super Like" : "No Super Likes remaining"}
                >
                  <Flame className={`w-5 h-5 ${hasSuperLikes ? "fill-white animate-pulse" : ""}`} />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Sticky action bar on mobile - Enhanced */}
      <div className="md:hidden fixed bottom-[4.5rem] left-0 right-0 px-4 pb-2 z-40 pointer-events-none">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl p-3 shadow-lg"
        >
          <div className="flex gap-3">
            <motion.div 
              className="flex-1"
              whileTap={{ scale: 0.9 }}
              onClick={() => triggerHaptic('light')}
            >
              <Button
                variant="outline"
                onClick={() => onPass(dailyMatch)}
                disabled={disabled}
                className="w-full h-12 rounded-xl border-2 border-gray-200 text-gray-500 hover:border-gray-300 font-semibold"
              >
                <X className="w-5 h-5 mr-1.5" /> Pass
              </Button>
            </motion.div>
            
            <motion.div 
              className="flex-1"
              whileTap={{ scale: 0.9 }}
              onClick={() => triggerHaptic('success')}
            >
              <Button
                onClick={() => onLike(dailyMatch)}
                disabled={disabled}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold shadow-md shadow-rose-200"
              >
                <Heart className="w-5 h-5 mr-1.5 fill-white" /> Like
              </Button>
            </motion.div>
            
            {subscription && subscription.plan !== "free" && (
              <motion.div 
                whileTap={hasSuperLikes ? { scale: 0.9 } : {}}
                onClick={() => {
                  if (hasSuperLikes) triggerHaptic('heavy');
                }}
              >
                <Button
                  onClick={handleSuperLike}
                  disabled={disabled || !hasSuperLikes}
                  className={`h-12 px-5 rounded-xl font-semibold shadow-md transition-all ${
                    hasSuperLikes
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                  }`}
                  title={hasSuperLikes ? "Super Like" : "No Super Likes remaining"}
                >
                  <Flame className={`w-5 h-5 ${hasSuperLikes ? "fill-white animate-pulse" : ""}`} />
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
