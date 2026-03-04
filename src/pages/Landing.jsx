import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Loader2, AlertCircle, CheckCircle2, Fingerprint } from "lucide-react";
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
  const navigate = useNavigate();
  const { hasRegisteredBiometric, authenticateWithBiometric } = useBiometricAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);

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

  if (user) {
    navigate("/discover", { replace: true });
    return null;
  }

  // Clear errors when switching modes
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setErrors({});
    setPassword("");
    setConfirmPassword("");
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
    try {
      if (mode === "login") {
        const data = await login(email, password);
        toast.success("Welcome back!");
        navigate("/discover");
        // Biometric modal will auto-open via useEffect if needed
      } else {
        await signup(email, password);
        toast.success("Account created successfully!");
        navigate("/setup");
        // Don't auto-show biometric modal here - let user complete profile first
        // They can enable fingerprint later from Security Settings
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Something went wrong";
      toast.error(errorMessage);
    }
    setLoading(false);
  }

  async function handleBiometricSuccess(result) {
    if (result.token) {
      localStorage.setItem("aura_token", result.token);
      localStorage.setItem("aura_email", result.email);
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
        <h1 className="text-4xl font-black text-white mb-2">AURA</h1>
        <p className="text-rose-100 text-sm">Find your perfect match</p>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-3">
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
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              className={`rounded-xl ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              required
              minLength={mode === "login" ? 1 : 8}
            />
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
            <div>
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                }}
                className={`rounded-xl ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                required
              />
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
              onClick={() => setShowBiometricModal(true)}
              disabled={loading}
              variant="outline"
              className="w-full rounded-2xl h-11 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
            >
              <Fingerprint className="w-4 h-4 mr-2 text-blue-600" />
              {hasBiometric ? "Use Fingerprint" : "Setup Fingerprint"}
            </Button>

            {/* Login/Signup Toggle Under Biometric */}
            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                onClick={() => handleModeChange("login")}
                variant={mode === "login" ? "default" : "outline"}
                className={`flex-1 rounded-xl ${
                  mode === "login"
                    ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white"
                    : "border-2 border-gray-200 hover:border-rose-300"
                }`}
              >
                Log In
              </Button>
              <Button
                type="button"
                onClick={() => handleModeChange("signup")}
                variant={mode === "signup" ? "default" : "outline"}
                className={`flex-1 rounded-xl ${
                  mode === "signup"
                    ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white"
                    : "border-2 border-gray-200 hover:border-rose-300"
                }`}
              >
                Sign Up
              </Button>
            </div>
          </>
        </form>
      </div>

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








