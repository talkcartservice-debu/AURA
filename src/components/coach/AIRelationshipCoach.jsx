import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { relationshipCoachService } from "@/api/entities";
import { Heart, MessageCircle, Lightbulb, Shield, Brain, Sparkles, Loader2, UserCheck, Star, Target, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConversationStarterSelector from "./ConversationStarterSelector";
import ChatWithCoach from "./ChatWithCoach";

export default function AIRelationshipCoach() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: coachData, isLoading } = useQuery({
    queryKey: ["coachDashboard"],
    queryFn: relationshipCoachService.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
          <Brain className="w-8 h-8 text-purple-600" />
          AI Relationship Coach
        </h1>
        <p className="text-gray-500 mt-1">
          Your personal guide to healthier, more meaningful connections
        </p>
      </div>

      {/* Health Score Overview */}
      {coachData?.relationship_health && (
        <Card className="mb-6 bg-gradient-to-br from-rose-50 to-purple-50 border-rose-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Relationship Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <HealthScoreGauge 
                label="Overall" 
                score={coachData.relationship_health.overall_score} 
                color="from-rose-500 to-purple-600"
              />
              <HealthScoreGauge 
                label="Communication" 
                score={coachData.relationship_health.components.communication} 
                color="from-blue-400 to-blue-600"
              />
              <HealthScoreGauge 
                label="Trust" 
                score={coachData.relationship_health.components.trust} 
                color="from-green-400 to-green-600"
              />
              <HealthScoreGauge 
                label="Respect" 
                score={coachData.relationship_health.components.respect} 
                color="from-yellow-400 to-yellow-600"
              />
              <HealthScoreGauge 
                label="Connection" 
                score={coachData.relationship_health.components.emotional_connection} 
                color="from-pink-400 to-pink-600"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Review</span>
          </TabsTrigger>
          <TabsTrigger value="starters" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Starters</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="tips" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">Tips</span>
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Education</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardContent data={coachData} />
        </TabsContent>

        <TabsContent value="review">
          <ProfileReviewSection />
        </TabsContent>

        <TabsContent value="starters">
          <ConversationStarterSelector />
        </TabsContent>

        <TabsContent value="chat">
          <ChatWithCoach />
        </TabsContent>

        <TabsContent value="tips">
          <CommunicationTipsSection />
        </TabsContent>

        <TabsContent value="education">
          <RedFlagsEducationSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HealthScoreGauge({ label, score, color }) {
  const percentage = Math.min(100, Math.max(0, score || 0));
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-1000`}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={`text-${color.split('-')[1]}-400`} stopColor="currentColor" />
              <stop offset="100%" className={`text-${color.split('-')[1]}-600`} stopColor="currentColor" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-700">{Math.round(percentage)}%</span>
        </div>
      </div>
      <span className="text-xs text-gray-600 mt-2 text-center">{label}</span>
    </div>
  );
}

function HealthTrendChart({ history }) {
  if (!history || history.length < 2) return null;

  const maxScore = 100;
  const width = 400;
  const height = 100;
  const padding = 10;
  
  const points = history.map((entry, i) => {
    const x = (i / (history.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((entry.score / maxScore) * (height - padding * 2) + padding);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#9333ea" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Area under line */}
      <path
        d={`M ${points.split(' ')[0].split(',')[0]},${height} L ${points} L ${points.split(' ')[points.split(' ').length-1].split(',')[0]},${height} Z`}
        fill="url(#chartGradient)"
      />
      
      {/* The line */}
      <polyline
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
      </defs>

      {/* Points */}
      {history.map((entry, i) => {
        const x = (i / (history.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((entry.score / maxScore) * (height - padding * 2) + padding);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            className="fill-white stroke-purple-600 stroke-2 hover:r-6 transition-all duration-200"
          >
            <title>{new Date(entry.timestamp).toLocaleDateString()}: {entry.score}%</title>
          </circle>
        );
      })}
    </svg>
  );
}

function DashboardContent({ data }) {
  return (
    <div className="space-y-4">
      {/* Health Trend Chart */}
      {data?.health_history?.length > 1 && (
        <Card className="p-4 overflow-hidden">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-md flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Relationship Progress
            </CardTitle>
          </CardHeader>
          <div className="h-32 w-full">
            <HealthTrendChart history={data.health_history} />
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Insights</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.insights && data.insights.length > 0 ? (
            <div className="space-y-3">
              {data.insights.map((insight) => (
                <div
                  key={insight._id}
                  className={`p-3 rounded-xl border ${!insight.read ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900">{insight.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      {insight.actionable_advice && (
                        <p className="text-xs text-purple-600 mt-2 font-medium">
                          💡 {insight.actionable_advice}
                        </p>
                      )}
                    </div>
                    {!insight.read && (
                      <span className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0 mt-1"></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No insights yet. Start using AURA to get personalized relationship advice!
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{data?.total_tips_provided || 0}</p>
              <p className="text-xs text-blue-700 mt-1">Tips Provided</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{data?.red_flags_addressed || 0}</p>
              <p className="text-xs text-green-700 mt-1">Issues Addressed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CommunicationTipsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Communication Tips</CardTitle>
        <p className="text-sm text-gray-500">
          Improve your conversation quality and connection
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <TipCard
            type="active_listening"
            content="Show genuine interest by asking follow-up questions about things they share. Reference details from earlier conversations to show you're paying attention."
          />
          <TipCard
            type="vulnerability_sharing"
            content="Gradually share personal stories and feelings. Appropriate vulnerability builds trust and encourages them to open up too."
          />
          <TipCard
            type="humor_usage"
            content="Light humor and playfulness can ease tension, but avoid sarcasm early on as it can be misinterpreted in text."
          />
        </div>
      </CardContent>
    </Card>
  );
}

function TipCard({ type, content }) {
  const icons = {
    active_listening: "👂",
    vulnerability_sharing: "💝",
    humor_usage: "😄",
    boundary_setting: "🛡️",
    compliment_giving: "✨",
    question_asking: "❓",
  };

  return (
    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icons[type] || "💡"}</span>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 capitalize">
            {type.replace(/_/g, ' ')}
          </h4>
          <p className="text-sm text-gray-600 mt-1">{content}</p>
        </div>
      </div>
    </div>
  );
}

function RedFlagsEducationSection() {
  const { data: educationData } = useQuery({
    queryKey: ["redFlagsEducation"],
    queryFn: relationshipCoachService.getRedFlagsEducation,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Healthy Relationship Education
          </CardTitle>
          <p className="text-sm text-gray-500">
            Learn to recognize warning signs and build healthier connections
          </p>
        </CardHeader>
      </Card>

      {educationData?.categories?.map((category, idx) => (
        <EducationalCategory key={idx} category={category} />
      ))}

      {educationData?.resources && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <ul className="space-y-1 text-xs text-blue-800">
            {educationData.resources.map((line, idx) => (
              <li key={idx}>• {line}</li>
            ))}
          </ul>
        </div>
      )}

      {educationData?.disclaimer && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-800">
            ⚠️ {educationData.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}

function EducationalCategory({ category }) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <h3 className="font-bold text-gray-900">{category.name}</h3>
        {category.items?.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-white border border-gray-200"
          >
            <p className="text-sm font-semibold text-gray-900">
              {item.flag}
            </p>
            <p className="text-xs text-gray-600 mt-1">{item.description}</p>
            {item.healthy_alternative && (
              <p className="text-xs text-green-700 mt-2">
                Healthy alternative: {item.healthy_alternative}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ProfileReviewSection() {
  const { data: review, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["profileReview"],
    queryFn: relationshipCoachService.getProfileReview,
    enabled: false, // Don't fetch on mount
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-600" />
            AI Profile Consultant
          </CardTitle>
          <CardDescription>
            Get professional feedback on your profile to attract better matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => refetch()} 
            disabled={isLoading || isFetching}
            className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700"
          >
            {isLoading || isFetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Profile...
              </>
            ) : (
              "Review My Profile"
            )}
          </Button>
        </CardContent>
      </Card>

      {review && (
        <div className="space-y-4">
          <Card className="border-rose-200 bg-rose-50/30">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  Overall Score: {review.score}/100
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 italic">"{review.overall_impression}"</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.strengths?.map((s, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2 text-amber-700">
                  <Target className="w-4 h-4" />
                  Room for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.improvements?.map((s, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="border-purple-200 bg-purple-50/30">
            <CardHeader>
              <CardTitle className="text-md flex items-center gap-2 text-purple-700">
                <Sparkles className="w-4 h-4" />
                Suggested AI-Optimized Bio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-white rounded-xl border border-purple-100 relative">
                <p className="text-sm text-gray-800 leading-relaxed">{review.suggested_bio}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-4 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  onClick={() => {
                    navigator.clipboard.writeText(review.suggested_bio);
                    // Add toast notification if available
                  }}
                >
                  Copy to Clipboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
