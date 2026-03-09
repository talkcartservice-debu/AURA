import { useState, useEffect } from "react";
import { X, Check, X as RejectIcon, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { profileService } from "@/api/entities";
import ProfileAvatar from "@/components/ProfileAvatar";
import { toast } from "sonner";

export default function JoinRequestsModal({ group, onClose, onApprove, onReject }) {
  const [requestProfiles, setRequestProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    async function loadProfiles() {
      const emails = group.pending_member_emails || [];
      if (emails.length === 0) {
        setLoading(false);
        return;
      }

      const profilesMap = {};
      await Promise.all(
        emails.map(async (email) => {
          try {
            const p = await profileService.getByEmail(email);
            profilesMap[email] = p;
          } catch (err) {
            console.error("Failed to load profile", email, err);
          }
        })
      );
      setRequestProfiles(profilesMap);
      setLoading(false);
    }
    loadProfiles();
  }, [group.pending_member_emails]);

  async function handleApprove(email) {
    setProcessing(email);
    try {
      await onApprove(group._id, email);
      toast.success("Request approved");
    } catch (err) {
      toast.error("Failed to approve request");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(email) {
    setProcessing(email);
    try {
      await onReject(group._id, email);
      toast.success("Request rejected");
    } catch (err) {
      toast.error("Failed to reject request");
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <div>
            <h2 className="text-xl font-black text-gray-900 leading-tight">Join Requests</h2>
            <p className="text-[10px] text-amber-600 uppercase tracking-widest font-black mt-0.5">{group.name}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-2xl transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[60vh] p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-xs font-bold uppercase tracking-widest">Loading requests</p>
            </div>
          ) : group.pending_member_emails?.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No pending requests</p>
            </div>
          ) : (
            group.pending_member_emails.map((email) => {
              const profile = requestProfiles[email];
              return (
                <div key={email} className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100 group hover:bg-white hover:border-amber-200 hover:shadow-lg hover:shadow-amber-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="ring-2 ring-white shadow-sm rounded-xl overflow-hidden">
                      <ProfileAvatar profile={profile} size="sm" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {profile?.display_name || email.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-gray-500 font-medium truncate uppercase tracking-tighter italic opacity-0 group-hover:opacity-100 transition-opacity">
                        {email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(email)}
                      disabled={processing === email}
                      className="w-9 h-9 p-0 rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-100 transition-all active:scale-90"
                    >
                      {processing === email ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReject(email)}
                      disabled={processing === email}
                      className="w-9 h-9 p-0 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-100 transition-all active:scale-90"
                    >
                      <RejectIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="p-6 bg-gray-50/50 border-t border-gray-100">
          <Button onClick={onClose} variant="outline" className="w-full rounded-2xl border-none shadow-none font-bold text-gray-500 hover:bg-white transition-all">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
