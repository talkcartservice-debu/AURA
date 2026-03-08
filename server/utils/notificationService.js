import webpush from "web-push";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    "mailto:support@aurasoul.ai",
    publicVapidKey,
    privateVapidKey
  );
} else {
  console.warn("VAPID keys not found. Web push notifications will be disabled.");
}

/**
 * Send a web push notification to a user's registered subscriptions
 * @param {string} email - Recipient user email
 * @param {object} payload - Notification data (title, body, data)
 */
export async function sendNotificationToUser(email, { title, body, data }) {
  try {
    const user = await User.findOne({ email }).select("push_subscriptions");
    if (!user || !user.push_subscriptions || user.push_subscriptions.length === 0) {
      return;
    }

    const notificationPayload = JSON.stringify({
      notification: {
        title,
        body,
        icon: "/logo192.png",
        badge: "/badge.png",
        data: data || {}
      }
    });

    const results = await Promise.allSettled(
      user.push_subscriptions.map((sub) =>
        webpush.sendNotification(sub, notificationPayload)
      )
    );

    // Clean up expired or invalid subscriptions
    const invalidEndpoints = [];
    results.forEach((res, idx) => {
      if (res.status === "rejected") {
        const error = res.reason;
        // GCM/FCM error codes for expired/invalid tokens are often 410 or 404
        if (error.statusCode === 410 || error.statusCode === 404) {
          invalidEndpoints.push(user.push_subscriptions[idx].endpoint);
        }
      }
    });

    if (invalidEndpoints.length > 0) {
      await User.updateOne(
        { email },
        { $pull: { push_subscriptions: { endpoint: { $in: invalidEndpoints } } } }
      );
    }
  } catch (err) {
    console.error("Web Push Service Error:", err);
  }
}
