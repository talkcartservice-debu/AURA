import { Outlet, NavLink } from "react-router-dom";
import { Compass, Heart, MessageCircle, Users, User } from "lucide-react";

const NAV_ITEMS = [
  { to: "/discover", icon: Compass, label: "Discover" },
  { to: "/matches", icon: Heart, label: "Matches" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/groups", icon: Users, label: "Groups" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
  );
}