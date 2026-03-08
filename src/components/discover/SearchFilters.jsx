import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { subscriptionService } from "@/api/entities";
import { SlidersHorizontal, X, ChevronDown, Crown, Heart, Shield, Brain, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const INTERESTS = [
  "Travel",
  "Music",
  "Cooking",
  "Sports",
  "Reading",
  "Movies",
  "Fitness",
  "Art",
  "Gaming",
  "Photography",
  "Yoga",
  "Hiking",
  "Dancing",
  "Fashion",
  "Technology",
];

const GOAL_LABELS = {
  long_term: "Long-term",
  casual_dating: "Casual dating",
  friendship_first: "Friendship first",
  marriage_minded: "Marriage-minded",
  open_to_anything: "Open to anything",
};

const DEFAULT_FILTERS = {
  ageMin: 18,
  ageMax: 60,
  relationshipGoals: [],
  interests: [],
  maxDistance: 0,
  onlineOnly: false,
};

export default function SearchFilters({ onFiltersChange }) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draft, setDraft] = useState(DEFAULT_FILTERS);
  
  // Check if user has Premium
  const { data: sub } = useQuery({ queryKey: ["subscription"], queryFn: subscriptionService.get });
  const isPremium = sub && (sub.plan === "premium" || sub.plan === "hot_love");
  const hasCasualAddon = sub && sub.casual_addon && new Date(sub.casual_addon_expires_at) > new Date();

  const activeCount = [
    filters.ageMin !== 18 || filters.ageMax !== 60,
    filters.relationshipGoals.length > 0,
    filters.interests.length > 0,
    filters.maxDistance > 0,
    filters.onlineOnly,
    filters.datingIntent?.length > 0,
    filters.values?.length > 0,
    filters.lifestyle?.smoking || filters.lifestyle?.drinking,
  ].filter(Boolean).length;

  const toggleGoal = (goal) => {
    setDraft((d) => ({
      ...d,
      relationshipGoals: d.relationshipGoals.includes(goal)
        ? d.relationshipGoals.filter((g) => g !== goal)
        : [...d.relationshipGoals, goal],
    }));
  };

  const toggleIntent = (intent) => {
    setDraft((d) => ({
      ...d,
      datingIntent: d.datingIntent?.includes(intent)
        ? d.datingIntent.filter((i) => i !== intent)
        : [...(d.datingIntent || []), intent],
    }));
  };

  const toggleValue = (value) => {
    setDraft((d) => ({
      ...d,
      values: d.values?.includes(value)
        ? d.values.filter((v) => v !== value)
        : [...(d.values || []), value],
    }));
  };

  const toggleInterest = (interest) => {
    setDraft((d) => ({
      ...d,
      interests: d.interests.includes(interest)
        ? d.interests.filter((i) => i !== interest)
        : [...d.interests, interest],
    }));
  };

  const applyFilters = () => {
    setFilters(draft);
    onFiltersChange(draft);
    setOpen(false);
  };

  const resetFilters = () => {
    setDraft(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
    setOpen(false);
  };

  return (
    <div className="relative mb-6">
      <Button
        variant="outline"
        onClick={() => {
          setDraft(filters);
          setOpen(!open);
        }}
        className={`rounded-2xl border-2 h-10 px-4 gap-2 ${activeCount > 0 ? "border-rose-400 text-rose-600 bg-rose-50" : "border-gray-200 text-gray-600"}`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters
        {activeCount > 0 && (
          <span className="bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-12 z-40 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 w-80 md:w-96"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Search Filters</h3>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dating Intent - Premium Only */}
              {isPremium && (
                <div className="mb-5 border-t border-gray-100 pt-4">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    Dating Intent
                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Premium</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(INTENT_LABELS).map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => toggleIntent(value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          draft.datingIntent?.includes(value)
                            ? "bg-purple-100 border-purple-400 text-purple-700"
                            : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Match only with users who share your intentions</p>
                </div>
              )}

              {/* Values Alignment - Premium Only */}
              {isPremium && (
                <div className="mb-5 border-t border-gray-100 pt-4">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    Core Values
                    <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Premium</span>
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {VALUES.map((value) => (
                      <button
                        key={value}
                        onClick={() => toggleValue(value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          draft.values?.includes(value)
                            ? "bg-rose-100 border-rose-400 text-rose-700"
                            : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lifestyle Preferences - Premium Only */}
              {isPremium && (
                <div className="mb-5 border-t border-gray-100 pt-4">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Lifestyle
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Premium</span>
                  </label>
                  <div className="space-y-3">
                    {Object.entries(LIFESTYLE_TRAITS).slice(0, 2).map(([key, options]) => (
                      <div key={key}>
                        <label className="text-xs text-gray-500 capitalize mb-1 block">{key}</label>
                        <select
                          value={draft.lifestyle?.[key] || ""}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              lifestyle: { ...d.lifestyle, [key]: e.target.value || undefined },
                            }))
                          }
                          className="w-full rounded-xl border-gray-200 text-sm"
                        >
                          <option value="">Any</option>
                          {options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Casual Add-On Badge */}
              {hasCasualAddon && (
                <div className="mb-4 bg-gradient-to-r from-rose-50 to-purple-50 border-2 border-rose-200 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-rose-700 uppercase">Casual Connection Active</span>
                  </div>
                  <p className="text-xs text-rose-600">You're matching with like-minded people open to short-term connections</p>
                </div>
              )}

              {/* Online Now Filter */}
              <div className="mb-5 flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${draft.onlineOnly ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700 block">Online Now</span>
                    <span className="text-[10px] text-gray-500">Only show active users</span>
                  </div>
                </div>
                <button
                  onClick={() => setDraft(d => ({ ...d, onlineOnly: !d.onlineOnly }))}
                  className={`w-10 h-5 rounded-full relative transition-colors ${draft.onlineOnly ? "bg-green-500" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${draft.onlineOnly ? "translate-x-5.5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {/* Distance Filter */}
              <div className="mb-5">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Max Distance:{" "}
                  <span className="text-rose-500">
                    {draft.maxDistance === 0
                      ? "Any"
                      : `${draft.maxDistance} km`}
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={10}
                  value={draft.maxDistance}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      maxDistance: parseInt(e.target.value),
                    }))
                  }
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Any</span>
                  <span>500 km</span>
                </div>
              </div>

              {/* Age Range */}
              <div className="mb-5">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Age Range:{" "}
                  <span className="text-rose-500">
                    {draft.ageMin} – {draft.ageMax}
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">Min</div>
                    <input
                      type="range"
                      min={18}
                      max={draft.ageMax - 1}
                      value={draft.ageMin}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          ageMin: parseInt(e.target.value),
                        }))
                      }
                      className="w-full accent-rose-500"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">Max</div>
                    <input
                      type="range"
                      min={draft.ageMin + 1}
                      max={80}
                      value={draft.ageMax}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          ageMax: parseInt(e.target.value),
                        }))
                      }
                      className="w-full accent-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Relationship Goals */}
              <div className="mb-5">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Relationship Goals
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(GOAL_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => toggleGoal(value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        draft.relationshipGoals.includes(value)
                          ? "bg-purple-100 border-purple-400 text-purple-700"
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div className="mb-5">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Shared Interests
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        draft.interests.includes(interest)
                          ? "bg-rose-100 border-rose-400 text-rose-700"
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="flex-1 rounded-2xl text-sm"
                >
                  Reset
                </Button>
                <Button
                  onClick={applyFilters}
                  className="flex-1 rounded-2xl text-sm bg-gradient-to-r from-rose-500 to-purple-600 text-white"
                >
                  Apply Filters
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
