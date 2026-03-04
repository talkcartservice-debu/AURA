import { Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GroupCard({ group, userEmail, onJoin, onLeave, onCreateEvent }) {
  const isMember = (group.member_emails || []).includes(userEmail);
  const memberCount = (group.member_emails || []).length;
  const isFull = group.max_members && memberCount >= group.max_members;

  return (
    <div className={`bg-white rounded-2xl border-2 p-4 shadow-sm transition-all ${isMember ? "border-rose-200 bg-rose-50/30" : "border-gray-100"}`}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-2xl flex-shrink-0">
          {group.cover_emoji || "🎉"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">{group.name}</h3>
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
          {group.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {group.tags.slice(0, 3).map((t) => (
                <span key={t} className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-xs">#{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          onClick={() => (isMember ? onLeave(group) : onJoin(group))}
          disabled={isFull && !isMember}
          size="sm"
          className={`flex-1 rounded-xl h-8 text-xs font-semibold ${
            isMember
              ? "bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200"
              : isFull
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-rose-500 to-purple-600 text-white"
          }`}
          variant="ghost"
        >
          {isMember ? "Leave Group" : isFull ? "Group Full" : "Join Group"}
        </Button>
        {isMember && onCreateEvent && (
          <Button
            onClick={() => onCreateEvent(group._id)}
            size="sm"
            variant="outline"
            className="rounded-xl h-8 text-xs font-semibold border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            + Event
          </Button>
        )}
      </div>
    </div>
  );
}