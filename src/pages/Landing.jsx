import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { usePWA } from "@/hooks/usePWA";
import { systemService } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Loader2, AlertCircle, CheckCircle2, Fingerprint, Eye, EyeOff, Download } from "lucide-react";
import { toast } from "sonner";
import BiometricModal from "@/components/auth/BiometricModal";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength validation
function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("one number");
  return errors;
}

export default function Landing() {
  const { user, login, signup } = useAuth();
  const { isInstallable, installApp } = usePWA();
  const navigate = useNavigate();
  const { hasRegisteredBiometric, authenticateWithBiometric } = useBiometricAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    systemService.getMaintenanceStatus().then(setIsMaintenance);
  }, []);

  // Check if user has biometric registered when email is entered
  useEffect(() => {
    const checkBiometric = async () => {
      if (email && mode === "login" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const hasBio = await hasRegisteredBiometric(email);
        setHasBiometric(hasBio);
      } else {
        setHasBiometric(false);
      }
    };
    
    const timer = setTimeout(checkBiometric, 500);
    return () => clearTimeout(timer);
  }, [email, mode, hasRegisteredBiometric]);

  // Show biometric modal for registration during login (not signup - handled in profile setup)
  useEffect(() => {
    if (mode === "login" && user) {
      // After login, wait for user context to fully update before checking biometric
      const timer = setTimeout(async () => {
        if (user && user.email) {
          const hasBio = await hasRegisteredBiometric(user.email);
          if (!hasBio && !showBiometricModal) {
            setShowBiometricModal(true);
          }
        }
      }, 1000); // Wait for auth to settle
      return () => clearTimeout(timer);
    }
  }, [mode, user]);

  // If already logged in and on login mode, send to Discover or Admin
  // (New signups stay on signup mode and are sent to /setup instead)
  useEffect(() => {
    if (user && mode === "login") {
      if (["super_admin", "admin", "moderator", "support"].includes(user.role)) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/discover", { replace: true });
      }
    }
  }, [user, mode, navigate]);

  // Clear errors when switching modes
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setErrors({});
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};

    // Email validation
    if (!EMAIL_REGEX.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation for signup
    if (mode === "signup") {
      if (!username.trim()) {
        newErrors.username = "Username is required";
      } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
        newErrors.username = "Username must be 3-20 characters (letters, numbers, underscores)";
      }

      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        newErrors.password = `Password must have ${passwordErrors.join(", ")}`;
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    // If there are validation errors, show them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    try {
      if (mode === "login") {
        const data = await login(trimmedEmail, trimmedPassword);
        toast.success("Welcome back!");
        if (["super_admin", "admin", "moderator", "support"].includes(data.role)) {
          navigate("/admin");
        } else {
          navigate("/discover");
        }
        // Biometric modal will auto-open via useEffect if needed
      } else {
        await signup(trimmedEmail, trimmedPassword, username.trim());
        toast.success("Account created successfully!");
        navigate("/setup");
        // Don't auto-show biometric modal here - let user complete profile first
        // They can enable fingerprint later from Security Settings
      }
    } catch (err) {
      const errorData = err.response?.data?.error || "Something went wrong";
      const errorMessage = typeof errorData === 'object' ? (errorData.message || JSON.stringify(errorData)) : String(errorData);
      toast.error(errorMessage);
    }
    setLoading(false);
  }

  async function handleBiometricSuccess(result) {
    if (result.token) {
      localStorage.setItem("aurasync_token", result.token);
      localStorage.setItem("aurasync_email", result.email);
      toast.success("Welcome back!");
      navigate("/discover");
    }
  }

  async function handleBiometricLogin() {
    try {
      const result = await authenticateWithBiometric();
      if (result) {
        handleBiometricSuccess(result);
      }
    } catch (error) {
      console.error("Biometric login error:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-500 to-purple-600 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-white fill-white" />
        </div>
        <h1 className="text-4xl font-black text-white mb-2">AURAsync</h1>
        <p className="text-rose-100 text-sm">Find your perfect match</p>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative">
        {isMaintenance && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[10px] leading-tight text-amber-900 font-medium">
              <p className="font-bold">Maintenance in Progress</p>
              <p>The platform is undergoing scheduled maintenance. Admin login is still active.</p>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Signup Fields */}
          {mode === "signup" && (
            <>
              {/* Username */}
              <div>
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors({ ...errors, username: null });
                  }}
                  className={`rounded-xl ${errors.username ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  required
                />
                {errors.username && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.username}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Email Field */}
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: null });
              }}
              className={`rounded-xl ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              required
            />
            {errors.email && (
              <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="relative group">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              className={`rounded-xl pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              required
              minLength={mode === "login" ? 1 : 8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {errors.password && (
              <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.password}</span>
              </div>
            )}
            {mode === "signup" && password && !errors.password && (
              <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Password strength: Good</span>
              </div>
            )}
          </div>

          {/* Confirm Password Field (Signup only) */}
          {mode === "signup" && (
            <div className="relative group">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                }}
                className={`rounded-xl pr-10 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {errors.confirmPassword && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
              {confirmPassword && password === confirmPassword && (
                <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Passwords match</span>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full rounded-2xl h-12 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : mode === "login" ? (
              "Log In"
            ) : (
              "Create Account"
            )}
          </Button>

          {/* Biometric Login Section */}
          {/* Biometric Section - Shows for both Login and Signup */}
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Biometric Button */}
            <Button
              type="button"
              onClick={() => {
                if (mode === "login" && hasBiometric) {
                  handleBiometricLogin();
                } else if (!user?.id) {
                  toast.error("Please log in first to enable fingerprint authentication");
                } else {
                  setShowBiometricModal(true);
                }
              }}
              disabled={loading || (mode === "login" && !hasBiometric && !user?.id)}
              variant="outline"
              className={`w-full rounded-2xl h-11 border-2 ${
                mode === "login" && !hasBiometric && !user?.id
                  ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed" 
                  : "border-blue-200 hover:bg-blue-50 hover:border-blue-300"
              }`}
            >
              <Fingerprint className="w-4 h-4 mr-2 text-blue-600" />
              {mode === "login" && hasBiometric 
                ? "Use Fingerprint" 
                : !user?.id 
                  ? "Login Required for Setup" 
                  : "Setup Fingerprint"}
            </Button>

            {/* Login/Signup Toggle */}
            <div className="flex justify-center mt-6">
              <p className="text-sm text-gray-500">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => handleModeChange(mode === "login" ? "signup" : "login")}
                  className="font-bold text-rose-500 hover:text-rose-600 transition-colors"
                >
                  {mode === "login" ? "Sign Up" : "Log In"}
                </button>
              </p>
            </div>
          </>
        </form>
      </div>

      {/* PWA Install Section */}
      {isInstallable && (
        <div className="mt-8 w-full max-w-sm">
          <button
            onClick={installApp}
            className="w-full flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white hover:bg-white/20 transition-all group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Download className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-bold">Install AURAsync</p>
                <p className="text-[10px] text-rose-100">Get the full app experience</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              Install
            </div>
          </button>
        </div>
      )}

      {/* Biometric Modal */}
      <BiometricModal
        isOpen={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        email={email}
        userId={user?.id || null}
        onSuccess={handleBiometricSuccess}
      />
    </div>
  );
}








