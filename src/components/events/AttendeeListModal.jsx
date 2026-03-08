import { useQuery } from "@tanstack/react-query";
import { eventService } from "@/api/entities";
import { X, Loader2, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileAvatar from "@/components/ProfileAvatar";

export default function AttendeeListModal({ event, onClose }) {
  const { data: attendees, isLoading } = useQuery({
    queryKey: ["eventAttendees", event._id],
    queryFn: () => eventService.getAttendees(event._id),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[70vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Who's going</h3>
            <p className="text-xs text-gray-500">{event.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : !attendees || attendees.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">No attendees yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {attendees.map((profile) => (
                <div key={profile.user_email} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                  <ProfileAvatar profile={profile} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {profile.display_name}{profile.age && `, ${profile.age}`}
                    </p>
                    {profile.location && (
                      <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" /> {profile.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
          <Button onClick={onClose} className="w-full rounded-xl bg-gray-900 text-white hover:bg-gray-800 h-11">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
