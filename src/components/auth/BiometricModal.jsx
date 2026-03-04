import { useState } from "react";
import { Fingerprint, Shield, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { toast } from "sonner";

export default function BiometricModal({ isOpen, onClose, email, userId, onSuccess }) {
  const { 
    isSupported, 
    isRegistering, 
    isAuthenticating,
    registerBiometric,
    authenticateWithBiometric 
  } = useBiometricAuth();
  
  const [mode, setMode] = useState("register"); // 'register' | 'authenticate'
  const [step, setStep] = useState("init"); // 'init' | 'scanning' | 'success' | 'error'

  const handleRegister = async () => {
    setStep("scanning");
    
    // Validate userId before attempting registration
    if (!userId) {
      console.error('Biometric registration attempted without userId');
      toast.error("Please login first to enable fingerprint");
      setStep("error");
      return;
    }
    
    const result = await registerBiometric(email, userId);
    
    if (result) {
      setStep("success");
      setTimeout(() => {
        onSuccess?.(result);
        handleClose();
      }, 1500);
    } else {
      setStep("error");
    }
  };

  const handleAuthenticate = async () => {
    setStep("scanning");
    const result = await authenticateWithBiometric();
    
    if (result) {
      setStep("success");
      setTimeout(() => {
        onSuccess?.(result);
        handleClose();
      }, 1500);
    } else {
      setStep("error");
    }
  };

  const handleClose = () => {
    setStep("init");
    setMode("register");
    onClose();
  };

  const renderContent = () => {
    if (!isSupported) {
      return (
        <div className="text-center py-8">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Biometric Not Supported
          </h3>
          <p className="text-gray-600">
            Your device doesn't support biometric authentication. Please use email and password.
          </p>
        </div>
      );
    }

    switch (step) {
      case "scanning":
        return (
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {mode === "register" ? "Registering Fingerprint" : "Verifying Fingerprint"}
            </h3>
            <p className="text-gray-600">
              Please place your finger on the sensor...
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Success!
            </h3>
            <p className="text-gray-600">
              {mode === "register" 
                ? "Biometric authentication enabled successfully" 
                : "Authentication successful"}
            </p>
          </div>
        );

      case "error":
        return (
          <div className="text-center py-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Failed
            </h3>
            <p className="text-gray-600">
              {mode === "register" 
                ? "Failed to register biometric. Please try again." 
                : "Authentication failed. Please try again."}
            </p>
          </div>
        );

      default:
        return (
          <>
            <div className="py-6">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-full">
                  <Fingerprint className="w-16 h-16 text-white" />
                </div>
              </div>

              {mode === "register" ? (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                    Enable Fingerprint Login
                  </h3>
                  <p className="text-gray-600 text-center mb-6">
                    Use your fingerprint to quickly sign in next time. Fast, secure, and convenient!
                  </p>
                  
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-green-500 mt-0.5" />
                      <span>Securely stored on your device</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Fingerprint className="w-5 h-5 text-blue-500 mt-0.5" />
                      <span>Quick one-touch login</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5" />
                      <span>Works even with face mask</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                    Sign In with Fingerprint
                  </h3>
                  <p className="text-gray-600 text-center mb-6">
                    Place your finger on the sensor to authenticate
                  </p>
                </>
              )}
            </div>

            <DialogFooter className="gap-2">
              {mode === "register" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isRegistering}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4 mr-2" />
                        Enable Fingerprint
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setMode("register")}
                    disabled={isAuthenticating}
                  >
                    Use Password Instead
                  </Button>
                  <Button
                    onClick={handleAuthenticate}
                    disabled={isAuthenticating}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4 mr-2" />
                        Use Fingerprint
                      </>
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {mode === "register" ? "Biometric Setup" : "Biometric Login"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === "register" 
              ? "Set up fingerprint authentication for faster login" 
              : "Quick and secure access with your fingerprint"}
          </DialogDescription>
        </DialogHeader>
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
