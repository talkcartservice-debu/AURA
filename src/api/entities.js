import api from "./apiClient";

// Auth
export const authService = {
  signup: (data) => api.post("/auth/signup", data).then((r) => r.data),
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  updatePassword: (data) => api.put("/auth/update-password", data).then((r) => r.data),
};

// Profiles
export const profileService = {
  getMe: () => api.get("/profiles/me").then((r) => r.data),
  updateMe: (data) => api.put("/profiles/me", data).then((r) => r.data),
  getByEmail: (email) => api.get(`/profiles/${encodeURIComponent(email)}`).then((r) => r.data),
  list: () => api.get("/profiles").then((r) => r.data),
};

// Daily Matches
export const matchService = {
  getDaily: () => api.get("/matches/daily").then((r) => r.data),
  updateDaily: (id, status) => api.patch(`/matches/daily/${id}`, { status }).then((r) => r.data),
  getMutual: () => api.get("/matches/mutual").then((r) => r.data),
  submitFeedback: (data) => api.post("/matches/feedback", data).then((r) => r.data),
};

// Likes
export const likeService = {
  create: (data) => api.post("/likes", data).then((r) => r.data),
};

// Messages
export const messageService = {
  getByMatch: (matchId) => api.get(`/messages/${matchId}`).then((r) => r.data),
  send: (data) => api.post("/messages", data).then((r) => r.data),
  markRead: (matchId) => api.patch(`/messages/${matchId}/read`).then((r) => r.data),
  delete: (messageId) => api.delete(`/messages/${messageId}`).then((r) => r.data),
  edit: (messageId, content) => api.put(`/messages/${messageId}`, { content }).then((r) => r.data),
  getUnreadCount: (matchId) => api.get(`/messages/${matchId}/unread-count`).then((r) => r.data),
  getLastMessages: () => api.get("/messages/matches/last-messages").then((r) => r.data),
};

// Groups
export const groupService = {
  list: () => api.get("/groups").then((r) => r.data),
  get: (id) => api.get(`/groups/${id}`).then((r) => r.data),
  create: (data) => api.post("/groups", data).then((r) => r.data),
  join: (id) => api.post(`/groups/${id}/join`).then((r) => r.data),
  leave: (id) => api.post(`/groups/${id}/leave`).then((r) => r.data),
};

// Events
export const eventService = {
  list: (groupId) => api.get("/events", { params: groupId ? { group_id: groupId } : {} }).then((r) => r.data),
  create: (data) => api.post("/events", data).then((r) => r.data),
  rsvp: (id) => api.post(`/events/${id}/rsvp`).then((r) => r.data),
};

// Verification
export const verificationService = {
  get: () => api.get("/verification").then((r) => r.data),
  submit: (selfie_url) => api.post("/verification", { selfie_url }).then((r) => r.data),
};

// Subscriptions
export const subscriptionService = {
  get: () => api.get("/subscriptions").then((r) => r.data),
  initialize: (data) =>
    api.post("/subscriptions/initialize", data).then((r) => r.data),
  verify: (reference) =>
    api.get(`/subscriptions/verify/${reference}`).then((r) => r.data),
  purchaseBoosts: (quantity) =>
    api.post("/subscriptions/purchase-boosts", { quantity }).then((r) => r.data),
  verifyBoosts: (reference) =>
    api.get(`/subscriptions/verify-boosts/${reference}`).then((r) => r.data),
  purchaseSuperLikes: (quantity) =>
    api.post("/subscriptions/purchase-super-likes", { quantity }).then((r) => r.data),
  useSuperLike: () =>
    api.post("/subscriptions/use-super-like").then((r) => r.data),
};

// Blind Dates
export const blindDateService = {
  optIn: () => api.post("/blind-dates/opt-in").then((r) => r.data),
  optOut: () => api.post("/blind-dates/opt-out").then((r) => r.data),
  getActive: () => api.get("/blind-dates/active").then((r) => r.data),
  start: () => api.post("/blind-dates/start").then((r) => r.data),
  sendMessage: (text) => api.post("/blind-dates/message", { text }).then((r) => r.data),
  cancel: () => api.post("/blind-dates/cancel").then((r) => r.data),
};

// Calls
export const callService = {
  getHistory: (matchId) => api.get(`/calls/history/${matchId}`).then((r) => r.data),
  getRecent: () => api.get("/calls/recent").then((r) => r.data),
  initiate: (data) => api.post("/calls/initiate", data).then((r) => r.data),
  accept: (data) => api.post("/calls/accept", data).then((r) => r.data),
  reject: (data) => api.post("/calls/reject", data).then((r) => r.data),
  end: (data) => api.post("/calls/end", data).then((r) => r.data),
};

// Upload
export const uploadService = {
  single: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url;
  },
  multiple: async (files) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    const res = await api.post("/upload/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.urls;
  },
};

// Privacy
export const privacyService = {
  getSettings: () => api.get("/privacy/settings").then((r) => r.data),
  updateSettings: (data) => api.put("/privacy/settings", data).then((r) => r.data),
  uploadBlurredPhoto: (photo_url, blurred_url) => 
    api.post("/privacy/upload-blurred-photo", { photo_url, blurred_url }).then((r) => r.data),
  getPublicPhotos: (email) => api.get(`/privacy/public-photos/${encodeURIComponent(email)}`).then((r) => r.data),
  enableDisappearingMessages: (match_id, duration_hours = 24) =>
    api.post("/privacy/enable-disappearing-messages", { match_id, duration_hours }).then((r) => r.data),
  getMessages: (match_id) => api.get(`/privacy/messages/${match_id}`).then((r) => r.data),
};

// Date Events
export const dateEventService = {
  getSuggestions: () => api.get("/date-events/suggestions").then((r) => r.data),
  getTypes: () => api.get("/date-events/types").then((r) => r.data),
  updatePreferences: (preferred_date_types) => 
    api.put("/date-events/preferences", { preferred_date_types }).then((r) => r.data),
  proposeDate: (event_id, match_id, message) =>
    api.post("/date-events/propose-date", { event_id, match_id, message }).then((r) => r.data),
  
  // Community events
  suggestCommunityEvent: (data) =>
    api.post("/date-events/suggest", data).then((r) => r.data),
  getCommunityEvents: (params) =>
    api.get("/date-events/community", { params }).then((r) => r.data),
  upvoteCommunityEvent: (id) =>
    api.post(`/date-events/community/${id}/upvote`).then((r) => r.data),
  
  // AI coach integration
  generateCoachTips: (match_id, event_type) =>
    api.post("/date-events/generate-coach-tips", { match_id, event_type }).then((r) => r.data),
  getMatchCompatibility: (matchId) =>
    api.get(`/date-events/match-compatibility/${matchId}`).then((r) => r.data),
};

// Relationship Coach
export const relationshipCoachService = {
  getDashboard: () => api.get("/coach/dashboard").then((r) => r.data),
  getConversationStarters: (matchId) =>
    api.get(`/coach/conversation-starters/${matchId}`).then((r) => r.data),
  getDateGuidance: (eventType, eventName) =>
    api.get(`/coach/date-guidance/${eventType}`, { params: { eventName } }).then((r) => r.data),
  getCommunicationTips: (matchId) =>
    api.get(`/coach/communication-tips/${matchId}`).then((r) => r.data),
  getRedFlagsEducation: () =>
    api.get("/coach/red-flags-education").then((r) => r.data),
  markInsightAsRead: (insightId) =>
    api.patch(`/coach/insights/${insightId}/read`).then((r) => r.data),
  rateInteraction: (interaction_id, rating) =>
    api.post("/coach/interactions/rate", { interaction_id, rating }).then((r) => r.data),
  
  // Chat with AI Coach
  chatWithCoach: (message) =>
    api.post("/coach/chat", { message }).then((r) => r.data),
  getChatHistory: (limit = 20) =>
    api.get("/coach/chat/history", { params: { limit } }).then((r) => r.data),
  clearChatHistory: () =>
    api.delete("/coach/chat/history").then((r) => r.data),
  setCoachingStyle: (style) =>
    api.put("/coach/chat/style", { style }).then((r) => r.data),
};
