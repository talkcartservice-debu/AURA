import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { groupService } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import GroupCard from "@/components/groups/GroupCard";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import GroupChatModal from "@/components/groups/GroupChatModal";
import JoinRequestsModal from "@/components/groups/JoinRequestsModal";
import CreateEventModal from "@/components/events/CreateEventModal";
import AIRelationshipCoach from "@/components/coach/AIRelationshipCoach";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Users, Calendar } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_EMOJI = { outdoor: "🏕️", arts: "🎨", food: "🍕", sports: "⚽", books: "📚", music: "🎵", travel: "✈️", fitness: "💪", social: "🎉", other: "✨" };

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showEvent, setShowEvent] = useState(null);
  const [activeChatGroup, setActiveChatGroup] = useState(null);
  const [activeRequestsGroup, setActiveRequestsGroup] = useState(null);
  
  const { data: groups, isLoading } = useQuery({ 
    queryKey: ["groups"], 
    queryFn: groupService.list 
  });

  async function handleCreateGroup(data) {
    try {
      await groupService.create(data);
      qc.invalidateQueries(["groups"]);
      setShowCreate(false);
      toast.success("Group created!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create group");
    }
  }

  async function handleJoin(group) {
    try {
      await groupService.join(group._id);
      qc.invalidateQueries(["groups"]);
      toast.success("Join request sent!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send request");
    }
  }

  async function handleLeave(group) {
    try {
      await groupService.leave(group._id);
      qc.invalidateQueries(["groups"]);
      toast.success("Left group");
    } catch (err) {
      toast.error("Failed to leave group");
    }
  }

  async function handleApproveRequest(groupId, userEmail) {
    try {
      await groupService.approveRequest(groupId, userEmail);
      qc.invalidateQueries(["groups"]);
      
      if (activeRequestsGroup?._id === groupId) {
        setActiveRequestsGroup(prev => ({
          ...prev,
          pending_member_emails: prev.pending_member_emails.filter(e => e !== userEmail),
          member_emails: [...prev.member_emails, userEmail]
        }));
      }
      toast.success("Request approved");
    } catch (err) {
      toast.error("Failed to approve request");
    }
  }

  async function handleRejectRequest(groupId, userEmail) {
    try {
      await groupService.rejectRequest(groupId, userEmail);
      qc.invalidateQueries(["groups"]);

      if (activeRequestsGroup?._id === groupId) {
        setActiveRequestsGroup(prev => ({
          ...prev,
          pending_member_emails: prev.pending_member_emails.filter(e => e !== userEmail)
        }));
      }
      toast.success("Request rejected");
    } catch (err) {
      toast.error("Failed to reject request");
    }
  }

  async function handleCreateEvent(data) {
    try {
      // Assuming groupService.createEvent or eventService.create works with groupId
      // For now we use eventService indirectly via create modal which handles it
      qc.invalidateQueries(["events"]); // Invalidate global events
      setShowEvent(null);
      toast.success("Event created!");
    } catch (err) {
      toast.error("Failed to create event");
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-500" /> Groups
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/events")} size="sm" variant="outline" className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50">
            <Calendar className="w-4 h-4 mr-1" /> Explore Events
          </Button>
          <Button onClick={() => setShowCreate(true)} size="sm" className="rounded-xl bg-gradient-to-r from-purple-500 to-rose-600 text-white shadow-lg shadow-purple-100">
            <Plus className="w-4 h-4 mr-1" /> Create Group
          </Button>
        </div>
      </div>

      {/* AI Relationship Coach Dashboard */}
      <div className="mb-6">
        <AIRelationshipCoach />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-4 h-4" /> Available Groups
          </h2>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
            {groups?.length || 0} Total
          </span>
        </div>

        <div className="space-y-3">
          {(groups || []).map((g) => (
            <GroupCard 
              key={g._id} 
              group={g} 
              userEmail={user?.email} 
              onJoin={handleJoin} 
              onLeave={handleLeave} 
              onCreateEvent={(groupId) => setShowEvent(groupId)} 
              onOpenChat={(group) => setActiveChatGroup(group)}
              onManageRequests={(group) => setActiveRequestsGroup(group)}
            />
          ))}
          {(!groups || groups.length === 0) && (
            <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-bold">No groups found</p>
              <p className="text-xs text-gray-400 mt-1">Start a community by creating a group!</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateGroupModal 
          userEmail={user?.email} 
          categoryEmoji={CATEGORY_EMOJI} 
          onClose={() => setShowCreate(false)} 
          onCreate={handleCreateGroup} 
        />
      )}
      
      {showEvent && (
        <CreateEventModal 
          groupId={showEvent} 
          userEmail={user?.email} 
          onClose={() => setShowEvent(null)} 
          onCreate={handleCreateEvent}
        />
      )}

      {activeChatGroup && (
        <GroupChatModal
          group={activeChatGroup}
          user={user}
          onClose={() => setActiveChatGroup(null)}
        />
      )}

      {activeRequestsGroup && (
        <JoinRequestsModal
          group={activeRequestsGroup}
          onClose={() => setActiveRequestsGroup(null)}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
        />
      )}
    </div>
  );
}
