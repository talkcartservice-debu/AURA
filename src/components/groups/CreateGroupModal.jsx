import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = [
  "outdoor",
  "arts",
  "food",
  "sports",
  "books",
  "music",
  "travel",
  "fitness",
  "social",
  "other",
];
const EMOJIS = [
  "🏕️",
  "🎨",
  "🍕",
  "⚽",
  "📚",
  "🎵",
  "✈️",
  "💪",
  "🎉",
  "✨",
  "🌺",
  "🌊",
  "🎭",
  "🦋",
  "🌟",
];

export default function CreateGroupModal({
  userEmail,
  categoryEmoji,
  onClose,
  onCreate,
  initialData,
}) {
  const [form, setForm] = useState(
    initialData || {
      name: "",
      description: "",
      category: "social",
      cover_emoji: "🎉",
      tags: [],
      location: "",
      event_date: "",
      max_members: "",
      is_public: true,
    },
  );
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      set("tags", [...form.tags, t]);
      setTagInput("");
    }
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await onCreate({
        ...form,
        max_members: form.max_members ? parseInt(form.max_members) : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? "Edit Group" : "Create a Group"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
              Cover Emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => set("cover_emoji", e)}
                  className={`w-9 h-9 text-xl rounded-xl transition-all ${form.cover_emoji === e ? "bg-rose-100 ring-2 ring-rose-400" : "hover:bg-gray-100"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
              Group Name *
            </label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Hiking Club"
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
              Description
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What's this group about?"
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
              Category
            </label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("category", c)}
                  className={`py-2 rounded-xl text-xs font-medium border-2 flex flex-col items-center gap-0.5 transition-all ${form.category === c ? "border-rose-500 bg-rose-50 text-rose-700" : "border-gray-200 text-gray-500 hover:border-rose-200"}`}
                >
                  <span>{categoryEmoji[c]}</span>
                  <span className="capitalize">{c}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                Location
              </label>
              <Input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="City, venue..."
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                Max Members
              </label>
              <Input
                type="number"
                value={form.max_members}
                onChange={(e) => set("max_members", e.target.value)}
                placeholder="No limit"
                className="rounded-xl"
                min={2}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
              Event Date (optional)
            </label>
            <Input
              type="date"
              value={form.event_date}
              onChange={(e) => set("event_date", e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
                placeholder="Add a tag..."
                className="rounded-xl flex-1"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full text-xs"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "tags",
                        form.tags.filter((x) => x !== t),
                      )
                    }
                    className="hover:text-rose-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-2xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.name || saving}
            className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white"
          >
            {saving
              ? initialData
                ? "Saving..."
                : "Creating..."
              : initialData
                ? "Save Changes"
                : "Create Group"}
          </Button>
        </div>
      </div>
    </div>
  );
}
