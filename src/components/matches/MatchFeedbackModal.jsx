import { useState } from "react";
import { X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function MatchFeedbackModal({ match, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!rating) return;
    setSaving(true);
    await onSubmit({ match_id: match._id, rating, feedback });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Rate this Match</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} className="p-1">
              <Star
                className={`w-8 h-8 transition-colors ${n <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
              />
            </button>
          ))}
        </div>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Any feedback? (optional)"
          className="rounded-xl resize-none mb-4"
          rows={3}
        />
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-2xl">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!rating || saving}
            className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white"
          >
            {saving ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}