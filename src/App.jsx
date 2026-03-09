import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Layout from "./Layout";
import Landing from "@/pages/Landing";
import ProfileSetup from "@/pages/ProfileSetup";
import Discover from "@/pages/Discover";
import Matches from "@/pages/Matches";
import Chat from "@/pages/Chat";
import Groups from "@/pages/Groups";
import MyProfile from "@/pages/MyProfile";
import Verification from "@/pages/Verification";
import SilverPremium from "@/pages/SilverPremium";
import Premium from "@/pages/Premium";
import PrivacySettings from "@/pages/PrivacySettings";
import BlindDatePage from "@/pages/BlindDate";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminLogin from "@/pages/AdminLogin";
import PageNotFound from "@/lib/PageNotFound";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }
  if (!user || !["super_admin", "admin", "moderator", "support"].includes(user.role)) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/setup"
        element={
          <ProtectedRoute>
            <ProfileSetup />
          </ProtectedRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/discover" element={<Discover />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/chat/:matchId?" element={<Chat />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/profile" element={<MyProfile />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/premium" element={<Premium />} />
        <Route path="/privacy" element={<PrivacySettings />} />
        <Route path="/silver" element={<SilverPremium />} />
        <Route path="/blind-date" element={<BlindDatePage />} />
      </Route>
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}