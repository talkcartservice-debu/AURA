import { useQuery } from "@tanstack/react-query";
import { eventService, profileService } from "@/api/entities";
import { X, Loader2, User, Check, X as CloseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileAvatar from "@/components/ProfileAvatar";
import { useState, useEffect } from "react";

export default function RSVPRequestsModal({ event, onClose, onApprove, onReject }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      if (!event.pending_rsvp_emails?.length) {
        setLoading(false);
        return;
      }
      try {
        const ps = await Promise.all(
          event.pending_rsvp_emails.map(email => profileService.getByEmail(email))
        );
        setProfiles(ps);
      } catch (err) {
        console.error("Failed to fetch pending profiles", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, [event.pending_rsvp_emails]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[70vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
          <div>
            <h3 className="font-bold text-gray-900">RSVP Requests</h3>
            <p className="text-xs text-gray-500">{event.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : !profiles || profiles.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 font-bold">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => (
                <div key={profile.user_email} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <ProfileAvatar profile={profile} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {profile.display_name}{profile.age && `, ${profile.age}`}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {profile.user_email}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      onClick={() => onApprove(event._id, profile.user_email)}
                      size="icon" 
                      className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 shadow-sm"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </Button>
                    <Button 
                      onClick={() => onReject(event._id, profile.user_email)}
                      size="icon" 
                      variant="ghost"
                      className="w-8 h-8 rounded-full bg-white text-rose-500 hover:bg-rose-50 border border-rose-100"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </Button>
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
