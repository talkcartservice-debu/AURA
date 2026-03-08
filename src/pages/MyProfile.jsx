import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService, profileService, subscriptionService, uploadService } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import PhotoUpload from "@/components/profile/PhotoUpload";
import HobbyEditor from "@/components/profile/HobbyEditor";
import ValuesEditor from "@/components/profile/ValuesEditor";
import DealbreakersEditor from "@/components/profile/DealbreakersEditor";
import LifestyleEditor from "@/components/profile/LifestyleEditor";
import RelationshipExpectationsEditor from "@/components/profile/RelationshipExpectationsEditor";
import AIBioGenerator from "@/components/profile/AIBioGenerator";
import BiometricSettings from "@/components/profile/BiometricSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LogOut, Loader2, ShieldCheck, Brain, Flame, Save, Camera,
  EyeOff, Eye, MapPin, Heart, Dumbbell, Utensils, Wine, Cigarette,
  Target, Sparkles, Fingerprint,
} from "lucide-react";
import { toast } from "sonner";

const GOAL_LABELS = {
  long_term: "Long-term relationship",
  casual_dating: "Casual dating",
  friendship_first: "Friendship first",
  marriage_minded: "Marriage-minded",
  open_to_anything: "Open to anything",
};

const LIFESTYLE_LABELS = {
  smoking: { icon: Cigarette, label: "Smoking" },
  drinking: { icon: Wine, label: "Drinking" },
  exercise: { icon: Dumbbell, label: "Exercise" },
  diet: { icon: Utensils, label: "Diet" },
};

function getCompletionPercent(profile) {
  if (!profile) return 0;
  const fields = [
    !!profile.display_name,
    !!profile.age,
    !!profile.bio,
    !!profile.location,
    (profile.photos?.length || 0) > 0,
    (profile.interests?.length || 0) > 0,
    (profile.values?.length || 0) > 0,
    !!profile.relationship_goals,
    (profile.hobbies?.length || 0) > 0,
    !!(profile.lifestyle?.smoking || profile.lifestyle?.drinking || profile.lifestyle?.exercise || profile.lifestyle?.diet),
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

export default function MyProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery({ queryKey: ["myProfile"], queryFn: profileService.getMe });
  const { data: sub } = useQuery({ queryKey: ["subscription"], queryFn: subscriptionService.get });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [togglingIncognito, setTogglingIncognito] = useState(false);

  const isSilverPremium = sub?.plan === "premium" && sub?.is_active;

  function startEdit() {
    setForm({ ...profile });
    setEditing(true);
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      await profileService.updateMe(form);
      qc.invalidateQueries(["myProfile"]);
      setEditing(false);
      toast.success("Profile updated!");
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  async function handleProfilePicChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadService.single(file);
      const currentPhotos = profile?.photos || [];
      const newPhotos = [url, ...currentPhotos.filter((p) => p !== url)];
      await profileService.updateMe({ photos: newPhotos });
      qc.invalidateQueries(["myProfile"]);
      toast.success("Profile picture updated!");
    } catch {
      toast.error("Failed to upload photo");
    }
    setUploadingPhoto(false);
  }

  async function handleToggleIncognito() {
    if (!isSilverPremium) {
      toast.error("Incognito mode is a Silver Premium feature");
      navigate("/silver");
      return;
    }
    setTogglingIncognito(true);
    try {
      await profileService.updateMe({ is_incognito: !profile.is_incognito });
      qc.invalidateQueries(["myProfile"]);
      toast.success(profile.is_incognito ? "Incognito mode disabled" : "Incognito mode enabled");
    } catch { toast.error("Failed to toggle incognito"); }
    setTogglingIncognito(false);
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>;

  const completion = getCompletionPercent(profile);

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">My Profile</h1>
        <Button variant="ghost" onClick={() => { logout(); navigate("/"); }} className="text-gray-400 gap-1"><LogOut className="w-4 h-4" /> Logout</Button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-rose-500 to-purple-600 p-6 pb-16 relative">
          {profile?.is_incognito && (
            <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
              <EyeOff className="w-3 h-3" /> Incognito
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          {/* Profile Picture */}
          <div className="flex justify-center -mt-14 mb-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-rose-400 to-purple-500">
                {profile?.photos?.[0] ? (
                  <img src={profile.photos[0]} alt={profile.display_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                    {(profile?.display_name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-rose-500 text-white rounded-full p-2 shadow-md cursor-pointer hover:bg-rose-600 transition-colors">
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <input type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" disabled={uploadingPhoto} />
              </label>
            </div>
          </div>

          {/* Premium CTA under avatar */}
          {(!sub || sub.plan === "free") && (
            <div className="flex justify-center mb-4">
              <Button
                size="sm"
                onClick={() => navigate("/premium")}
                className="rounded-full px-4 h-8 bg-gradient-to-r from-purple-600 to-rose-500 text-white text-xs font-semibold"
              >
                Go Premium
              </Button>
            </div>
          )}

          {/* Name & Badges */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-1.5">
              {profile?.display_name}
              {profile?.age && <span className="font-normal text-gray-400">, {profile.age}</span>}
              <button onClick={() => navigate("/verification")} className="flex items-center gap-1">
                {profile?.is_verified ? (
                  <ShieldCheck className="w-4 h-4 text-blue-500" title="Identity Verified" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-gray-300 hover:text-blue-400 transition-colors" title="Get Verified" />
                )}
                {profile?.is_personality_verified ? (
                  <Brain className="w-4 h-4 text-purple-500" title="Personality Verified" />
                ) : (
                  <Brain className="w-4 h-4 text-gray-300 hover:text-purple-400 transition-colors" title="Get Personality Verified" />
                )}
              </button>
              {isSilverPremium && <Flame className="w-4 h-4 text-orange-500" title={sub.plan === "premium" && sub.casual_addon ? "Gold Premium" : "Silver Premium"} />}
            </h2>
            {user?.username && (
              <p className="text-sm text-gray-400">@{user.username}</p>
            )}
            {profile?.location && (
              <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-1">
                <MapPin className="w-3 h-3" /> {profile.location}
              </div>
            )}
          </div>

          {/* Completion Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-gray-500">Profile Completion</span>
              <span className="font-bold text-rose-500">{completion}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-500 to-purple-600 rounded-full transition-all duration-500" style={{ width: `${completion}%` }} />
            </div>
          </div>

          {!editing ? (
            <div className="space-y-4">
              {profile?.bio && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">About</label>
                  <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {profile?.interests?.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block flex items-center gap-1"><Sparkles className="w-3 h-3" /> Interests</label>
                  <div className="flex flex-wrap gap-1.5">{profile.interests.map(i => <span key={i} className="px-2.5 py-1 bg-rose-50 text-rose-600 text-xs font-medium rounded-full">{i}</span>)}</div>
                </div>
              )}

              {profile?.hobbies?.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Hobbies</label>
                  <div className="flex flex-wrap gap-1.5">{profile.hobbies.map(h => <span key={h} className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">{h}</span>)}</div>
                </div>
              )}

              {profile?.values?.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block flex items-center gap-1"><Heart className="w-3 h-3" /> Values</label>
                  <div className="flex flex-wrap gap-1.5">{profile.values.map(v => <span key={v} className="px-2.5 py-1 bg-purple-50 text-purple-600 text-xs font-medium rounded-full">{v}</span>)}</div>
                </div>
              )}

              {profile?.dealbreakers?.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Dealbreakers</label>
                  <div className="flex flex-wrap gap-1.5">{profile.dealbreakers.map(d => <span key={d} className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">{d}</span>)}</div>
                </div>
              )}

              {profile?.relationship_goals && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block flex items-center gap-1"><Target className="w-3 h-3" /> Relationship Goal</label>
                  <p className="text-sm text-gray-600">{GOAL_LABELS[profile.relationship_goals]}</p>
                </div>
              )}

              {profile?.relationship_expectations?.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Expectations</label>
                  <div className="flex flex-wrap gap-1.5">{profile.relationship_expectations.map(e => <span key={e} className="px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-full">{e}</span>)}</div>
                </div>
              )}

              {profile?.lifestyle && Object.entries(profile.lifestyle).some(([, v]) => v) && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Lifestyle</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(LIFESTYLE_LABELS).map(([key, { icon: Icon, label }]) => {
                      const val = profile.lifestyle?.[key];
                      if (!val) return null;
                      return (
                        <div key={key} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                          <Icon className="w-3.5 h-3.5 text-gray-400" />
                          <div>
                            <span className="text-xs text-gray-400">{label}</span>
                            <p className="text-xs font-medium text-gray-700 capitalize">{val}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {profile?.photos?.length > 1 && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Photos</label>
                  <div className="grid grid-cols-3 gap-2">
                    {profile.photos.map((url, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden border border-gray-100">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={startEdit} variant="outline" className="w-full rounded-2xl">Edit Profile</Button>

      {/* Incognito Toggle */}
      <button
        onClick={handleToggleIncognito}
        disabled={togglingIncognito}
        className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 border transition-all ${
          profile?.is_incognito
            ? "bg-gray-900 border-gray-800 text-white"
            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2">
          {profile?.is_incognito ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <div className="text-left">
            <p className="text-sm font-semibold">Incognito Mode</p>
            <p className={`text-xs ${profile?.is_incognito ? "text-gray-400" : "text-gray-400"}`}>
              {profile?.is_incognito ? "You're hidden from discovery" : "Browse without being seen"}
            </p>
          </div>
        </div>
        {togglingIncognito ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <div className={`w-10 h-6 rounded-full relative transition-colors ${profile?.is_incognito ? "bg-purple-500" : "bg-gray-200"}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${profile?.is_incognito ? "translate-x-5" : "translate-x-1"}`} />
          </div>
        )}
      </button>
      {!isSilverPremium && (
        <p className="text-xs text-gray-400 text-center -mt-2">Requires Silver Premium subscription</p>
      )}

      {/* Password Update Section */}
      <div className="mt-6 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-rose-500" />
          Update Password
        </h3>
        <div className="space-y-3">
          <Input id="currentPass" type="password" placeholder="Current Password" color="rose" className="rounded-xl" />
          <Input id="newPass" type="password" placeholder="New Password" color="rose" className="rounded-xl" />
          <Button 
            variant="outline" 
            className="w-full rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
            onClick={async () => {
              const current = document.getElementById('currentPass').value;
              const next = document.getElementById('newPass').value;
              if(!current || !next) return toast.error("Please fill all fields");
              try {
                await authService.updatePassword({ currentPassword: current, newPassword: next });
                toast.success("Password updated!");
                document.getElementById('currentPass').value = '';
                document.getElementById('newPass').value = '';
              } catch(e) {
                toast.error(e.response?.data?.error || "Update failed");
              }
            }}
          >
            Change Password
          </Button>
        </div>
      </div>

      {/* Premium Status Card */}
      {sub && sub.plan !== "free" && (
        <div className={`rounded-2xl p-4 border-2 bg-gradient-to-br from-purple-50 to-rose-50 border-purple-200`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-600" />
              <span className="font-bold text-gray-900 capitalize">
                {sub.plan === "premium" && sub.casual_addon ? "Gold Premium" : "Silver Premium"}
              </span>
            </div>
            {sub.is_active ? (
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
            ) : (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Inactive</span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {sub.billing_cycle && (
              <div className="capitalize">Billing: {sub.billing_cycle}</div>
            )}
            {sub.expires_at && (
              <div>Renews: {new Date(sub.expires_at).toLocaleDateString()}</div>
            )}
            {sub.casual_addon && (
              <div className="flex items-center gap-1 mt-2 text-rose-600">
                <Flame className="w-3 h-3" />
                <span className="text-xs font-medium">Casual Add-On Active</span>
              </div>
            )}
          </div>
          <Button 
            onClick={() => navigate("/premium")} 
            variant="outline" 
            className="w-full mt-3 rounded-xl text-xs border-purple-300 text-purple-600 hover:bg-purple-100"
          >
            Manage Subscription
          </Button>
        </div>
      )}

      {/* Biometric Authentication Section */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Fingerprint className="w-4 h-4" />
          Security Settings
        </h3>
        <BiometricSettings />
      </div>

              <div className="flex gap-2">
                {!profile?.is_verified && <Button onClick={() => navigate("/verification")} variant="outline" className="flex-1 rounded-xl text-xs">Verify Identity</Button>}
                {!profile?.is_personality_verified && <Button onClick={() => navigate("/verification")} variant="outline" className="flex-1 rounded-xl text-xs">Personality Quiz</Button>}
                {!isSilverPremium && <Button onClick={() => navigate("/premium")} variant="outline" className="flex-1 rounded-xl text-xs bg-gradient-to-r from-purple-500 to-rose-500 text-white border-0">AURAsoul premium ✨</Button>}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Input value={form.display_name} onChange={e => set("display_name", e.target.value)} placeholder="Display name" className="rounded-xl" />
              <Input type="number" value={form.age || ""} onChange={e => set("age", parseInt(e.target.value) || "")} placeholder="Age" className="rounded-xl" />
              <Input value={form.location || ""} onChange={e => set("location", e.target.value)} placeholder="Location" className="rounded-xl" />
              <div className="flex items-center gap-2">
                <Textarea value={form.bio || ""} onChange={e => set("bio", e.target.value)} placeholder="Bio" className="rounded-xl resize-none flex-1" rows={3} />
                <AIBioGenerator profile={form} onGenerate={bio => set("bio", bio)} />
              </div>
              <PhotoUpload photos={form.photos || []} onChange={p => set("photos", p)} />
              <HobbyEditor hobbies={form.hobbies || []} onChange={v => set("hobbies", v)} />
              <ValuesEditor values={form.values || []} onChange={v => set("values", v)} />
              <DealbreakersEditor dealbreakers={form.dealbreakers || []} onChange={v => set("dealbreakers", v)} />
              <RelationshipExpectationsEditor expectations={form.relationship_expectations || []} onChange={v => set("relationship_expectations", v)} />
              <LifestyleEditor lifestyle={form.lifestyle || {}} onChange={v => set("lifestyle", v)} />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEditing(false)} className="flex-1 rounded-2xl">Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
