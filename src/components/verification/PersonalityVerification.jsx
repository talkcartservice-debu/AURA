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
      const tags = Object.entries(updated)
        .filter(([_, v]) => v >= 4)
        .map(([k]) => k);
      await profileService.updateMe({ personality_tags: tags, is_personality_verified: true });
      setSaving(false);
      setDone(true);
      onComplete?.();
    }
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Personality Verified!</h2>
        <p className="text-gray-500 text-sm">Your personality badge is now active on your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-6 h-6 text-purple-600" />
        <h2 className="text-lg font-bold text-gray-900">Personality Quiz</h2>
      </div>
      <div className="text-xs text-gray-400 mb-4">
        Question {step + 1} of {QUESTIONS.length}
      </div>
      <div className="bg-purple-50 rounded-2xl p-6 mb-6">
        <p className="text-purple-800 font-medium">{current.q}</p>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            onClick={() => handleAnswer(n)}
            disabled={saving}
            variant="outline"
            className={`flex-1 rounded-xl h-12 text-sm font-semibold`}
          >
            {n}
          </Button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
        <span>Disagree</span>
        <span>Agree</span>
      </div>
    </div>
  );
}