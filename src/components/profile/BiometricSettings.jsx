import { useState, useEffect } from "react";
import { Fingerprint, Shield, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useAuth } from "@/lib/AuthContext";
import BiometricModal from "@/components/auth/BiometricModal";
import { toast } from "sonner";

export default function BiometricSettings() {
  const { user } = useAuth();
  const { hasRegisteredBiometric, checkBiometricSupport } = useBiometricAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Check device support
      const supportCheck = await checkBiometricSupport();
      setIsSupported(supportCheck.supported);

      // Check if user has registered biometric
      if (user?.email) {
        const hasBio = await hasRegisteredBiometric(user.email);
        setHasBiometric(hasBio);
      }

      setLoading(false);
    };

    init();
  }, [user?.email, checkBiometricSupport, hasRegisteredBiometric]);

  const handleSetupComplete = () => {
    setHasBiometric(true);
    toast.success("Fingerprint authentication enabled!");
  };

  const handleRemoveBiometric = () => {
    // In a real implementation, this would call an API to remove the credential
    setHasBiometric(false);
    toast.success("Fingerprint authentication removed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Biometric Authentication
            </h3>
            <p className="text-sm text-gray-600">
              Your device doesn't support fingerprint authentication. This feature requires a device with biometric sensors.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
              <Fingerprint className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {hasBiometric ? "Fingerprint Enabled ✓" : "Enable Fingerprint Login"}
              </h3>
              
              {hasBiometric ? (
                <p className="text-sm text-gray-600 mb-3">
                  You can now sign in quickly and securely using your fingerprint.
                </p>
              ) : (
                <p className="text-sm text-gray-600 mb-3">
                  Use your fingerprint for fast, secure login. No need to remember passwords!
                </p>
              )}

              {!hasBiometric ? (
                <Button
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90"
                  size="sm"
                >
                  <Fingerprint className="w-4 h-4 mr-2" />
                  Enable Fingerprint
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Active</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {hasBiometric && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Security Benefits</h4>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Your fingerprint never leaves your device</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>More secure than passwords</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Quick one-touch authentication</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Biometric Setup Modal */}
      <BiometricModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        email={user?.email}
        userId={user?.id}
        onSuccess={handleSetupComplete}
      />
    </>
  );
}
