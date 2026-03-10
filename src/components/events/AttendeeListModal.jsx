import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { eventService } from "@/api/entities";
import { X, Loader2, User, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProfileAvatar from "@/components/ProfileAvatar";

export default function AttendeeListModal({ event, onClose }) {
  const [search, setSearch] = useState("");
  const { data: attendees, isLoading } = useQuery({
    queryKey: ["eventAttendees", event._id],
    queryFn: () => eventService.getAttendees(event._id),
  });

  const filteredAttendees = useMemo(() => {
    if (!attendees) return [];
    if (!search) return attendees;
    return attendees.filter(p => 
      p.display_name.toLowerCase().includes(search.toLowerCase()) ||
      p.user_email.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase())
    );
  }, [attendees, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Who's going</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{event.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-90">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        {!isLoading && attendees?.length > 0 && (
          <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search attendees..." 
                className="pl-9 h-9 rounded-xl bg-white border-gray-200 text-xs focus:ring-rose-100 focus:border-rose-300"
              />
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading attendees</p>
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                {search ? <Search className="w-6 h-6 text-gray-300" /> : <User className="w-6 h-6 text-gray-300" />}
              </div>
              <p className="text-sm font-bold text-gray-500">{search ? "No matches found" : "No attendees yet"}</p>
              {search && <p className="text-xs text-gray-400 mt-1">Try a different name or location</p>}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredAttendees.map((profile) => (
                <div key={profile.user_email} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-colors group">
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
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 rounded-lg h-7 text-[10px] font-bold text-rose-500">View</Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/30">
          <Button onClick={onClose} className="w-full rounded-2xl bg-gray-900 text-white hover:bg-black h-12 font-bold shadow-lg shadow-gray-100">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
