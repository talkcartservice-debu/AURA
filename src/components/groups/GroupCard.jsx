import { Users, MapPin, MessageCircle, Clock, Check, X as XIcon, Calendar, ArrowRight, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { eventService } from "@/api/entities";
import { useNavigate } from "react-router-dom";

export default function GroupCard({ group, userEmail, onJoin, onLeave, onCreateEvent, onOpenChat, onManageRequests, onDelete, onEdit }) {
  const navigate = useNavigate();
  const isMember = (group.member_emails || []).includes(userEmail);
  const isPending = (group.pending_member_emails || []).includes(userEmail);
  const isCreator = group.creator_email === userEmail;
  const memberCount = (group.member_emails || []).length;
  const pendingCount = (group.pending_member_emails || []).length;
  const isFull = group.max_members && memberCount >= group.max_members;

  const { data: groupEvents } = useQuery({
    queryKey: ["groupEvents", group._id],
    queryFn: () => eventService.list(group._id),
    enabled: isMember
  });

  return (
    <div className={`bg-white rounded-2xl border-2 p-4 shadow-sm transition-all ${isMember ? "border-rose-200 bg-rose-50/30" : isPending ? "border-amber-100 bg-amber-50/20" : "border-gray-100"}`}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-2xl flex-shrink-0">
          {group.cover_emoji || "🎉"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-gray-900 text-sm truncate">{group.name}</h3>
            {isCreator && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px] px-1.5 h-5 border-none">
                Creator
              </Badge>
            )}
          </div>
          {group.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{group.description}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-3 h-3 text-rose-400" />
              {memberCount} members{group.max_members ? ` / ${group.max_members}` : ""}
            </span>
            {group.location && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3 text-rose-400" /> {group.location}
              </span>
            )}
          </div>
          
          {isMember && groupEvents?.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upcoming Events</p>
                <button onClick={() => navigate("/events")} className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-0.5">
                  See all <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
              <div className="space-y-1.5">
                {groupEvents.slice(0, 2).map(ev => {
                  const isGoing = ev.rsvp_emails?.includes(userEmail);
                  return (
                    <div key={ev._id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-rose-50 shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">{ev.cover_emoji || "📅"}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{ev.title}</p>
                          <p className="text-[9px] text-gray-400">{ev.event_date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isGoing ? (
                          <Button 
                            onClick={() => navigate(`/events/${ev._id}/chat`)}
                            size="sm"
                            className="h-7 w-7 p-0 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border-none shadow-none"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => navigate("/events")}
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[9px] font-black uppercase text-rose-500 px-2 rounded-lg"
                          >
                            RSVP
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {group.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {group.tags.slice(0, 3).map((t) => (
                <span key={t} className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[10px]">#{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {isMember ? (
          <>
            <Button
              onClick={() => onLeave(group)}
              size="sm"
              className="flex-1 rounded-xl h-8 text-xs font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200"
              variant="ghost"
            >
              Leave Group
            </Button>
            {onCreateEvent && (
              <Button
                onClick={() => onCreateEvent(group._id)}
                size="sm"
                variant="outline"
                className="rounded-xl h-8 text-xs font-semibold border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                + Event
              </Button>
            )}
            {onOpenChat && (
              <Button
                onClick={() => onOpenChat(group)}
                size="sm"
                variant="outline"
                className="rounded-xl h-8 text-xs font-semibold border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                Chat
              </Button>
            )}
          </>
        ) : isPending ? (
          <Button
            disabled
            size="sm"
            className="flex-1 rounded-xl h-8 text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100 cursor-default"
            variant="ghost"
          >
            <Clock className="w-3 h-3 mr-1.5" />
            Pending Approval
          </Button>
        ) : (
          <Button
            onClick={() => onJoin(group)}
            disabled={isFull}
            size="sm"
            className={`flex-1 rounded-xl h-8 text-xs font-semibold ${
              isFull
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-rose-500 to-purple-600 text-white"
            }`}
            variant="ghost"
          >
            {isFull ? "Group Full" : "Request to Join"}
          </Button>
        )}

        {isCreator && pendingCount > 0 && onManageRequests && (
          <Button
            onClick={() => onManageRequests(group)}
            size="sm"
            variant="outline"
            className="rounded-xl h-8 text-xs font-bold border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 animate-pulse"
          >
            <Users className="w-3.5 h-3.5 mr-1" />
            Requests ({pendingCount})
          </Button>
        )}

        {isCreator && onDelete && (
          <div className="flex gap-1">
            {onEdit && (
              <Button
                onClick={() => onEdit(group)}
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              onClick={() => onDelete(group._id)}
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}