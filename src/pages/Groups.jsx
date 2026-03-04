import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { groupService, eventService } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import GroupCard from "@/components/groups/GroupCard";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import CreateEventModal from "@/components/events/CreateEventModal";
import EventCard from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_EMOJI = { outdoor: "🏕️", arts: "🎨", food: "🍕", sports: "⚽", books: "📚", music: "🎵", travel: "✈️", fitness: "💪", social: "🎉", other: "✨" };

export default function Groups() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showEvent, setShowEvent] = useState(null);
  const { data: groups, isLoading } = useQuery({ queryKey: ["groups"], queryFn: groupService.list });
  const { data: events } = useQuery({ queryKey: ["events"], queryFn: () => eventService.list() });

  async function handleCreateGroup(data) {
    await groupService.create(data);
    qc.invalidateQueries(["groups"]);
    setShowCreate(false);
    toast.success("Group created!");
  }

  async function handleJoin(group) {
    await groupService.join(group._id);
    qc.invalidateQueries(["groups"]);
  }

  async function handleLeave(group) {
    await groupService.leave(group._id);
    qc.invalidateQueries(["groups"]);
  }

  async function handleCreateEvent(data) {
    await eventService.create(data);
    qc.invalidateQueries(["events"]);
    setShowEvent(null);
    toast.success("Event created!");
  }

  async function handleRSVP(event) {
    await eventService.rsvp(event._id);
    qc.invalidateQueries(["events"]);
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>;

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Users className="w-6 h-6 text-purple-500" /> Groups</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreate(true)} size="sm" variant="outline" className="rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50">
            <Plus className="w-4 h-4 mr-1" /> Group
          </Button>
          <Button onClick={() => setShowEvent('standalone')} size="sm" className="rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white">
            <Plus className="w-4 h-4 mr-1" /> Event
          </Button>
        </div>
      </div>
      <div className="space-y-3 mb-8">
        {(groups || []).map((g) => (
          <GroupCard key={g._id} group={g} userEmail={user?.email} onJoin={handleJoin} onLeave={handleLeave} onCreateEvent={(groupId) => setShowEvent(groupId)} />
        ))}
        {(!groups || groups.length === 0) && <p className="text-center text-gray-400 py-10">No groups yet. Create the first one!</p>}
      </div>
      {(events || []).length > 0 && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Upcoming Events</h2>
          <div className="space-y-3">
            {events.map((e) => <EventCard key={e._id} event={e} userEmail={user?.email} onRSVP={handleRSVP} />)}
          </div>
        </>
      )}
      {showCreate && <CreateGroupModal userEmail={user?.email} categoryEmoji={CATEGORY_EMOJI} onClose={() => setShowCreate(false)} onCreate={handleCreateGroup} />}
      {showEvent && <CreateEventModal groupId={showEvent === 'standalone' ? null : showEvent} userEmail={user?.email} onClose={() => setShowEvent(null)} onCreate={handleCreateEvent} />}
    </div>
  );
}
