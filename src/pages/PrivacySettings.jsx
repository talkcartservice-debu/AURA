import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { privacyService } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { 
  EyeOff, Eye, Shield, Lock, AlertTriangle, Camera, Clock, CheckCircle,
  Loader2, Crown, Flame, Info
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function PrivacySettings() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ["privacy-settings"],
    queryFn: privacyService.getSettings,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => privacyService.updateSettings(data),
    onSuccess: () => {
      qc.invalidateQueries(["privacy-settings"]);
      toast.success("Privacy settings updated!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Failed to update settings");
    },
  });

  const [localSettings, setLocalSettings] = useState({
    is_incognito: false,
    hide_from_contacts: false,
    screenshot_alerts_enabled: false,
    show_blurred_to_public: false,
    disappearing_messages_default: false,
    verified_only_browsing: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const hasPrivacySuite = settings?.has_privacy_suite;
  const hasCasualAddon = settings?.has_casual_addon;

  const toggleSetting = (key) => {
    const newValue = !localSettings[key];
    setLocalSettings(prev => ({ ...prev, [key]: newValue }));
    updateMutation.mutate({ [key]: newValue });
  };

  const SettingToggle = ({ 
    settingKey, 
    icon: Icon, 
    title, 
    description, 
    requiresPremium = false,
    requiresCasual = false 
  }) => {
    const isLocked = (requiresPremium && !hasPrivacySuite) || 
                     (requiresCasual && !hasCasualAddon);
    const isEnabled = localSettings[settingKey];

    return (
      <div className={`rounded-2xl border-2 p-4 transition-all ${
        isEnabled 
          ? "border-purple-300 bg-purple-50/50" 
          : "border-gray-100 bg-white"
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isEnabled 
                ? "bg-gradient-to-br from-purple-500 to-rose-500 text-white" 
                : "bg-gray-100 text-gray-400"
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                {isLocked && (
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                )}
                {requiresCasual && hasCasualAddon && (
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                )}
              </div>
              <p className="text-sm text-gray-500 mb-2">{description}</p>
              {isLocked && requiresPremium && !hasPrivacySuite && (
                <button
                  onClick={() => navigate("/premium")}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  <Crown className="w-3 h-3" />
                  Unlock with Premium
                </button>
              )}
              {isLocked && requiresCasual && !hasCasualAddon && (
                <button
                  onClick={() => navigate("/premium")}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                >
                  <Flame className="w-3 h-3" />
                  Add Silver Premium features (+₦5,000/mo)
                </button>
              )}
            </div>
          </div>
          
          <button
            onClick={() => !isLocked && toggleSetting(settingKey)}
            disabled={isLocked}
            className={`w-12 h-6 rounded-full relative transition-colors ${
              isEnabled 
                ? "bg-purple-500" 
                : isLocked 
                  ? "bg-gray-200 cursor-not-allowed" 
                  : "bg-gray-200"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                isEnabled ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        
        {isEnabled && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-600">
            <CheckCircle className="w-3 h-3" />
            <span>Active</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Settings</h1>
        <p className="text-sm text-gray-500">
          Control your visibility and protect your privacy
        </p>
      </div>

      {/* Subscription Status Banner */}
      {(hasPrivacySuite || hasCasualAddon) && (
        <div className={`rounded-2xl p-4 mb-6 border-2 ${
          hasCasualAddon 
            ? "bg-gradient-to-r from-rose-50 to-purple-50 border-rose-200"
            : "bg-gradient-to-r from-purple-50 to-rose-50 border-purple-200"
        }`}>
          <div className="flex items-center gap-3 mb-2">
              {hasCasualAddon ? (
                <>
                  <Flame className="w-5 h-5 text-rose-600" />
                  <span className="font-bold text-rose-700">Silver Premium Active</span>
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5 text-purple-600" />
                  <span className="font-bold text-purple-700">Silver Premium Active</span>
                </>
              )}
          </div>
          <p className="text-xs text-gray-600">
            {hasCasualAddon 
              ? "You have access to all Silver Premium privacy features including disappearing messages"
              : "Upgrade to Silver Premium for disappearing messages and verified-only browsing"}
          </p>
        </div>
      )}

      {/* Core Privacy Features */}
      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          Core Privacy
        </h2>
        
        <SettingToggle
          settingKey="is_incognito"
          icon={EyeOff}
          title="Incognito Mode"
          description="Browse without appearing in others' discovery feed. You'll only appear to people you've liked."
          requiresPremium={true}
        />
        
        <SettingToggle
          settingKey="hide_from_contacts"
          icon={Lock}
          title="Hide From Contacts"
          description="Prevent people with your phone number from seeing your profile in discovery."
          requiresPremium={true}
        />

        <SettingToggle
          settingKey="screenshot_alerts_enabled"
          icon={AlertTriangle}
          title="Screenshot Alerts"
          description="Get notified when someone takes a screenshot of your profile or photos."
          requiresPremium={true}
        />
      </div>

      {/* Photo Privacy */}
      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Camera className="w-5 h-5 text-rose-600" />
          Photo Privacy
        </h2>

        <SettingToggle
          settingKey="show_blurred_to_public"
          icon={Eye}
          title="Blurred Photos for Non-Matches"
          description="Your photos appear blurred to users who haven't matched with you yet. Clear photos visible after matching."
        />

        {settings?.blurred_photos_count > 0 && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">
                Blurred Photos Active
              </span>
            </div>
            <p className="text-xs text-blue-600">
              You have {settings.blurred_photos_count} blurred photo(s) that will be shown to non-matches
            </p>
          </div>
        )}
      </div>

      {/* Casual Add-On Features */}
      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Flame className="w-5 h-5 text-rose-600" />
          Casual Connection Features
          {hasCasualAddon && (
            <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </h2>

        <SettingToggle
          settingKey="disappearing_messages_default"
          icon={Clock}
          title="Disappearing Messages"
          description="Messages auto-delete after 24 hours. Enable by default for all new conversations."
          requiresCasual={true}
        />

        <SettingToggle
          settingKey="verified_only_browsing"
          icon={Shield}
          title="Verified-Only Browsing"
          description="Only see and match with verified users. Adds an extra layer of safety and authenticity."
          requiresCasual={true}
        />

        {!hasCasualAddon && (
          <div className="bg-gradient-to-r from-rose-50 to-purple-50 border-2 border-rose-200 rounded-2xl p-4">
            <h3 className="font-bold text-rose-700 mb-2 flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Unlock Full Privacy Suite
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Get access to disappearing messages, verified-only browsing, and enhanced consent monitoring
            </p>
            <Button
              onClick={() => navigate("/premium")}
              className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white"
            >
              Add Silver Premium - ₦5,000/mo
            </Button>
          </div>
        )}
      </div>

      {/* Privacy Tips */}
      <div className="bg-gray-50 rounded-2xl p-4 mt-6">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-600" />
          Privacy Tips
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">•</span>
            <span>Use Incognito Mode if you want to browse discreetly</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">•</span>
            <span>Enable blurred photos to maintain privacy until you're ready</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">•</span>
            <span>Disappearing messages ensure conversations stay private</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">•</span>
            <span>Verified-only browsing reduces fake profiles</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
