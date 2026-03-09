import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2, AlertCircle } from "lucide-react";

import { adminService } from "@/api/entities";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in as admin, redirect
  if (user && ["super_admin", "admin", "moderator", "support"].includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await adminService.login({ email, password });
      
      // Update local storage and context using correct key
      localStorage.setItem("aura_token", data.token);
      localStorage.setItem("aura_email", data.email);
      window.location.href = "/admin"; // Force reload to refresh context
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-gray-200 shadow-xl rounded-3xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-rose-500 to-purple-600" />
        <CardHeader className="space-y-1 pt-8 text-center">
          <div className="mx-auto w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-rose-600" />
          </div>
          <CardTitle className="text-2xl font-bold">AURA Admin</CardTitle>
          <CardDescription>
            Sign in to your administrative account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@aura.ai" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="rounded-xl h-12"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-lg shadow-lg shadow-rose-200 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <div className="text-center">
            <Button variant="link" className="text-gray-400 text-xs" onClick={() => navigate("/")}>
              Back to Main Site
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
