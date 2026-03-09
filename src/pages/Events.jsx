import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eventService, dateEventService } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import CreateEventModal from "@/components/events/CreateEventModal";
import EventCard from "@/components/events/EventCard";
import AttendeeListModal from "@/components/events/AttendeeListModal";
import CommunityEventSuggestion from "@/components/events/CommunityEventSuggestion";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Calendar, Sparkles, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Events() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [activeEventAttendees, setActiveEventAttendees] = useState(null);
  
  const { data: events, isLoading } = useQuery({ 
    queryKey: ["events"], 
    queryFn: () => eventService.list() 
  });
  
  // AI Suggestions
  const { data: suggestionsData, isLoading: loadingSuggestions } = useQuery({
    queryKey: ["eventSuggestions"],
    queryFn: dateEventService.getSuggestions,
    enabled: activeTab === "suggestions",
  });

  async function handleCreateEvent(data) {
    try {
      await eventService.create(data);
      qc.invalidateQueries(["events"]);
      setShowCreate(false);
      toast.success("Event created!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create event");
    }
  }

  async function handleRSVP(event) {
    try {
      await eventService.rsvp(event._id);
      qc.invalidateQueries(["events"]);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to RSVP");
    }
  }

  async function handleSuggestEvent(eventData) {
    try {
      await dateEventService.suggestCommunityEvent(eventData);
      toast.success("Event suggested! It will appear after approval.");
      setShowSuggestModal(false);
    } catch (err) {
      toast.error("Failed to suggest event");
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>;

  const myEvents = events?.filter(e => e.creator_email === user?.email || e.rsvp_emails?.includes(user?.email)) || [];

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-rose-500" /> Events
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreate(true)} size="sm" className="rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg shadow-rose-100">
            <Plus className="w-4 h-4 mr-1" /> Create Event
          </Button>
          <Button onClick={() => setShowSuggestModal(true)} size="sm" variant="outline" className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50">
            <Sparkles className="w-4 h-4 mr-1" /> Suggest
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100/50 p-1 rounded-2xl">
          <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            All Events
          </TabsTrigger>
          <TabsTrigger value="my" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            My Events
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            AI Picks
          </TabsTrigger>
        </TabsList>

        {/* All Events Tab */}
        <TabsContent value="all" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Upcoming Events
            </h2>
          </div>
          
          {events?.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-1">
              {events.map((e) => (
                <EventCard 
                  key={e._id} 
                  event={e} 
                  userEmail={user?.email} 
                  onRSVP={handleRSVP} 
                  showAIInsights={true}
                  onShowAttendees={(event) => setActiveEventAttendees(event)}
                  onOpenChat={(event) => navigate(`/events/${event._id}/chat`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-bold">No events found</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to create an event!</p>
            </div>
          )}
        </TabsContent>

        {/* My Events Tab */}
        <TabsContent value="my" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> My RSVPs & Events
            </h2>
          </div>
          
          {myEvents.length > 0 ? (
            <div className="grid gap-4">
              {myEvents.map((e) => (
                <EventCard 
                  key={e._id} 
                  event={e} 
                  userEmail={user?.email} 
                  onRSVP={handleRSVP} 
                  showAIInsights={true}
                  onShowAttendees={(event) => setActiveEventAttendees(event)}
                  onOpenChat={(event) => navigate(`/events/${event._id}/chat`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-bold">You haven't joined any events</p>
              <p className="text-xs text-gray-400 mt-1">Find an event you like and click RSVP!</p>
            </div>
          )}
        </TabsContent>

        {/* AI Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI Personalized Picks
            </h2>
          </div>

          {loadingSuggestions ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
          ) : (
            <div className="grid gap-4">
              {suggestionsData?.events?.map((event) => (
                <EventCard
                  key={event.id || event._id}
                  event={event}
                  userEmail={user?.email}
                  onRSVP={handleRSVP}
                  showAIInsights={true}
                  onOpenChat={(event) => navigate(`/events/${event._id}/chat`)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showCreate && (
        <CreateEventModal 
          userEmail={user?.email} 
          onClose={() => setShowCreate(false)} 
          onCreate={handleCreateEvent}
        />
      )}
      
      {showSuggestModal && (
        <CommunityEventSuggestion
          onClose={() => setShowSuggestModal(false)}
          onSuggest={handleSuggestEvent}
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
