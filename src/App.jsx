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
import HotLove from "@/pages/HotLove";
import Premium from "@/pages/Premium";
import PrivacySettings from "@/pages/PrivacySettings";
import BlindDatePage from "@/pages/BlindDate";
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
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
        <Route path="/hot-love" element={<HotLove />} />
        <Route path="/blind-date" element={<BlindDatePage />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}