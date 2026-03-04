import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { profileService } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PhotoUpload from "@/components/profile/PhotoUpload";
import TagSelector from "@/components/profile/TagSelector";
import ValuesEditor from "@/components/profile/ValuesEditor";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const INTERESTS = ["Travel", "Music", "Cooking", "Sports", "Reading", "Movies", "Fitness", "Art", "Gaming", "Photography", "Yoga", "Hiking", "Dancing", "Fashion", "Technology"];
const GOALS = [
  { value: "long_term", label: "Long-term relationship" },
  { value: "casual_dating", label: "Casual dating" },
  { value: "friendship_first", label: "Friendship first" },
  { value: "marriage_minded", label: "Marriage-minded" },
  { value: "open_to_anything", label: "Open to anything" },
];

export default function ProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    age: "",
    bio: "",
    location: "",
    photos: [],
    interests: [],
    values: [],
    relationship_goals: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleFinish() {
    setSaving(true);
    try {
      await profileService.updateMe({
        ...form,
        age: parseInt(form.age) || null,
        profile_complete: true,
      });
      toast.success("Profile created!");
      navigate("/discover");
    } catch (err) {
      toast.error("Failed to save profile");
    }
    setSaving(false);
  }

  const steps = [
    // Step 0: Basic info
    <div key={0} className="space-y-4">
      <h2 className="text-xl font-bold">Let's get to know you</h2>
      <Input placeholder="Display name" value={form.display_name} onChange={(e) => set("display_name", e.target.value)} className="rounded-xl" />
      <Input type="number" placeholder="Age" value={form.age} onChange={(e) => set("age", e.target.value)} className="rounded-xl" min={18} />
      <Input placeholder="City / Location" value={form.location} onChange={(e) => set("location", e.target.value)} className="rounded-xl" />
      <Textarea placeholder="Write a short bio..." value={form.bio} onChange={(e) => set("bio", e.target.value)} className="rounded-xl resize-none" rows={3} />
    </div>,
    // Step 1: Photos
    <div key={1} className="space-y-4">
      <h2 className="text-xl font-bold">Add some photos</h2>
      <PhotoUpload photos={form.photos} onChange={(p) => set("photos", p)} />
    </div>,
    // Step 2: Interests
    <div key={2} className="space-y-4">
      <h2 className="text-xl font-bold">Your interests</h2>
      <TagSelector tags={form.interests} options={INTERESTS} onChange={(v) => set("interests", v)} label="Pick your interests" />
    </div>,
    // Step 3: Values + Goals
    <div key={3} className="space-y-4">
      <h2 className="text-xl font-bold">What are you looking for?</h2>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Relationship Goal</label>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button key={g.value} onClick={() => set("relationship_goals", g.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.relationship_goals === g.value ? "bg-purple-100 border-purple-400 text-purple-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}
            >{g.label}</button>
          ))}
        </div>
      </div>
      <ValuesEditor values={form.values} onChange={(v) => set("values", v)} />
    </div>,
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-md mx-auto w-full p-6">
        <div className="flex gap-1 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? "bg-rose-500" : "bg-gray-200"}`} />
          ))}
        </div>
        {steps[step]}
      </div>
      <div className="p-6 max-w-md mx-auto w-full flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 rounded-2xl">Back</Button>
        )}
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={step === 0 && !form.display_name}
            className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white"
          >Next</Button>
        ) : (
          <Button onClick={handleFinish} disabled={saving}
            className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white"
          >{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finish"}</Button>
        )}
      </div>
    </div>
  );
}