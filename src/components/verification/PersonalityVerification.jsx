import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle2 } from "lucide-react";
import { profileService } from "@/api/entities";

const QUESTIONS = [
  { q: "I enjoy meeting new people", key: "social" },
  { q: "I prefer deep conversations over small talk", key: "depth" },
  { q: "I like planning things ahead of time", key: "planner" },
  { q: "I value experiences over possessions", key: "experiential" },
  { q: "I'm comfortable being vulnerable with others", key: "vulnerable" },
];

export default function PersonalityVerification({ onComplete }) {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const current = QUESTIONS[step];
  const allDone = step >= QUESTIONS.length;

  async function handleAnswer(value) {
    const updated = { ...answers, [current.key]: value };
    setAnswers(updated);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setSaving(true);
      try {
        const tags = Object.entries(updated)
          .filter(([_, v]) => v >= 4)
          .map(([k]) => k);
        await profileService.updateMe({ 
          personality_tags: tags, 
          is_personality_verified: true 
        });
        setDone(true);
        onComplete?.();
      } catch (err) {
        toast.error("Failed to save personality profile");
        console.error(err);
      } finally {
        setSaving(false);
      }
    }
  }

  if (done) {
    return (
      <div className="text-center py-12 px-6">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Personality Verified!</h2>
        <p className="text-gray-500 text-sm">Your personality badge is now active on your profile and will help find better matches.</p>
      </div>
    );
  }

  const buttonColors = [
    "hover:bg-red-50 hover:text-red-600 border-red-100",
    "hover:bg-orange-50 hover:text-orange-600 border-orange-100",
    "hover:bg-gray-50 hover:text-gray-600 border-gray-100",
    "hover:bg-emerald-50 hover:text-emerald-600 border-emerald-100",
    "hover:bg-green-50 hover:text-green-600 border-green-100",
  ];

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-6 h-6 text-purple-600" />
        <h2 className="text-lg font-bold text-gray-900">Personality Quiz</h2>
      </div>
      <div className="text-xs text-gray-400 mb-4">
        Question {step + 1} of {QUESTIONS.length}
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-3xl p-8 mb-8 shadow-sm">
        <p className="text-purple-900 font-bold text-center text-lg leading-tight">{current.q}</p>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n, i) => (
          <Button
            key={n}
            onClick={() => handleAnswer(n)}
            disabled={saving}
            variant="outline"
            className={`flex-1 rounded-2xl h-14 text-lg font-black transition-all duration-200 ${buttonColors[i]}`}
          >
            {n}
          </Button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-4 px-1">
        <span className="text-red-400">Strongly Disagree</span>
        <span className="text-green-500">Strongly Agree</span>
      </div>
    </div>
  );
}