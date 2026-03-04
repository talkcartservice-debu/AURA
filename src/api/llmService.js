const TEMPLATES = [
  { tone: "playful", tpl: (n, i) => `I see you're into ${i} too — want to have a friendly debate about the best way to enjoy it? 😄` },
  { tone: "curious", tpl: (n, i) => `Your love for ${i} caught my eye! What got you into it? I'd love to hear your story 🌟` },
  { tone: "warm", tpl: (n, i) => `Hey ${n}! We both share a passion for ${i} — I think that's a pretty great starting point, don't you? 😊` },
  { tone: "flirty", tpl: (n, i) => `Something tells me a ${i} lover like you has great taste in other things too... am I right? 😏` },
  { tone: "witty", tpl: (n, i) => `If ${i} was a love language, I think we'd already be fluent. What do you think, ${n}? ✨` },
];

const FALLBACKS = [
  { tone: "warm", message: "Hey! Your profile really caught my eye — I'd love to get to know you better! 😊" },
  { tone: "curious", message: "I have a feeling we'd have some really interesting conversations. Want to find out? 🌟" },
  { tone: "playful", message: "Your vibe is exactly what I've been looking for on here. Let's chat! 💕" },
];

/**
 * Generate an icebreaker message based on profile data.
 * Replaces base44.integrations.Core.InvokeLLM
 */
export function generateIcebreaker({ profile, myProfile, shared, score }) {
  return new Promise((resolve) => {
    // Simulate slight delay for UX
    setTimeout(() => {
      const name = profile.display_name?.split(" ")[0] || "there";

      if (shared.length > 0) {
        const interest = shared[Math.floor(Math.random() * shared.length)];
        const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
        resolve({
          message: template.tpl(name, interest),
          tone: template.tone,
        });
      } else {
        const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
        resolve(fallback);
      }
    }, 600 + Math.random() * 800);
  });
}
