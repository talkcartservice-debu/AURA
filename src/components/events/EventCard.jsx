import { Calendar, Clock, MapPin, Users, CheckCircle, Sparkles, Heart, ThumbsUp, MessageCircle, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function EventCard({ event, userEmail, onRSVP, onUpvote, showAIInsights = false, onShowAttendees, onOpenChat, onManageRequests, onDelete, onEdit }) {
  const navigate = useNavigate();
  const isGoing = (event.rsvp_emails || []).includes(userEmail);
  const isPending = (event.pending_rsvp_emails || []).includes(userEmail);
  const isCreator = event.creator_email === userEmail;
  const attendeeCount = (event.rsvp_emails || []).length;
  const pendingCount = (event.pending_rsvp_emails || []).length;
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
            <h3 className="font-bold text-gray-900 text-sm leading-tight flex items-center gap-1.5">
              {event.title}
              {isGoing && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenChat) onOpenChat(event);
                    else navigate(`/events/${event._id}/chat`);
                  }}
                  className="p-1 hover:bg-rose-100 rounded-full transition-colors group"
                >
                  <MessageCircle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </h3>
            {isGoing && (
              <CheckCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
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
            <button 
              onClick={() => onShowAttendees && onShowAttendees(event)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-rose-600 transition-colors"
            >
              <Users className="w-3 h-3 text-rose-400" />
              {attendeeCount} going
              {event.capacity ? ` / ${event.capacity} max` : ""}
            </button>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      {!isPast && (
        <div className="flex gap-2 mt-3">
          <Button
            onClick={() => onRSVP(event)}
            disabled={(isFull && !isGoing) || isCreator}
            size="sm"
            className={`flex-1 rounded-xl h-9 text-xs font-semibold ${
              isGoing
                ? "bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200"
                : isPending
                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                  : isFull
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isCreator
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : "bg-gradient-to-r from-rose-500 to-purple-600 text-white"
            }`}
            variant="ghost"
          >
            {isCreator 
              ? "You're the Creator" 
              : isGoing
                ? "✓ You're going"
                : isPending
                  ? "✓ Pending Approval"
                  : isFull
                    ? "Event Full"
                    : "RSVP"}
          </Button>

          {isCreator && pendingCount > 0 && onManageRequests && (
            <Button
              onClick={() => onManageRequests(event)}
              size="sm"
              variant="outline"
              className="rounded-xl h-9 text-xs font-bold border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 animate-pulse"
            >
              <Users className="w-3.5 h-3.5 mr-1" />
              Requests ({pendingCount})
            </Button>
          )}

          {isGoing && (
            <Button
              onClick={() => onOpenChat ? onOpenChat(event) : navigate(`/events/${event._id}/chat`)}
              size="sm"
              className="rounded-xl h-9 text-xs font-semibold bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50"
              variant="outline"
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
              Chat
            </Button>
          )}

          {isCreator && onDelete && (
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(event);
                  }}
                  size="sm"
                  variant="ghost"
                  className="w-9 h-9 p-0 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 border border-transparent hover:border-purple-100"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(event._id);
                }}
                size="sm"
                variant="ghost"
                className="w-9 h-9 p-0 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
          
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
