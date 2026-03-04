import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { relationshipCoachService } from "@/api/entities";
import { Calendar, Clock, MapPin, DollarSign, Info, Loader2, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DateGuidanceCard({ eventType, eventName }) {
  const [showDetails, setShowDetails] = useState(false);

  const { data: guidance, isLoading } = useQuery({
    queryKey: ["dateGuidance", eventType, eventName],
    queryFn: () => relationshipCoachService.getDateGuidance(eventType, eventName),
    enabled: !!eventType && showDetails,
  });

  if (!eventType) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500 text-sm">
            Select an event type to see personalized date guidance
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          First Date Guidance
        </CardTitle>
        {eventName && (
          <p className="text-sm text-gray-500">{eventName}</p>
        )}
      </CardHeader>
      <CardContent>
        {!showDetails ? (
          <Button onClick={() => setShowDetails(true)} className="w-full">
            Get AI Date Tips
          </Button>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
          </div>
        ) : guidance ? (
          <DateGuidanceContent guidance={guidance} />
        ) : null}
      </CardContent>
    </Card>
  );
}

function DateGuidanceContent({ guidance }) {
  return (
    <div className="space-y-4">
      {/* Quick Info */}
      <div className="grid grid-cols-2 gap-3">
        {guidance.estimated_duration && (
          <InfoBox icon={<Clock className="w-4 h-4" />} label="Duration" value={guidance.estimated_duration} />
        )}
        {guidance.price_range && (
          <InfoBox icon={<DollarSign className="w-4 h-4" />} label="Price" value={guidance.price_range} />
        )}
        {guidance.what_to_wear && (
          <div className="col-span-2">
            <InfoBox 
              icon={<Info className="w-4 h-4" />} 
              label="What to Wear" 
              value={guidance.what_to_wear} 
            />
          </div>
        )}
      </div>

      {/* Preparation Tips */}
      {guidance.preparation_tips && guidance.preparation_tips.length > 0 && (
        <Section title="📋 Before the Date">
          <ul className="space-y-2">
            {guidance.preparation_tips.map((tip, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-rose-500 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Conversation Topics */}
      {guidance.conversation_topics && guidance.conversation_topics.length > 0 && (
        <Section title="💬 Conversation Starters">
          <div className="space-y-2">
            {guidance.conversation_topics.map((topic, idx) => (
              <div key={idx} className="p-2 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-800">{topic}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Etiquette Notes */}
      {guidance.etiquette_notes && guidance.etiquette_notes.length > 0 && (
        <Section title="✨ Date Etiquette">
          <ul className="space-y-2">
            {guidance.etiquette_notes.map((note, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">✓</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Red Flags Education */}
      {guidance.red_flags_education && (
        <Section title="🛡️ Healthy Relationship Tips">
          <div className="space-y-2">
            {guidance.red_flags_education.slice(0, 3).map((flag, idx) => (
              <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-900">{flag}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div className="p-3 bg-gradient-to-br from-rose-50 to-purple-50 rounded-xl border border-rose-100">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-rose-500">{icon}</span>
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
