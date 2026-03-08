// Unified AI-powered relationship coaching logic
import ConversationCoach from "../models/ConversationCoach.js";
import UserProfile from "../models/UserProfile.js";
import Match from "../models/Match.js";

/**
 * Call Gemini API to generate a coach response.
 * Falls back to null on error so we can use rule-based responses instead.
 */
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("")
        .trim() || null;
    return text;
  } catch (err) {
    console.error("Gemini request failed:", err);
    return null;
  }
}

/**
 * Generate conversation starters based on both users' profiles
 */
export function generateConversationStarters(myProfile, otherProfile, match) {
  const starters = [];
  
  // Find shared interests
  const sharedInterests = (myProfile.interests || []).filter(i => 
    (otherProfile.interests || []).includes(i)
  );
  
  // Find shared values
  const sharedValues = (myProfile.values || []).filter(v => 
    (otherProfile.values || []).includes(v)
  );
  
  // Shared hobbies
  const sharedHobbies = (myProfile.hobbies || []).filter(h => 
    (otherProfile.hobbies || []).includes(h)
  );
  
  // Generate starters based on shared interests
  if (sharedInterests.length > 0) {
    const interest = sharedInterests[Math.floor(Math.random() * sharedInterests.length)];
    starters.push({
      tone: "curious",
      message: `I noticed we're both into ${interest}! What got you started with that? I'd love to hear your story 🌟`,
      context: `Shared interest: ${interest}`,
    });
    
    starters.push({
      tone: "playful",
      message: `Fellow ${interest} enthusiast! 😄 We should swap stories - what's your favorite ${interest} memory?`,
      context: `Shared interest: ${interest}`,
    });
  }
  
  // Generate starters based on shared values
  if (sharedValues.length > 0) {
    const value = sharedValues[Math.floor(Math.random() * sharedValues.length)];
    starters.push({
      tone: "warm",
      message: `It's refreshing to meet someone who values ${value} as much as I do. That says a lot about a person ✨`,
      context: `Shared value: ${value}`,
    });
  }
  
  // Generate starters based on shared hobbies
  if (sharedHobbies.length > 0) {
    const hobby = sharedHobbies[Math.floor(Math.random() * sharedHobbies.length)];
    starters.push({
      tone: "flirty",
      message: `Someone else who loves ${hobby}? This might be the start of something amazing... care to join me for some ${hobby} soon? 💕`,
      context: `Shared hobby: ${hobby}`,
    });
  }
  
  // Dating intent matching
  if (myProfile.dating_intent === otherProfile.dating_intent) {
    starters.push({
      tone: "sincere",
      message: `I appreciate that we're both looking for ${myProfile.dating_intent.replace('_', ' ')}. It's nice to be on the same page from the start 😊`,
      context: `Shared dating intent: ${myProfile.dating_intent}`,
    });
  }
  
  // Personality-based starters
  if (myProfile.personality_tags?.includes("adventurous") && 
      otherProfile.personality_tags?.includes("adventurous")) {
    starters.push({
      tone: "adventurous",
      message: `Two adventurous souls! 🎯 What's the most spontaneous thing you've done recently? I'm always up for new experiences!`,
      context: "Both adventurous personalities",
    });
  }
  
  if (myProfile.personality_tags?.includes("romantic") && 
      otherProfile.personality_tags?.includes("romantic")) {
    starters.push({
      tone: "romantic",
      message: `I have a feeling we both believe in old-school romance... what's your idea of a perfect date? 💫`,
      context: "Both romantic personalities",
    });
  }
  
  // Fallback generic starters if no specific matches
  if (starters.length === 0) {
    starters.push({
      tone: "warm",
      message: `Hey ${otherProfile.display_name?.split(' ')[0] || 'there'}! Your profile really caught my eye. I'd love to get to know you better! 😊`,
      context: "General introduction",
    });
    
    starters.push({
      tone: "curious",
      message: `I have a feeling we'd have some really interesting conversations. What's something you're passionate about right now? 🌟`,
      context: "Getting to know you",
    });
  }
  
  // Ensure at least 5 starters
  while (starters.length < 5) {
    const fallbacks = [
      { tone: "playful", message: "So... besides being attractive and interesting, what else are you into? 😉", context: "Playful curiosity" },
      { tone: "sincere", message: "I believe the best connections start with genuine curiosity. Tell me something that makes you smile!", context: "Authentic connection" },
    ];
    starters.push(fallbacks[starters.length % 2]);
  }
  
  return starters.slice(0, 10); // Return max 10 starters
}

/**
 * Generate a professional review of the user's profile with improvement suggestions
 */
export async function generateProfileReview(userProfile) {
  if (!userProfile) return null;

  const prompt = `
    You are AURA's AI Profile Consultant. Review the following dating profile and provide professional, actionable feedback.
    
    User Profile:
    - Display Name: ${userProfile.display_name}
    - Bio: "${userProfile.bio || "No bio provided"}"
    - Dating Intent: ${userProfile.dating_intent?.replace(/_/g, " ")}
    - Interests: ${userProfile.interests?.join(", ") || "None listed"}
    - Values: ${userProfile.values?.join(", ") || "None listed"}
    - Personality: ${userProfile.personality_tags?.join(", ") || "None listed"}
    
    Provide your review in JSON format with these keys:
    1. "overall_impression": A brief summary of how the profile comes across (1-2 sentences).
    2. "strengths": Array of 2-3 things that are working well.
    3. "improvements": Array of 3 specific, actionable suggestions to make the profile more attractive/effective.
    4. "suggested_bio": A rewritten, more engaging version of their bio (keep it under 300 characters).
    5. "score": A numerical score from 1-100 for profile completeness and impact.
    
    Response MUST be valid JSON.
  `;

  const geminiResponse = await callGemini(prompt);
  
  if (geminiResponse) {
    try {
      // Clean up potential markdown formatting in response
      const cleaned = geminiResponse.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.error("Failed to parse profile review JSON:", err);
    }
  }

  // Fallback if Gemini fails
  return {
    overall_impression: "Your profile provides a good foundation but could use more specific details to stand out.",
    strengths: [
      userProfile.interests?.length > 0 ? "You've listed several interests which helps start conversations." : "You have a clear display name.",
      userProfile.dating_intent ? "Your dating intent is clear, which helps attract like-minded people." : "You've started setting up your profile."
    ],
    improvements: [
      "Add more specific details to your bio that showcase your unique personality.",
      "Ensure your interests reflect hobbies that are easy to talk about.",
      "Consider adding more personality tags to give others a better sense of who you are."
    ],
    suggested_bio: userProfile.bio || "Hi! I'm looking for meaningful connections and shared adventures. Let's chat and see where things go!",
    score: userProfile.bio ? 65 : 40
  };
}

/**
 * Generate natural, contextual responses as a relationship coach
 */
export async function generateCoachResponse(userMessage, userEmail) {
  try {
    // Get user's profile for context
    const userProfile = await UserProfile.findOne({ user_email: userEmail });
    
    // Get conversation history and coaching style
    let coachData = await ConversationCoach.findOne({ user_email: userEmail });
    
    if (!coachData) {
      coachData = await ConversationCoach.create({
        user_email: userEmail,
        messages: [],
        context: { mood: "neutral", urgency: "low" },
        coaching_style: "supportive",
      });
    }
    
    // Analyze message to determine category and mood
    const analysis = analyzeUserMessage(userMessage);
    
    // Build a rich prompt for Gemini with context
    const profileSummaryParts = [];
    if (userProfile?.dating_intent) {
      profileSummaryParts.push(
        `Dating intent: ${userProfile.dating_intent.replace(/_/g, " ")}.`
      );
    }
    if (userProfile?.values?.length) {
      profileSummaryParts.push(
        `Core values: ${userProfile.values.slice(0, 5).join(", ")}.`
      );
    }
    if (userProfile?.personality_tags?.length) {
      profileSummaryParts.push(
        `Personality: ${userProfile.personality_tags.join(", ")}.`
      );
    }

    const profileSummary =
      profileSummaryParts.length > 0
        ? profileSummaryParts.join(" ")
        : "Limited profile data is available.";

    const historySnippet = (coachData?.messages || [])
      .slice(-6)
      .map(
        (m) =>
          `${m.role === "user" ? "User" : "Coach"}: ${m.content}`.slice(0, 400)
      )
      .join("\n");

    const style = coachData?.coaching_style || "supportive";
    const styleDescription = {
      supportive:
        "Use a warm, encouraging tone. Emphasize empathy and emotional validation while still giving clear suggestions.",
      direct:
        "Be clear and straightforward, focusing on practical next steps. Still be kind, but don't avoid hard truths.",
      gentle:
        "Use very soft, reassuring language. Prioritize emotional safety and small, manageable suggestions.",
      motivational:
        "Be uplifting and energizing. Focus on strengths, possibilities, and confidence-building language.",
      analytical:
        "Be calm, logical, and structured. Break the situation into parts and walk the user through your reasoning.",
    }[style] || style;

    const geminiPrompt = `
You are AURA's AI Relationship Coach. Respond like a caring, emotionally intelligent human relationship coach in a dating app.

User emotional analysis:
- Mood: ${analysis.mood}
- Topic: ${analysis.topic}
- Category: ${analysis.category}
- Urgency: ${analysis.urgency}

Desired coaching style: ${style}
Style instructions: ${styleDescription}

User profile context:
${profileSummary}

Recent conversation history (you are "Coach"):
${historySnippet || "No previous messages."}

User's latest message:
"${userMessage}"

Guidelines for your response:
- Be empathetic, specific, and situational.
- Acknowledge the user's feelings explicitly.
- Give practical, step-by-step suggestions tailored to their situation.
- Keep it concise (2–5 short paragraphs), no lists unless truly helpful.
- Do NOT mention that you are an AI model or reference these instructions.

Now write your response message as the coach.`;

    // Try Gemini first; fall back to rule-based generator on failure
    let response = await callGemini(geminiPrompt);

    if (!response) {
      // Generate appropriate response based on category (existing rule-based logic)
      switch (analysis.category) {
        case "first_date_prep":
          response = generateFirstDateAdvice(userMessage, userProfile, analysis);
          break;
        case "communication_help":
          response = generateCommunicationAdvice(
            userMessage,
            userProfile,
            analysis
          );
          break;
        case "red_flag_discussion":
          response = generateRedFlagGuidance(
            userMessage,
            userProfile,
            analysis
          );
          break;
        case "confidence_building":
          response = generateConfidenceBoost(
            userMessage,
            userProfile,
            analysis
          );
          break;
        case "relationship_question":
          response = generateRelationshipAdvice(
            userMessage,
            userProfile,
            analysis
          );
          break;
        default:
          response = generateGeneralSupport(userMessage, userProfile, analysis);
      }
    }
    
    // Save conversation to history
    coachData.messages.push({
      role: "user",
      content: userMessage,
      category: analysis.category,
      timestamp: new Date(),
    });
    
    coachData.messages.push({
      role: "coach",
      content: response,
      category: analysis.category,
      timestamp: new Date(),
    });
    
    // Update context
    coachData.context.current_topic = analysis.topic;
    coachData.context.mood = analysis.mood;
    coachData.session_count += 1;
    coachData.last_active = new Date();
    
    // Track common topics
    const existingTopic = coachData.common_topics.find(t => t.topic === analysis.topic);
    if (existingTopic) {
      existingTopic.count += 1;
      existingTopic.last_discussed = new Date();
    } else {
      coachData.common_topics.push({
        topic: analysis.topic,
        count: 1,
        last_discussed: new Date(),
      });
    }
    
    await coachData.save();
    
    return {
      response,
      category: analysis.category,
      mood: analysis.mood,
      topic: analysis.topic,
    };
  } catch (err) {
    console.error("Error generating coach response:", err);
    return {
      response: generateGeneralSupport(
        userMessage,
        null,
        { mood: "neutral", topic: "general", category: "general_advice", urgency: "low" }
      ),
      category: "general_advice",
      mood: "neutral",
      topic: "general",
    };
  }
}

/**
 * Analyze user message to understand intent and emotion
 */
function analyzeUserMessage(message) {
  const lowerMsg = message.toLowerCase();
  
  // Detect mood
  let mood = "neutral";
  if (lowerMsg.includes("sad") || lowerMsg.includes("upset") || lowerMsg.includes("cry")) {
    mood = "sad";
  } else if (lowerMsg.includes("anxious") || lowerMsg.includes("nervous") || lowerMsg.includes("worried")) {
    mood = "anxious";
  } else if (lowerMsg.includes("excited") || lowerMsg.includes("happy") || lowerMsg.includes("great")) {
    mood = "excited";
  } else if (lowerMsg.includes("frustrated") || lowerMsg.includes("angry") || lowerMsg.includes("annoyed")) {
    mood = "frustrated";
  } else if (lowerMsg.includes("confused") || lowerMsg.includes("unsure") || lowerMsg.includes("don't know")) {
    mood = "confused";
  } else if (lowerMsg.includes("hopeful") || lowerMsg.includes("optimistic")) {
    mood = "hopeful";
  }
  
  // Detect category
  let category = "general_advice";
  let topic = "general";

  const hasConversationWords =
    lowerMsg.includes("start a conversation") ||
    lowerMsg.includes("start conversation") ||
    (lowerMsg.includes("how") && lowerMsg.includes("talk") && lowerMsg.includes("her")) ||
    (lowerMsg.includes("how") && lowerMsg.includes("talk") && lowerMsg.includes("him")) ||
    lowerMsg.includes("how do i start a conversation");

  const hasConfessionWords =
    (lowerMsg.includes("tell") || lowerMsg.includes("say")) &&
    (lowerMsg.includes("love") || lowerMsg.includes("like")) &&
    (lowerMsg.includes("girl") || lowerMsg.includes("guy") || lowerMsg.includes("him") || lowerMsg.includes("her"));

  if (
    lowerMsg.includes("first date") ||
    lowerMsg.includes("date tonight") ||
    lowerMsg.includes("what to wear")
  ) {
    category = "first_date_prep";
    topic = "first dates";
  } else if (
    lowerMsg.includes("text") ||
    lowerMsg.includes("message") ||
    lowerMsg.includes("call back") ||
    hasConversationWords
  ) {
    category = "communication_help";
    topic = "communication";
  } else if (
    lowerMsg.includes("red flag") ||
    lowerMsg.includes("warning sign") ||
    lowerMsg.includes("concern")
  ) {
    category = "red_flag_discussion";
    topic = "red flags";
  } else if (
    lowerMsg.includes("confident") ||
    lowerMsg.includes("insecure") ||
    lowerMsg.includes("not good enough") ||
    (hasConfessionWords &&
      (lowerMsg.includes("fear") ||
        lowerMsg.includes("afraid") ||
        lowerMsg.includes("scared")))
  ) {
    category = "confidence_building";
    topic = "self-confidence";
  } else if (
    lowerMsg.includes("relationship") ||
    lowerMsg.includes("partner") ||
    lowerMsg.includes("together") ||
    hasConfessionWords
  ) {
    category = "relationship_question";
    topic = "relationship dynamics";
  } else if (
    lowerMsg.includes("break up") ||
    lowerMsg.includes("breakup") ||
    lowerMsg.includes("single")
  ) {
    category = "breakup_support";
    topic = "breakups";
  }
  
  // Detect urgency
  let urgency = "low";
  if (lowerMsg.includes("urgent") || lowerMsg.includes("asap") || lowerMsg.includes("right now")) {
    urgency = "high";
  } else if (lowerMsg.includes("soon") || lowerMsg.includes("tomorrow")) {
    urgency = "medium";
  }
  
  return { category, mood, topic, urgency };
}

/**
 * Generate advice for first dates
 */
function generateFirstDateAdvice(message, profile, analysis) {
  const tips = [
    "Remember, authenticity is your best asset. Be yourself - the right person will appreciate you for who you are!",
    "A great first date is about connection, not perfection. Focus on listening and being present.",
    "It's normal to feel nervous! Take a few deep breaths before you go. You've got this!",
    "Prepare a few conversation starters based on shared interests. It shows you paid attention to their profile.",
    "Dress in something that makes you feel confident and comfortable. When you feel good, it shows!",
  ];
  
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  
  return `Great question about first dates! ${randomTip}
  
Here's my advice: Focus on having fun and getting to know them. Ask open-ended questions about their interests, share stories that show your personality, and remember - they're probably just as nervous as you are!

What specifically are you wondering about? I can help with conversation topics, outfit choices, or managing pre-date jitters.`;
}

/**
 * Generate communication advice
 */
function generateCommunicationAdvice(message, profile, analysis) {
  return `Communication is key in any relationship! Here's what I recommend:

💬 **Be Clear & Direct**: Don't play games. If you like someone, show genuine interest. If something bothers you, address it respectfully.

⏰ **Timing Matters**: Give people space to respond. Don't double-text excessively or expect immediate replies.

🎯 **Quality Over Quantity**: One thoughtful message is better than ten generic ones. Reference things you've discussed before.

😊 **Use Emojis Wisely**: They add tone and personality, but don't overdo it. Match their energy.

❓ **Ask Follow-Up Questions**: Show you're listening by asking about details they share.

What's your specific situation? I can give more tailored advice!`;
}

/**
 * Generate guidance about red flags
 */
function generateRedFlagGuidance(message, profile, analysis) {
  return `I'm glad you're paying attention to potential warning signs - that's really smart! 🛡️

Here are some important red flags to watch for:

⚠️ **Disrespect**: How they treat waitstaff, friends, or family tells you everything.

⚠️ **Pushing Boundaries**: If they pressure you after you've said no, that's a major concern.

⚠️ **Inconsistency**: Words and actions don't match? Pay attention to the actions.

⚠️ **Love Bombing**: Too much, too soon can be manipulation, not romance.

⚠️ **Isolation Attempts**: Trying to separate you from friends/family is controlling behavior.

Trust your gut! If something feels off, it probably is. You deserve someone who respects and values you.

Want to talk about a specific situation you're concerned about?`;
}

/**
 * Generate confidence-building response
 */
function generateConfidenceBoost(message, profile, analysis) {
  const affirmations = [
    "You are worthy of love and respect exactly as you are.",
    "Your unique qualities are your superpower - own them!",
    "Confidence isn't about being perfect; it's about being authentically you.",
    "The right person will celebrate everything you bring to a relationship.",
    "You have so much to offer - kindness, humor, perspective, and care.",
  ];
  
  const affirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
  
  return `${affirmation} 💕

Building confidence is a journey, not a destination. Here are some things that might help:

✨ **List Your Strengths**: Write down 5 things you love about yourself. Read it daily.

✨ **Practice Self-Care**: When you take care of your body and mind, confidence grows naturally.

✨ **Celebrate Small Wins**: Did you start a conversation? That's progress! Celebrate it.

✨ **Surround Yourself with Positivity**: Spend time with people who uplift you.

✨ **Challenge Negative Thoughts**: Would you say those things to a friend? Be as kind to yourself.

Remember: Dating isn't about proving your worth. It's about finding someone who recognizes it.

What's making you feel unsure today? Let's work through it together.`;
}

/**
 * Generate general relationship advice
 */
function generateRelationshipAdvice(message, profile, analysis) {
  return `Relationships can be beautifully complex! Let me share some wisdom:

💕 **Healthy Relationships Have**:
- Open, honest communication
- Mutual respect and trust
- Individual identities maintained
- Support during tough times
- Shared laughter and joy

🌱 **Growth Mindset**: Every relationship teaches us something. Even challenges help us grow.

⚖️ **Balance**: Give and take should feel relatively equal over time.

🎯 **Alignment**: Core values and life goals should be compatible.

What aspect of your relationship would you like to explore? Communication, boundaries, intimacy, future planning? I'm here to help!`;
}

/**
 * Generate general supportive response
 */
function generateGeneralSupport(message, profile, analysis) {
  const lowerMsg = message.toLowerCase();

  // Try to reflect their situation a bit
  let focusLine = "";
  if (
    lowerMsg.includes("start a conversation") ||
    lowerMsg.includes("start conversation") ||
    (lowerMsg.includes("how") && lowerMsg.includes("talk") && lowerMsg.includes("her")) ||
    (lowerMsg.includes("how") && lowerMsg.includes("talk") && lowerMsg.includes("him"))
  ) {
    focusLine =
      "It sounds like you're thinking a lot about how to start a conversation and make a good first impression.";
  } else if (
    lowerMsg.includes("love") &&
    (lowerMsg.includes("girl") ||
      lowerMsg.includes("guy") ||
      lowerMsg.includes("him") ||
      lowerMsg.includes("her"))
  ) {
    focusLine =
      "You're carrying real feelings for someone, and it's completely normal to feel nervous about saying that out loud.";
  } else if (
    lowerMsg.includes("fear") ||
    lowerMsg.includes("afraid") ||
    lowerMsg.includes("scared")
  ) {
    focusLine =
      "I can hear there’s some fear or anxiety underneath what you’re sharing, and that deserves gentle handling.";
  } else if (lowerMsg.includes("first date")) {
    focusLine =
      "First dates bring up a mix of excitement and pressure, and it makes sense that you want to handle it well.";
  }

  const moodLineMap = {
    sad: "Whatever you're feeling right now is valid, and you don't have to push it away for us to work on this together.",
    anxious:
      "Anxiety around dating and relationships is more common than people admit—you're not alone in feeling this way.",
    excited:
      "It's actually a good sign that you're excited; it means this matters to you and there's something real here for you.",
    frustrated:
      "Frustration usually means your needs or expectations aren't being met, and we can unpack that calmly.",
    confused:
      "Confusion is a natural part of figuring people and relationships out—we can take it one small piece at a time.",
    hopeful:
      "That feeling of hope you have is important; we can use it as fuel while still staying realistic and grounded.",
    neutral:
      "Even if you’re not sure exactly what you’re feeling, that’s okay—we can sort through it step by step.",
  };

  const moodLine = moodLineMap[analysis?.mood] || moodLineMap.neutral;

  return `I hear you, and I'm here to support you genuinely—not with canned lines, but by really thinking about your situation. 💙

${focusLine || "Dating and relationships can stir up a lot at once—excitement, nerves, doubts, and hope all mixed together."}

${moodLine}

From what you've shared, a useful next step would be:
- Step back and name what you actually want here (connection, clarity, courage, closure, etc.).
- Then we can turn that into 1–2 simple actions or messages you can try in real life.

If you want, you can tell me a bit more detail (for example: how long you've known this person, how you usually talk, or what you're most afraid will happen), and I'll give you a concrete suggestion you can use word-for-word.`;
}

/**
 * Get conversation history for a user
 */
export async function getConversationHistory(userEmail, limit = 20) {
  const coachData = await ConversationCoach.findOne({ user_email: userEmail })
    .sort({ 'messages.timestamp': -1 })
    .limit(limit);
  
  if (!coachData) {
    return { messages: [], context: null };
  }
  
  return {
    messages: coachData.messages.slice(-limit),
    context: coachData.context,
    session_count: coachData.session_count,
    coaching_style: coachData.coaching_style,
  };
}

/**
 * Clear conversation history
 */
export async function clearConversationHistory(userEmail) {
  await ConversationCoach.findOneAndUpdate(
    { user_email: userEmail },
    { $set: { messages: [], context: { mood: "neutral", urgency: "low" } } }
  );
  
  return { success: true };
}

/**
 * Set coaching style preference
 */
export async function setCoachingStyle(userEmail, style) {
  const updated = await ConversationCoach.findOneAndUpdate(
    { user_email: userEmail },
    { $set: { coaching_style: style } },
    { new: true }
  );
  
  return updated;
}

/**
 * Generate date guidance for specific event types
 */
export function generateDateGuidance(eventType, eventName) {
  const guidanceDatabase = {
    coffee_shop: {
      preparation_tips: [
        "Arrive 5 minutes early to get settled",
        "Choose a quiet corner for better conversation",
        "Have 2-3 backup topics ready",
      ],
      conversation_topics: [
        "Favorite coffee orders and why",
        "Weekend routines and hobbies",
        "Travel stories and dream destinations",
      ],
      etiquette_notes: [
        "Offer to pay, but respect if they insist on splitting",
        "Keep phones away and maintain eye contact",
        "Be mindful of time - 1-2 hours is perfect for first dates",
      ],
      what_to_wear: "Smart casual - clean, well-fitted clothes that make you feel confident",
      estimated_duration: "1-2 hours",
    },
    art_exhibit: {
      preparation_tips: [
        "Research the exhibit beforehand",
        "Think about your favorite art styles",
        "Prepare questions about their interpretations",
      ],
      conversation_topics: [
        "What draws you to certain pieces",
        "Creative pursuits and inspiration",
        "Cultural experiences and museums",
      ],
      etiquette_notes: [
        "Speak quietly in gallery spaces",
        "Don't touch the artwork",
        "Walk at a comfortable pace for both",
      ],
      what_to_wear: "Artsy chic - show your personal style while staying comfortable for walking",
      estimated_duration: "2-3 hours",
    },
    concert: {
      preparation_tips: [
        "Check venue rules about bags and cameras",
        "Arrive early to find good spots",
        "Know the setlist if possible",
      ],
      conversation_topics: [
        "Favorite songs and artists",
        "First concert memories",
        "Music's impact on emotions",
      ],
      etiquette_notes: [
        "Respect personal space in crowds",
        "Sing along but don't scream in their ear",
        "Be present in the moment together",
      ],
      what_to_wear: "Venue-appropriate - casual for clubs, dressier for symphonies",
      estimated_duration: "3-4 hours",
    },
    outdoor_activity: {
      preparation_tips: [
        "Check weather forecast",
        "Bring water and snacks",
        "Wear appropriate footwear",
      ],
      conversation_topics: [
        "Favorite outdoor adventures",
        "Nature preferences (beach vs mountains)",
        "Active lifestyle and wellness",
      ],
      etiquette_notes: [
        "Match their pace and fitness level",
        "Practice Leave No Trace principles",
        "Prioritize safety over showing off",
      ],
      what_to_wear: "Athletic/activewear - comfort and functionality first",
      estimated_duration: "2-4 hours",
    },
    restaurant: {
      preparation_tips: [
        "Make reservations in advance",
        "Check menu for dietary restrictions",
        "Dress code awareness",
      ],
      conversation_topics: [
        "Favorite cuisines and dishes",
        "Cooking skills and food experiments",
        "Memorable dining experiences",
      ],
      etiquette_notes: [
        "Be polite to servers",
        "Use proper table manners",
        "Split bill gracefully or take turns treating",
      ],
      what_to_wear: "Business casual to formal depending on restaurant",
      estimated_duration: "1.5-2.5 hours",
    },
  };
  
  return guidanceDatabase[eventType] || guidanceDatabase.coffee_shop;
}

/**
 * Calculate event compatibility score between users
 */
export function calculateEventCompatibility(myProfile, otherProfile, event) {
  let score = 50; // Base score
  const reasons = [];
  
  // Shared interests boost
  const sharedInterests = (myProfile.interests || []).filter(i => 
    (otherProfile.interests || []).includes(i)
  );
  if (sharedInterests.length > 0) {
    score += Math.min(sharedInterests.length * 10, 30);
    reasons.push(`${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}`);
  }
  
  // Shared values boost
  const sharedValues = (myProfile.values || []).filter(v => 
    (otherProfile.values || []).includes(v)
  );
  if (sharedValues.length > 0) {
    score += Math.min(sharedValues.length * 8, 20);
    reasons.push(`Shared values`);
  }
  
  // Personality compatibility
  const compatiblePairs = [
    ['adventurous', 'adventurous'],
    ['romantic', 'romantic'],
    ['homebody', 'homebody'],
    ['social_butterfly', 'social_butterfly'],
  ];
  
  const myTraits = myProfile.personality_tags || [];
  const otherTraits = otherProfile.personality_tags || [];
  
  compatiblePairs.forEach(([trait1, trait2]) => {
    if (myTraits.includes(trait1) && otherTraits.includes(trait2)) {
      score += 10;
      reasons.push(`Both ${trait1}`);
    }
  });
  
  // Cap score at 100
  score = Math.min(score, 100);
  
  return {
    score,
    reasons,
    recommendation: score >= 75 ? "Highly Compatible!" : score >= 60 ? "Good Match" : "Worth Exploring",
  };
}

/**
 * Get educational content about red flags
 */
export function getRedFlagsEducation() {
  return {
    categories: [
      {
        name: "Communication Red Flags",
        items: [
          {
            flag: "Stonewalling",
            description: "Refusing to communicate or giving silent treatment",
            healthy_alternative: "Open dialogue even during disagreements",
          },
          {
            flag: "Constant Criticism",
            description: "Regular put-downs disguised as jokes or 'help'",
            healthy_alternative: "Constructive feedback delivered with kindness",
          },
          {
            flag: "Guilt Tripping",
            description: "Making you feel responsible for their emotions",
            healthy_alternative: "Taking ownership of their own feelings",
          },
        ],
      },
      {
        name: "Behavioral Red Flags",
        items: [
          {
            flag: "Disrespecting Boundaries",
            description: "Ignoring your limits after you've expressed them",
            healthy_alternative: "Honoring and respecting boundaries",
          },
          {
            flag: "Controlling Behavior",
            description: "Dictating who you see, what you wear, where you go",
            healthy_alternative: "Supporting your independence and autonomy",
          },
          {
            flag: "Volatile Temper",
            description: "Explosive anger or intimidation tactics",
            healthy_alternative: "Managing emotions in healthy ways",
          },
        ],
      },
      {
        name: "Emotional Red Flags",
        items: [
          {
            flag: "Love Bombing",
            description: "Overwhelming affection too soon to gain control",
            healthy_alternative: "Gradual, consistent emotional development",
          },
          {
            flag: "Emotional Unavailability",
            description: "Unwillingness to discuss feelings or future",
            healthy_alternative: "Emotional openness and vulnerability",
          },
          {
            flag: "Jealousy and Possessiveness",
            description: "Accusations without cause, monitoring your activities",
            healthy_alternative: "Trust and respect for privacy",
          },
        ],
      },
    ],
    resources: [
      "If you recognize these patterns, trust your instincts",
      "Healthy relationships are built on mutual respect and trust",
      "Consider speaking with a therapist or counselor",
      "National Domestic Violence Hotline: 1-800-799-SAFE (7233)",
    ],
  };
}

/**
 * Generate communication tips for a specific match
 */
export function generateCommunicationTips(myProfile, otherProfile, match) {
  const tips = [];
  
  // Based on their dating intent
  if (otherProfile.dating_intent === "long_term") {
    tips.push({
      category: "Approach",
      tip: "They're looking for something serious - be genuine and show interest in deeper conversations.",
    });
  } else if (otherProfile.dating_intent === "casual") {
    tips.push({
      category: "Approach",
      tip: "Keep things light and fun initially. Let things develop naturally without pressure.",
    });
  }
  
  // Based on their personality
  if (otherProfile.personality_tags?.includes("introvert")) {
    tips.push({
      category: "Communication Style",
      tip: "They may need time to open up. Don't take it personally if responses aren't immediate.",
    });
  }
  
  if (otherProfile.personality_tags?.includes("extrovert")) {
    tips.push({
      category: "Communication Style",
      tip: "They thrive on interaction! Regular check-ins and engaging conversations will be appreciated.",
    });
  }
  
  // Based on interests
  if ((otherProfile.interests || []).length > 0) {
    const interest = otherProfile.interests[0];
    tips.push({
      category: "Conversation Starter",
      tip: `Ask about their interest in ${interest}. People love talking about their passions!`,
    });
  }
  
  // General best practices
  tips.push({
    category: "Best Practice",
    tip: "Be authentic. The right person will appreciate you for who you are.",
  });
  
  tips.push({
    category: "Timing",
    tip: "Quality over quantity - one thoughtful message beats ten generic ones.",
  });
  
  return tips;
}

export default {
  generateCoachResponse,
  getConversationHistory,
  clearConversationHistory,
  setCoachingStyle,
  generateConversationStarters,
  generateDateGuidance,
  calculateEventCompatibility,
  getRedFlagsEducation,
  generateCommunicationTips,
};
