import { useState, useCallback } from "react";
import { toast } from "sonner";

// Convert ArrayBuffer to Base64
const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Convert Base64 to ArrayBuffer
const base64ToBuffer = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState(window.PublicKeyCredential ? true : false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check if device supports biometrics
  const checkBiometricSupport = useCallback(async () => {
    if (!window.PublicKeyCredential) {
      return { supported: false, reason: "WebAuthn not supported" };
    }

    try {
      // Check if platform supports authenticator
      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return {
        supported: isAvailable,
        reason: isAvailable ? "Available" : "Not available on this device"
      };
    } catch (error) {
      console.error("Biometric support check failed:", error);
      return { supported: false, reason: error.message };
    }
  }, []);

  // Register new biometric credential
  const registerBiometric = useCallback(async (email, userId) => {
    if (!isSupported) {
      toast.error("Biometric authentication not supported on this device");
      return null;
    }

    setIsRegistering(true);
    try {
      // Step 1: Get challenge from server
      const response = await fetch("/api/biometric/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, user_id: userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      const options = await response.json();

      // Step 2: Create public key credential
      const publicKey = {
        ...options.publicKey,
        challenge: base64ToBuffer(options.publicKey.challenge),
        user: {
          ...options.publicKey.user,
          id: base64ToBuffer(options.publicKey.user.id),
        },
      };

      // Step 3: Prompt user for biometric authentication
      const credential = await navigator.credentials.create({ publicKey });

      // Step 4: Send credential back to server for verification
      const verificationResponse = await fetch("/api/biometric/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential_id: credential.id,
          raw_id: bufferToBase64(credential.rawId),
          type: credential.type,
          attestation_object: bufferToBase64(credential.response.attestationObject),
          client_data_json: bufferToBase64(credential.response.clientDataJSON),
          email,
        }),
      });

      if (!verificationResponse.ok) {
        const error = await verificationResponse.json();
        throw new Error(error.error || "Verification failed");
      }

      const result = await verificationResponse.json();
      toast.success("Biometric authentication registered successfully!");
      return result;

    } catch (error) {
      console.error("Biometric registration error:", error);
      
      if (error.name === "NotAllowedError") {
        toast.error("Biometric authentication cancelled");
      } else if (error.name === "InvalidStateError") {
        toast.error("Biometric already registered");
      } else {
        toast.error(`Registration failed: ${error.message}`);
      }
      return null;
    } finally {
      setIsRegistering(false);
    }
  }, [isSupported]);

  // Authenticate with biometrics
  const authenticateWithBiometric = useCallback(async () => {
    if (!isSupported) {
      toast.error("Biometric authentication not supported");
      return null;
    }

    setIsAuthenticating(true);
    try {
      // Step 1: Get authentication options from server
      const response = await fetch("/api/biometric/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Authentication failed");
      }

      const options = await response.json();

      // Step 2: Prepare public key for authentication
      const publicKey = {
        ...options.publicKey,
        challenge: base64ToBuffer(options.publicKey.challenge),
        allowCredentials: options.publicKey.allowCredentials.map((cred) => ({
          ...cred,
          id: base64ToBuffer(cred.id),
        })),
      };

      // Step 3: Prompt user for biometric authentication
      const assertion = await navigator.credentials.get({ publicKey });

      // Step 4: Verify authentication with server
      const verificationResponse = await fetch("/api/biometric/verify-authentication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential_id: assertion.id,
          raw_id: bufferToBase64(assertion.rawId),
          type: assertion.type,
          authenticator_data: bufferToBase64(assertion.response.authenticatorData),
          signature: bufferToBase64(assertion.response.signature),
          user_handle: assertion.response.userHandle 
            ? bufferToBase64(assertion.response.userHandle) 
            : null,
          client_data_json: bufferToBase64(assertion.response.clientDataJSON),
        }),
      });

      if (!verificationResponse.ok) {
        const error = await verificationResponse.json();
        throw new Error(error.error || "Authentication verification failed");
      }

      const result = await verificationResponse.json();
      toast.success("Authentication successful!");
      return result;

    } catch (error) {
      console.error("Biometric authentication error:", error);
      
      if (error.name === "NotAllowedError") {
        toast.error("Authentication cancelled or timeout");
      } else if (error.name === "NotFoundError") {
        toast.error("No biometric credentials found");
      } else {
        toast.error(`Authentication failed: ${error.message}`);
      }
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isSupported]);

  // Check if user has registered biometrics
  const hasRegisteredBiometric = useCallback(async (email) => {
    try {
      const response = await fetch(`/api/biometric/check/${encodeURIComponent(email)}`, {
        method: "GET",
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.has_biometric;
    } catch (error) {
      console.error("Check biometric error:", error);
      return false;
    }
  }, []);

  return {
    isSupported,
    isRegistering,
    isAuthenticating,
    checkBiometricSupport,
    registerBiometric,
    authenticateWithBiometric,
    hasRegisteredBiometric,
  };
}
