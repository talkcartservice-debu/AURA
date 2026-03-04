import { useState } from "react";
import { X, Calendar, Clock, MapPin, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function CreateEventModal({
  groupId,
  userEmail,
  onClose,
  onCreate,
  suggestAsCommunity = false, // New prop for community suggestions
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    capacity: "",
    cover_emoji: "🎉",
    is_public: true,
    community_suggested: false,
    event_tags: [],
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const EMOJIS = ["🎉", "🎶", "🍕", "🏃", "📚", "🎨", "🌿", "🏔️", "🎭", "🎯"];
  
  const EVENT_TAGS = [
    { value: "first-date-friendly", label: "First Date Friendly", icon: "💕" },
    { value: "romantic", label: "Romantic", icon: "🌹" },
    { value: "casual", label: "Casual", icon: "😊" },
    { value: "active", label: "Active", icon: "⚡" },
    { value: "cultural", label: "Cultural", icon: "🎭" },
    { value: "fun", label: "Fun", icon: "🎉" },
  ];

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      event_tags: f.event_tags.includes(tag) 
        ? f.event_tags.filter(t => t !== tag)
        : [...f.event_tags, tag]
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.event_date) return;
    setSaving(true);
    await onCreate({
      ...form,
      group_id: groupId,
      creator_email: userEmail,
      rsvp_emails: [userEmail],
      capacity: form.capacity ? parseInt(form.capacity) : null,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create Event</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Community Suggestion Toggle */}
          {suggestAsCommunity && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Share with Community</p>
                    <p className="text-xs text-gray-500">Make this visible to all AURA users</p>
                  </div>
                </div>
                <Switch
                  checked={form.community_suggested}
                  onCheckedChange={(checked) => set("community_suggested", checked)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
              Event Emoji
            </label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => set("cover_emoji", e)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all ${form.cover_emoji === e ? "border-rose-400 bg-rose-50" : "border-gray-200"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
              Event Title *
            </label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Saturday Hike at Muir Woods"
              className="rounded-xl"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
              Description
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Tell people what to expect..."
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date *
              </label>
              <Input
                type="date"
                value={form.event_date}
                onChange={(e) => set("event_date", e.target.value)}
                className="rounded-xl"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time
              </label>
              <Input
                type="time"
                value={form.event_time}
                onChange={(e) => set("event_time", e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Location
            </label>
            <Input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Where is it happening?"
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block flex items-center gap-1">
              <Users className="w-3 h-3" /> Capacity (optional)
            </label>
            <Input
              type="number"
              value={form.capacity}
              onChange={(e) => set("capacity", e.target.value)}
              placeholder="Max attendees (leave blank for unlimited)"
              className="rounded-xl"
              min={1}
            />
          </div>
          
          {/* Event Tags */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
              Event Vibe
            </label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    form.event_tags.includes(tag.value)
                      ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tag.icon} {tag.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-2xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white"
            >
              {saving ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
