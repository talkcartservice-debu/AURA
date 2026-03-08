import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { groupService, eventService, dateEventService } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import GroupCard from "@/components/groups/GroupCard";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import GroupChatModal from "@/components/groups/GroupChatModal";
import CreateEventModal from "@/components/events/CreateEventModal";
import EventCard from "@/components/events/EventCard";
import AttendeeListModal from "@/components/events/AttendeeListModal";
import CommunityEventSuggestion from "@/components/events/CommunityEventSuggestion";
import AIRelationshipCoach from "@/components/coach/AIRelationshipCoach";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Users, Calendar, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const CATEGORY_EMOJI = { outdoor: "🏕️", arts: "🎨", food: "🍕", sports: "⚽", books: "📚", music: "🎵", travel: "✈️", fitness: "💪", social: "🎉", other: "✨" };

export default function Groups() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("groups");
  const [showCreate, setShowCreate] = useState(false);
  const [showEvent, setShowEvent] = useState(null);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [activeChatGroup, setActiveChatGroup] = useState(null);
  const [activeEventAttendees, setActiveEventAttendees] = useState(null);
  
  const { data: groups, isLoading } = useQuery({ queryKey: ["groups"], queryFn: groupService.list });
  const { data: events } = useQuery({ queryKey: ["events"], queryFn: () => eventService.list() });
  
  // AI Suggestions
  const { data: suggestionsData, isLoading: loadingSuggestions } = useQuery({
    queryKey: ["eventSuggestions"],
    queryFn: dateEventService.getSuggestions,
    enabled: activeTab === "suggestions",
  });
  
  // Community Events
  const { data: communityEvents, isLoading: loadingCommunity } = useQuery({
    queryKey: ["communityEvents"],
    queryFn: () => dateEventService.getCommunityEvents({}),
    enabled: activeTab === "community",
  });

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

  async function handleUpvote(event) {
    try {
      await dateEventService.upvoteCommunityEvent(event._id || event.id);
      toast.success("Event upvoted!");
      qc.invalidateQueries(["communityEvents"]);
    } catch (err) {
      toast.error("Failed to upvote");
    }
  }

  async function handleSuggestEvent(eventData) {
    try {
      await dateEventService.suggestCommunityEvent(eventData);
      toast.success("Event suggested! It will appear after approval.");
      setShowSuggestModal(false);
      qc.invalidateQueries(["communityEvents"]);
    } catch (err) {
      toast.error("Failed to suggest event");
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-500" /> Groups & Events
        </h1>
        <div className="flex gap-2">
          {activeTab === "groups" && (
            <>
              <Button onClick={() => setShowCreate(true)} size="sm" variant="outline" className="rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50">
                <Plus className="w-4 h-4 mr-1" /> Group
              </Button>
              <Button onClick={() => setShowEvent('standalone')} size="sm" className="rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white">
                <Plus className="w-4 h-4 mr-1" /> Event
              </Button>
            </>
          )}
          {activeTab === "suggestions" && (
            <Button onClick={() => setShowSuggestModal(true)} size="sm" className="rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white">
              <Plus className="w-4 h-4 mr-1" /> Suggest Spot
            </Button>
          )}
        </div>
      </div>

      {/* AI Relationship Coach Dashboard - Always visible */}
      <div className="mb-6">
        <AIRelationshipCoach />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Group Events
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Picks
          </TabsTrigger>
        </TabsList>

        {/* Groups Tab */}
        <TabsContent value="groups">
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
              />
            ))}
            {(!groups || groups.length === 0) && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No groups yet. Create the first one!</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Group Events Tab */}
        <TabsContent value="events">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Upcoming Group Events
              </h2>
              <span className="text-xs text-gray-500">
                {(events || []).length} events
              </span>
            </div>
            
            {(events || []).length > 0 ? (
              <div className="space-y-3">
                {events.map((e) => (
                  <EventCard 
                    key={e._id} 
                    event={e} 
                    userEmail={user?.email} 
                    onRSVP={handleRSVP} 
                    showAIInsights={true}
                    onShowAttendees={(event) => setActiveEventAttendees(event)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No upcoming events. Create one!</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* AI Suggestions Tab */}
        <TabsContent value="suggestions">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Personalized Date Ideas
              </h2>
              <span className="text-xs text-gray-500">
                {suggestionsData?.total || 0} suggestions
              </span>
            </div>

            {loadingSuggestions ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
              </div>
            ) : suggestionsData?.events?.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Set your preferred date types in profile to get personalized suggestions
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {suggestionsData?.events?.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    userEmail={user?.email}
                    onRSVP={handleRSVP}
                    showAIInsights={true}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

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
          groupId={showEvent === 'standalone' ? null : showEvent} 
          userEmail={user?.email} 
          onClose={() => setShowEvent(null)} 
          onCreate={handleCreateEvent}
          suggestAsCommunity={true}
        />
      )}
      
      {showSuggestModal && (
        <CommunityEventSuggestion
          onClose={() => setShowSuggestModal(false)}
          onSuggest={handleSuggestEvent}
        />
      )}

      {activeChatGroup && (
        <GroupChatModal
          group={activeChatGroup}
          user={user}
          onClose={() => setActiveChatGroup(null)}
        />
      )}

      {activeEventAttendees && (
        <AttendeeListModal
          event={activeEventAttendees}
          onClose={() => setActiveEventAttendees(null)}
        />
      )}
    </div>
  );
}
