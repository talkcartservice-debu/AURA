import { Calendar, Clock, MapPin, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

export default function EventCard({ event, userEmail, onRSVP }) {
  const isGoing = (event.rsvp_emails || []).includes(userEmail);
  const attendeeCount = (event.rsvp_emails || []).length;
  const isFull = event.capacity && attendeeCount >= event.capacity;
  const isPast = event.event_date && new Date(event.event_date) < new Date();

  let formattedDate = event.event_date;
  try {
    formattedDate = format(parseISO(event.event_date), "EEE, MMM d, yyyy");
  } catch {}

  return (
    <div
      className={`bg-white rounded-2xl border-2 p-4 shadow-sm transition-all ${isGoing ? "border-rose-200 bg-rose-50/30" : "border-gray-100"}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-2xl flex-shrink-0">
          {event.cover_emoji || "🎉"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 text-sm leading-tight">
              {event.title}
            </h3>
            {isGoing && (
              <CheckCircle2 className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            )}
          </div>
          {event.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
              {event.description}
            </p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3 text-rose-400" /> {formattedDate}
            </span>
            {event.event_time && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3 text-rose-400" /> {event.event_time}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3 text-rose-400" /> {event.location}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-3 h-3 text-rose-400" />
              {attendeeCount} going
              {event.capacity ? ` / ${event.capacity} max` : ""}
            </span>
          </div>
        </div>
      </div>
      {!isPast && (
        <Button
          onClick={() => onRSVP(event)}
          disabled={isFull && !isGoing}
          size="sm"
          className={`w-full mt-3 rounded-xl h-8 text-xs font-semibold ${
            isGoing
              ? "bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200"
              : isFull
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-rose-500 to-purple-600 text-white"
          }`}
          variant="ghost"
        >
          {isGoing
            ? "✓ You're going — Cancel RSVP"
            : isFull
              ? "Event Full"
              : "RSVP to this event"}
        </Button>
      )}
      {isPast && (
        <div className="mt-3 text-center text-xs text-gray-400 bg-gray-50 rounded-xl py-1.5">
          Past event · {attendeeCount} attended
        </div>
      )}
    </div>
  );
}
