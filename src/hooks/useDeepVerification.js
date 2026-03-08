import { useState, useCallback } from "react";
import apiClient from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";

export function useDeepVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const { toast } = useToast();

  /**
   * Initialize deep verification process
   */
  const initializeVerification = useCallback(async (email, verificationType = "basic") => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post("/deep-verification/deep/init", {
        email,
        verification_type: verificationType,
      });
      
      toast({
        title: "Verification Started",
        description: "Please complete the verification steps",
      });
      
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to initialize verification";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Submit ID document for verification
   */
  const submitIDDocument = useCallback(async (email, documentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post("/deep-verification/deep/id-document", {
        email,
        ...documentData,
      });
      
      toast({
        title: "ID Submitted",
        description: "Your ID document is being verified",
      });
      
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to submit ID document";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Send phone verification code
   */
  const sendPhoneCode = useCallback(async (email, phoneNumber, countryCode) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post("/deep-verification/deep/phone/send-code", {
        email,
        phone_number: phoneNumber,
        country_code: countryCode,
      });
      
      toast({
        title: "Code Sent",
        description: "Enter the verification code sent to your phone",
      });
      
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to send verification code";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Verify phone OTP code
   */
  const verifyPhoneCode = useCallback(async (email, otp) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post("/deep-verification/deep/phone/verify-code", {
        email,
        otp,
      });
      
      toast({
        title: "Phone Verified",
        description: "Your phone number has been verified successfully",
      });
      
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Invalid verification code";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Submit social media accounts
   */
  const submitSocialAccounts = useCallback(async (email, socialAccounts) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post("/deep-verification/deep/social-accounts", {
        email,
        social_accounts: socialAccounts,
      });
      
      toast({
        title: "Social Accounts Submitted",
        description: "Your social media accounts are being verified",
      });
      
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to submit social accounts";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Submit video verification
   */
  const submitVideoVerification = useCallback(async (email, videoUrl, duration, phrase) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post("/deep-verification/deep/video", {
        email,
        video_url: videoUrl,
        duration,
        phrase,
      });
      
      toast({
        title: "Video Submitted",
        description: "Your video verification is being reviewed",
      });
      
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to submit video verification";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Get current verification status
   */
  const getVerificationStatus = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/deep-verification/deep/status?email=${email}`);
      setVerificationStatus(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to get verification status";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Check verification level and badges
   */
  const checkVerificationLevel = useCallback(async (email) => {
    try {
      const status = await getVerificationStatus(email);
      
      return {
        level: status.level || "none",
        badges: status.badges || [],
        isVerified: status.status === "approved",
        expiresAt: status.expires_at,
      };
    } catch (err) {
      console.error("Error checking verification level:", err);
      return { level: "none", badges: [], isVerified: false };
    }
  }, [getVerificationStatus]);

  /**
   * Refresh verification status
   */
  const refreshStatus = useCallback(async (email) => {
    return await getVerificationStatus(email);
  }, [getVerificationStatus]);

  return {
    loading,
    error,
    verificationStatus,
    initializeVerification,
    submitIDDocument,
    sendPhoneCode,
    verifyPhoneCode,
    submitSocialAccounts,
    submitVideoVerification,
    getVerificationStatus,
    checkVerificationLevel,
    refreshStatus,
  };
}
