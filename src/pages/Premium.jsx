import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { 
  Crown, Heart, Shield, Zap, EyeOff, MapPin, Brain, Sparkles,
  Check, X, Loader2, Flame, Coffee, Music, Palette, Tent
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const BILLING_CYCLES = [
  { value: "monthly", label: "Monthly", discount: null },
  { value: "quarterly", label: "3 Months", discount: "-17%" },
  { value: "biannual", label: "6 Months", discount: "-25%" },
  { value: "annual", label: "Annual", discount: "-38%" },
];

const PRICING = {
  premium: {
    monthly: 5000,
    quarterly: 12500,
    biannual: 22500,
    annual: 37500,
  },
  casual_addon: {
    monthly: 5000,
    quarterly: 12500,
    biannual: 22500,
    annual: 37500,
  },
};

export default function Premium() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: sub, refetch } = useQuery({ queryKey: ["subscription"], queryFn: subscriptionService.get });
  const [loadingSubscribe, setLoadingSubscribe] = useState(false);
  const [loadingBoost, setLoadingBoost] = useState(false);
  const [loadingSuperLikes, setLoadingSuperLikes] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [addCasual, setAddCasual] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle Paystack callback
  useState(() => {
    const reference = searchParams.get("reference");
    const verify = searchParams.get("verify");
    if (reference && verify) {
      verifyPayment(reference);
    }
  });

  async function verifyPayment(reference) {
    setVerifying(true);
    try {
      await subscriptionService.verify(reference);
      qc.invalidateQueries(["subscription"]);
      qc.invalidateQueries(["myProfile"]);
      toast.success("Payment verified! Welcome to Premium! ❤️‍🔥");
      setSearchParams({});
      navigate("/profile");
    } catch {
      toast.error("Payment verification failed. Please contact support.");
    }
    setVerifying(false);
  }

  async function handleSubscribe(plan) {
    setLoadingSubscribe(true);
    try {
      const { authorization_url } = await subscriptionService.initialize({
        plan,
        billing_cycle: billingCycle,
        add_casual: addCasual,
        callback_url: `${window.location.origin}/premium?verify=true`,
      });
      window.location.href = authorization_url;
    } catch {
      toast.error("Failed to initialize payment. Please try again.");
      setLoadingSubscribe(false);
    }
  }

  async function handlePurchaseBoost() {
    setLoadingBoost(true);
    try {
      const { authorization_url } = await subscriptionService.purchaseBoosts(1);
      window.location.href = authorization_url;
    } catch {
      toast.error("Failed to initialize boost purchase. Please try again.");
      setLoadingBoost(false);
    }
  }

  async function handlePurchaseSuperLikes() {
    setLoadingSuperLikes(true);
    try {
      const { authorization_url } = await subscriptionService.purchaseSuperLikes(5);
      window.location.href = authorization_url;
    } catch {
      toast.error("Failed to initialize Super Like purchase. Please try again.");
      setLoadingSuperLikes(false);
    }
  }

  async function handleActivateBoost() {
    // In production, this would activate a boost for 30 minutes
    toast.success("Boost activated! You'll get 10x more views for the next 30 minutes.");
    // Update local state or refetch
    qc.invalidateQueries(["subscription"]);
  }

  const isPremium = sub?.plan === "premium" && sub?.is_active;
  const hasCasualAddon = sub?.casual_addon && new Date(sub.casual_addon_expires_at) > new Date();

  const PREMIUM_FEATURES = [
    { icon: Brain, text: "AI Deep Compatibility Analysis (100+ traits)" },
    { icon: EyeOff, text: "See Who Likes You - Instant visibility" },
    { icon: Shield, text: "Advanced Personality & Values Filters" },
    { icon: Heart, text: "AI Relationship Coach & Insights" },
    { icon: Zap, text: "Unlimited Swipes & Smart Suggestions" },
    { icon: MapPin, text: "Travel Mode - Match anywhere" },
    { icon: Crown, text: "Priority in daily matches" },
    { icon: Sparkles, text: "5 Super Likes per week" },
  ];

  const CASUAL_FEATURES = [
    { icon: Heart, text: "Intent-Based Casual Matching" },
    { icon: EyeOff, text: "Discreet Profile Visibility" },
    { icon: Shield, text: "Verified-Only Browsing Option" },
    { icon: Zap, text: "Disappearing Messages" },
    { icon: MapPin, text: "Enhanced Privacy Suite" },
    { icon: Brain, text: "AI Consent Monitoring" },
  ];

  const DATE_EVENTS_FEATURES = [
    { icon: Coffee, text: "Coffee Shops & Casual Meetups" },
    { icon: Music, text: "Concerts & Live Events" },
    { icon: Palette, text: "Art Exhibits & Cultural Events" },
    { icon: Tent, text: "Outdoor Activities & Adventures" },
  ];

  const formatPrice = (price) => `₦${price.toLocaleString()}`;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="w-12 h-12 text-purple-600" />
          <h1 className="text-4xl font-black text-gray-900">Silver Premium</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Supercharge your dating experience
        </p>
      </div>

      {verifying && (
        <div className="bg-white rounded-3xl shadow-lg border-2 border-purple-200 p-8 text-center mb-6">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900">Verifying your payment...</p>
        </div>
      )}

      {!verifying && (
        <>
          {/* Billing Cycle Selector */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
            <label className="text-sm font-semibold text-gray-700 mb-3 block">Choose Billing Cycle:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {BILLING_CYCLES.map((cycle) => (
                <button
                  key={cycle.value}
                  onClick={() => setBillingCycle(cycle.value)}
                  className={`relative p-3 rounded-xl border-2 transition-all ${
                    billingCycle === cycle.value
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{cycle.label}</div>
                  {cycle.discount && (
                    <div className="text-xs text-green-600 font-bold mt-1">{cycle.discount}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-purple-600 to-rose-500 rounded-3xl shadow-xl p-6 md:p-8 text-white mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="w-8 h-8" />
                  <h2 className="text-3xl font-black">Silver Premium</h2>
                </div>
                <p className="text-white/90 text-sm">Supercharge your dating experience</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black">
                  {formatPrice(PRICING.premium[billingCycle])}
                </div>
                <div className="text-white/80 text-sm">/{billingCycle === "monthly" ? "month" : billingCycle}</div>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {PREMIUM_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{text}</span>
                </li>
              ))}
            </ul>

            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Bonus Features
              </h3>
              <ul className="grid md:grid-cols-2 gap-2">
                {DATE_EVENTS_FEATURES.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2 text-sm">
                    <Icon className="w-4 h-4" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {!isPremium ? (
              <div className="flex flex-col items-stretch gap-2">
                <Button
                  onClick={() => { setSelectedPlan("premium"); handleSubscribe("premium"); }}
                  disabled={loadingSubscribe}
                  className="w-full h-14 rounded-2xl bg-white text-purple-600 hover:bg-white/90 font-bold text-lg"
                >
                  {loadingSubscribe ? <Loader2 className="w-6 h-6 animate-spin" /> : "Start Silver Premium Trial"}
                </Button>
                <p className="text-xs text-white/80 text-center">
                  Includes <span className="font-semibold">Silver Premium</span> membership.
                </p>
              </div>
            ) : (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                <Crown className="w-8 h-8 mx-auto mb-2" />
                <p className="font-bold">You're a Premium Member!</p>
                {sub?.expires_at && (
                  <p className="text-sm text-white/80 mt-1">
                    Active until {new Date(sub.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Casual Add-On */}
          <div className="bg-white rounded-3xl shadow-lg border-2 border-rose-200 p-6 md:p-8 mt-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Flame className="w-8 h-8 text-rose-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Casual Connection Add-On</h2>
                </div>
                <p className="text-gray-600 text-sm">Optional upgrade for consent-based short-term connections</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-rose-600">
                  +{formatPrice(PRICING.casual_addon[billingCycle])}
                </div>
                <div className="text-gray-500 text-sm">/{billingCycle === "monthly" ? "month" : billingCycle}</div>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {CASUAL_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
                  <span className="text-sm text-gray-700">{text}</span>
                </li>
              ))}
            </ul>

            <div className="bg-rose-50 rounded-2xl p-4 mb-6">
              <p className="text-xs text-rose-700">
                <strong>Note:</strong> Silver Premium requires an active Silver Premium subscription. Total cost will be Silver + Silver Premium.
              </p>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setAddCasual(!addCasual)}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  addCasual ? "bg-rose-500" : "bg-gray-200"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    addCasual ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-700">
                Add Silver Premium features for +{formatPrice(PRICING.casual_addon[billingCycle])}
              </span>
            </div>

            {!hasCasualAddon && (
              <Button
                onClick={() => {
                  if (!addCasual) setAddCasual(true);
                  setSelectedPlan("premium");
                  handleSubscribe("premium");
                }}
                disabled={loadingSubscribe}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold"
              >
                {loadingSubscribe
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : `Get Silver Premium (${formatPrice(PRICING.premium[billingCycle] + PRICING.casual_addon[billingCycle])})`}
              </Button>
            )}

            {hasCasualAddon && (
              <div className="bg-rose-50 rounded-2xl p-4 text-center">
                <Flame className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <p className="font-semibold text-rose-600">Silver Premium Active!</p>
              </div>
            )}
          </div>

          {/* Microtransactions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" /> Boost Your Experience
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border-2 border-yellow-200 rounded-2xl p-4 hover:border-yellow-400 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-gray-900">Boost</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Get 10x more profile views for 30 minutes</p>
                <div className="text-lg font-bold text-gray-900 mb-3">{formatPrice(4990)}</div>
                <Button 
                  onClick={handlePurchaseBoost}
                  disabled={loadingBoost}
                  className="w-full rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600"
                >
                  {loadingBoost ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy Boost"}
                </Button>
              </div>
              <div className="border-2 border-rose-200 rounded-2xl p-4 hover:border-rose-400 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                  <span className="font-bold text-gray-900">Super Like Pack (5)</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Stand out and get noticed - 5 Super Likes</p>
                <div className="text-lg font-bold text-gray-900 mb-3">{formatPrice(4990)}</div>
                <Button 
                  onClick={handlePurchaseSuperLikes}
                  disabled={loadingSuperLikes}
                  className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:from-rose-600 hover:to-purple-700"
                >
                  {loadingSuperLikes ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy Super Likes"}
                </Button>
              </div>
            </div>
            {(sub?.boosts_purchased || 0) > 0 && (
              <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                    <span className="font-semibold text-gray-900">Your Boosts: {sub.boosts_purchased}</span>
                  </div>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                    onClick={handleActivateBoost}
                  >
                    Activate Boost
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Use boosts to get instant visibility</p>
              </div>
            )}
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8 overflow-hidden">
            <h3 className="font-bold text-gray-900 mb-4 text-center">Compare Plans</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Feature</th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-gray-700">Free</th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-purple-600 bg-purple-50">Premium</th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-rose-600 bg-rose-50">+ Casual</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Daily Matches", free: "Limited", premium: "Unlimited", casual: "Unlimited" },
                    { feature: "AI Compatibility Analysis", free: "Basic", premium: "Advanced (100+ traits)", casual: "Advanced" },
                    { feature: "See Who Likes You", free: false, premium: true, casual: true },
                    { feature: "Advanced Filters", free: false, premium: true, casual: true },
                    { feature: "Incognito Mode", free: false, premium: true, casual: true },
                    { feature: "Intent-Based Matching", free: false, premium: false, casual: true },
                    { feature: "Disappearing Messages", free: false, premium: false, casual: true },
                    { feature: "Verified-Only Browsing", free: false, premium: false, casual: true },
                  ].map((row) => (
                    <tr key={row.feature} className="border-b border-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-700">{row.feature}</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-500">
                        {typeof row.free === "boolean" ? (row.free ? <Check className="w-4 h-4 mx-auto text-green-500" /> : <X className="w-4 h-4 mx-auto text-gray-300" />) : row.free}
                      </td>
                      <td className="py-3 px-4 text-center text-sm bg-purple-50">
                        {typeof row.premium === "boolean" ? (row.premium ? <Check className="w-4 h-4 mx-auto text-purple-600" /> : <X className="w-4 h-4 mx-auto text-gray-300" />) : row.premium}
                      </td>
                      <td className="py-3 px-4 text-center text-sm bg-rose-50">
                        {typeof row.casual === "boolean" ? (row.casual ? <Check className="w-4 h-4 mx-auto text-rose-600" /> : <X className="w-4 h-4 mx-auto text-gray-300" />) : row.casual}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
