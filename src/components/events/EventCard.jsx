import { Calendar, Clock, MapPin, Users, CheckCircle2, Sparkles, Heart, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

export default function EventCard({ event, userEmail, onRSVP, onUpvote, showAIInsights = false }) {
  const isGoing = (event.rsvp_emails || []).includes(userEmail);
  const attendeeCount = (event.rsvp_emails || []).length;
  const isFull = event.capacity && attendeeCount >= event.capacity;
  const isPast = event.event_date && new Date(event.event_date) < new Date();
  
  // Community event fields
  const hasUpvoted = (event.upvotes || []).includes(userEmail);
  const upvoteCount = event.upvote_count || 0;
  const isCommunitySuggested = event.community_suggested;
  const suggestedByName = event.suggested_by_name;

  let formattedDate = event.event_date;
  try {
    formattedDate = format(parseISO(event.event_date), "EEE, MMM d, yyyy");
  } catch {}

  return (
    <div
      className={`bg-white rounded-2xl border-2 p-4 shadow-sm transition-all ${isGoing ? "border-rose-200 bg-rose-50/30" : "border-gray-100"}`}
    >
      {/* Community Suggested Badge */}
      {isCommunitySuggested && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-2 py-1 rounded-full font-medium">
            🌟 Community Suggested
          </span>
          {suggestedByName && (
            <span className="text-xs text-gray-500">by {suggestedByName}</span>
          )}
        </div>
      )}

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
          
          {/* AI Insights Preview */}
          {showAIInsights && event.ai_insights?.length > 0 && (
            <div className="mt-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span className="text-xs font-semibold text-purple-600 uppercase">AI Tip</span>
              </div>
              <p className="text-xs text-gray-700">
                {event.ai_insights[0].content}
              </p>
            </div>
          )}
          
          {/* First Date Friendly Badge */}
          {event.event_tags?.includes("first-date-friendly") && (
            <div className="mt-2 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-500" />
              <span className="text-xs text-rose-600 font-medium">Great for First Dates</span>
            </div>
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
      
      {/* Action Buttons */}
      {!isPast && (
        <div className="flex gap-2 mt-3">
          <Button
            onClick={() => onRSVP(event)}
            disabled={isFull && !isGoing}
            size="sm"
            className={`flex-1 rounded-xl h-9 text-xs font-semibold ${
              isGoing
                ? "bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200"
                : isFull
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-rose-500 to-purple-600 text-white"
            }`}
            variant="ghost"
          >
            {isGoing
              ? "✓ You're going"
              : isFull
                ? "Event Full"
                : "RSVP"}
          </Button>
          
          {/* Upvote for Community Events */}
          {isCommunitySuggested && onUpvote && (
            <Button
              onClick={() => onUpvote(event)}
              size="sm"
              className={`rounded-xl h-9 text-xs font-semibold ${
                hasUpvoted
                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              variant="outline"
            >
              <ThumbsUp className={`w-3 h-3 mr-1 ${hasUpvoted ? 'fill-current' : ''}`} />
              {upvoteCount}
            </Button>
          )}
        </div>
      )}
      {isPast && (
        <div className="mt-3 text-center text-xs text-gray-400 bg-gray-50 rounded-xl py-1.5">
          Past event · {attendeeCount} attended
        </div>
      )}
    </div>
  );
}
