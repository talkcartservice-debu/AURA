import { useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Flame, Check, Loader2, EyeOff, Crown, Zap, Heart, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export default function HotLove() {
  const qc = useQueryClient();
  const { data: sub, refetch } = useQuery({ queryKey: ["subscription"], queryFn: subscriptionService.get });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle Paystack callback — verify payment when redirected back
  useEffect(() => {
    const reference = searchParams.get("reference");
    const verify = searchParams.get("verify");
    if (reference && verify) {
      verifyPayment(reference);
    }
  }, [searchParams]);

  async function verifyPayment(reference) {
    setVerifying(true);
    try {
      await subscriptionService.verify(reference);
      qc.invalidateQueries(["subscription"]);
      qc.invalidateQueries(["myProfile"]);
      toast.success("Payment verified! Welcome to Hot Love! \u2764\ufe0f\u200d\ud83d\udd25");
      // Clean up URL params
      setSearchParams({});
    } catch {
      toast.error("Payment verification failed. Please contact support.");
    }
    setVerifying(false);
  }

  async function handleSubscribe() {
    setLoading(true);
    try {
      const { authorization_url } = await subscriptionService.initialize({
        plan: "hot_love",
        billing_cycle: "monthly",
        callback_url: `${window.location.origin}/hot-love?verify=true`,
      });
      // Redirect to Paystack checkout
      window.location.href = authorization_url;
    } catch (err) {
      console.error("Initialize error:", err);
      toast.error("Failed to initialize payment. Please try again.");
      setLoading(false);
    }
  }

  const isActive = sub?.plan === "hot_love" && sub?.is_active;
  const PERKS = [
    { icon: Crown, text: "Priority in daily matches" },
    { icon: Heart, text: "See who liked you" },
    { icon: Zap, text: "Unlimited likes per day" },
    { icon: Flame, text: "Exclusive Hot Love badge" },
    { icon: Shield, text: "Advanced search filters" },
    { icon: EyeOff, text: "Incognito mode — browse invisibly" },
  ];

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="bg-gradient-to-br from-orange-500 to-rose-600 rounded-3xl p-6 text-white mb-6">
        <Flame className="w-12 h-12 mb-4" />
        <h1 className="text-3xl font-black mb-2">Hot Love</h1>
        <p className="text-white/80 text-sm">Supercharge your dating experience</p>
        <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 inline-block">
          <span className="text-2xl font-black">\u20A65,000</span>
          <span className="text-white/80 text-sm">/month</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-4">What you get:</h2>
        <ul className="space-y-3 mb-6">
          {PERKS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-rose-500" />
              </div>
              {text}
            </li>
          ))}
        </ul>

        {verifying ? (
          <div className="text-center py-4">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Verifying your payment...</p>
          </div>
        ) : isActive ? (
          <div className="text-center py-4 bg-rose-50 rounded-2xl">
            <Flame className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-rose-600 font-semibold">You're a Hot Love member! \u2764\ufe0f\u200d\ud83d\udd25</p>
            {sub?.expires_at && (
              <p className="text-xs text-rose-400 mt-1">Active until {new Date(sub.expires_at).toLocaleDateString()}</p>
            )}
          </div>
        ) : (
          <div>
            <Button onClick={handleSubscribe} disabled={loading} className="w-full rounded-2xl h-12 bg-gradient-to-r from-orange-500 to-rose-600 text-white font-semibold text-lg">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pay with Paystack"}
            </Button>
            <p className="text-xs text-gray-400 text-center mt-3">Secure payment powered by Paystack</p>
          </div>
        )}
      </div>
    </div>
  );
}
