import { useState } from "react";
import { X, MapPin, DollarSign, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { dateEventService } from "@/api/entities";
import { toast } from "sonner";

const EVENT_TYPES = [
  { value: "coffee_shop", label: "Coffee Shop", icon: "☕" },
  { value: "art_exhibit", label: "Art Gallery", icon: "🎨" },
  { value: "concert", label: "Concert", icon: "🎵" },
  { value: "outdoor_activity", label: "Outdoor", icon: "🏃" },
  { value: "restaurant", label: "Restaurant", icon: "🍽️" },
  { value: "museum", label: "Museum", icon: "🏛️" },
  { value: "festival", label: "Festival", icon: "🎪" },
  { value: "workshop_class", label: "Workshop", icon: "📚" },
];

const ATMOSPHERES = [
  { value: "casual", label: "Casual" },
  { value: "romantic", label: "Romantic" },
  { value: "active", label: "Active" },
  { value: "cultural", label: "Cultural" },
  { value: "fun", label: "Fun" },
  { value: "relaxed", label: "Relaxed" },
  { value: "upscale", label: "Upscale" },
  { value: "adventurous", label: "Adventurous" },
];

export default function CommunityEventSuggestion({ onClose, onSuggest }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location_name: "",
    location_address: "",
    location_city: "",
    price_range: "",
    atmosphere: [],
    best_for: [],
    website_url: "",
    phone_number: "",
    hours_of_operation: "",
    tips: "",
  });
  const [saving, setSaving] = useState(false);
  
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  
  const toggleArrayValue = (key, value) => {
    setForm(f => {
      const exists = f[key].includes(value);
      return {
        ...f,
        [key]: exists ? f[key].filter(v => v !== value) : [...f[key], value]
      };
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!form.title || !form.category || !form.location_name || !form.location_city) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      await dateEventService.suggestCommunityEvent({
        title: form.title,
        description: form.description,
        category: form.category,
        location: {
          name: form.location_name,
          address: form.location_address,
          city: form.location_city,
        },
        price_range: form.price_range,
        atmosphere: form.atmosphere,
        best_for: form.best_for,
        website_url: form.website_url,
        phone_number: form.phone_number,
        hours_of_operation: form.hours_of_operation,
        tips: form.tips.split("\n").filter(t => t.trim()),
      });
      
      toast.success("Event suggested! It will appear after approval.");
      onSuggest?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to suggest event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Suggest a Date Spot</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
              Event Type *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => set("category", type.value)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    form.category === type.value
                      ? "border-rose-500 bg-rose-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl block mb-1">{type.icon}</span>
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
              Venue Name *
            </label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g., The Coffee Bean"
              className="rounded-xl"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
              Why It's Great for Dates
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Tell others what makes this place special..."
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Location *
            </label>
            <Input
              value={form.location_name}
              onChange={(e) => set("location_name", e.target.value)}
              placeholder="Venue name or landmark"
              className="rounded-xl"
              required
            />
            <Input
              value={form.location_address}
              onChange={(e) => set("location_address", e.target.value)}
              placeholder="Street address (optional)"
              className="rounded-xl"
            />
            <Input
              value={form.location_city}
              onChange={(e) => set("location_city", e.target.value)}
              placeholder="City *"
              className="rounded-xl"
              required
            />
          </div>

          {/* Price Range */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Price Range
            </label>
            <div className="flex gap-2">
              {["free", "₦", "₦₦", "₦₦₦", "₦₦₦₦"].map((price) => (
                <button
                  key={price}
                  type="button"
                  onClick={() => set("price_range", price)}
                  className={`flex-1 py-2 rounded-xl border-2 transition-all ${
                    form.price_range === price
                      ? "border-rose-500 bg-rose-50 text-rose-700 font-bold"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {price}
                </button>
              ))}
            </div>
          </div>

          {/* Atmosphere */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
              Atmosphere
            </label>
            <div className="flex flex-wrap gap-2">
              {ATMOSPHERES.map((atm) => (
                <button
                  key={atm.value}
                  type="button"
                  onClick={() => toggleArrayValue("atmosphere", atm.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    form.atmosphere.includes(atm.value)
                      ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {atm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                Website
              </label>
              <Input
                value={form.website_url}
                onChange={(e) => set("website_url", e.target.value)}
                placeholder="https://..."
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                Phone
              </label>
              <Input
                value={form.phone_number}
                onChange={(e) => set("phone_number", e.target.value)}
                placeholder="+234..."
                className="rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
              Hours of Operation
            </label>
            <Input
              value={form.hours_of_operation}
              onChange={(e) => set("hours_of_operation", e.target.value)}
              placeholder="e.g., Mon-Sun: 8am - 10pm"
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
              Tips for Visitors
            </label>
            <Textarea
              value={form.tips}
              onChange={(e) => set("tips", e.target.value)}
              placeholder="One tip per line (parking info, best times to visit, etc.)"
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Suggest Event
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
