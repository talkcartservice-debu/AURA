import { useEffect, useRef, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Compass, Heart, MessageCircle, Users, User, Calendar } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { messageService, profileService } from "@/api/entities";
import CallProvider from "@/components/calls/CallProvider";
import MatchCelebration from "@/components/matches/MatchCelebration";

const NAV_ITEMS = [
  { to: "/discover", icon: Compass, label: "Discover" },
  { to: "/matches", icon: Heart, label: "Matches" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/groups", icon: Users, label: "Groups" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function Layout() {
  const navigate = useNavigate();
  const { on, off } = useSocket();
  const notificationPermissionRequestedRef = useRef(false);
  const [hasShownUnreadSummary, setHasShownUnreadSummary] = useState(false);
  const [activeMatchCelebration, setActiveMatchCelebration] = useState(null);
  const [activeMatchProfile, setActiveMatchProfile] = useState(null);

  // Helper to show browser push notification (where supported)
  const showBrowserNotification = (title, body) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const create = () => {
      try {
        // eslint-disable-next-line no-new
        new Notification(title, { body });
      } catch {
        // Ignore notification errors
      }
    };

    if (Notification.permission === "granted") {
      create();
    } else if (Notification.permission === "default" && !notificationPermissionRequestedRef.current) {
      notificationPermissionRequestedRef.current = true;
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") create();
      });
    }
  };

  // Register global Socket.IO listeners for notifications
  useEffect(() => {
    const handleIncomingMessage = (payload) => {
      const { from_email, content, match_id } = payload || {};
      if (!from_email || !match_id) return;

      toast.info(`New message from ${from_email}`, {
        description: content,
        action: {
          label: "Open chat",
          onClick: () => navigate(`/chat/${match_id}`),
        },
      });

      showBrowserNotification("New message", `${from_email}: ${content || "New message received"}`);
    };

    const handleNewMatch = (payload) => {
      const { other_email, match_id } = payload || {};
      
      // Fetch profile for celebration popup
      if (other_email) {
        profileService.getByEmail(other_email)
          .then(profile => {
            setActiveMatchProfile(profile);
            setActiveMatchCelebration(payload);
          })
          .catch(console.error);
      }

      toast.success("It's a match! 💕", {
        description: other_email ? `You matched with ${other_email}` : undefined,
        action: {
          label: "View match",
          onClick: () => {
            if (match_id) {
              navigate(`/chat/${match_id}`);
            } else {
              navigate("/matches");
            }
          },
        },
      });

      showBrowserNotification("New match!", other_email ? `You matched with ${other_email}` : "You have a new match!");
    };

    const handleEventMessage = (payload) => {
      const { event_id, message } = payload || {};
      if (!event_id || !message) return;

      // Only show if not already on that event chat screen
      if (window.location.pathname !== `/events/${event_id}/chat`) {
        toast.info(`New event message`, {
          description: message.content || "Image received",
          action: {
            label: "Open chat",
            onClick: () => navigate(`/events/${event_id}/chat`),
          },
        });
      }
    };

    on("message_received", handleIncomingMessage);
    on("match_created", handleNewMatch);
    on("event_message_received", handleEventMessage);

    return () => {
      off("message_received");
      off("match_created");
      off("event_message_received");
    };
  }, [on, off, navigate]);

  // One-time summary notification for recent unread messages
  useEffect(() => {
    if (hasShownUnreadSummary) return;

    let cancelled = false;

    messageService
      .getLastMessages()
      .then((items) => {
        if (cancelled || !items) return;

        const unreadTotal = items.reduce(
          (sum, m) => sum + (m.unread_count || 0),
          0
        );

        if (unreadTotal > 0) {
          toast.info(
            `You have ${unreadTotal} unread message${
              unreadTotal > 1 ? "s" : ""
            }`,
            {
              action: {
                label: "View",
                onClick: () => navigate("/matches"),
              },
            }
          );

          showBrowserNotification(
            "Unread messages",
            `You have ${unreadTotal} unread message${
              unreadTotal > 1 ? "s" : ""
            } waiting`
          );

          setHasShownUnreadSummary(true);
        }
      })
      .catch(() => {
        // Ignore errors from unread summary fetch
      });

    return () => {
      cancelled = true;
    };
  }, [hasShownUnreadSummary, navigate]);

  return (
    <CallProvider>
      <div className="min-h-screen bg-gray-50 pb-20">
        <MatchCelebration
          match={activeMatchCelebration}
          profile={activeMatchProfile}
          onClose={() => {
            setActiveMatchCelebration(null);
            setActiveMatchProfile(null);
          }}
          onChat={() => {
            if (activeMatchCelebration?.match_id) {
              navigate(`/chat/${activeMatchCelebration.match_id}`);
            } else {
              navigate("/matches");
            }
            setActiveMatchCelebration(null);
            setActiveMatchProfile(null);
          }}
        />
        <Outlet />
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
          <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
                    isActive ? "text-rose-500" : "text-gray-400 hover:text-gray-600"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </CallProvider>
  );
}