import { useState, useCallback } from "react";
import apiClient from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";

export function useLocationTracking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  /**
   * Get current position from browser geolocation API
   */
  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (err) => {
          reject(new Error(err.message || "Unable to get your location"));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  /**
   * Update user's location on the server
   */
  const updateLocation = useCallback(async (locationData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post("/api/location/update", locationData);
      toast({
        title: "Location Updated",
        description: "Your location has been updated successfully",
      });
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to update location";
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
   * Get nearby users within a radius
   */
  const getNearbyUsers = useCallback(async (email, radius = 50, filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ email, radius: radius.toString(), ...filters });
      const response = await apiClient.get(`/api/location/nearby?${params}`);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to find nearby users";
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
   * Get users within a distance range
   */
  const getUsersInDistanceRange = useCallback(async (email, minDistance, maxDistance) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ 
        email, 
        min_distance: minDistance.toString(),
        max_distance: maxDistance.toString(),
      });
      const response = await apiClient.get(`/api/location/distance-range?${params}`);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to filter by distance";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Get user's frequent locations
   */
  const getFrequentLocations = useCallback(async (email, days = 30) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ email, days: days.toString() });
      const response = await apiClient.get(`/api/location/frequent?${params}`);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to get frequent locations";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Calculate location compatibility between two users
   */
  const getLocationCompatibility = useCallback(async (email1, email2) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ email1, email2 });
      const response = await apiClient.get(`/api/location/compatibility?${params}`);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to calculate compatibility";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Track and update location automatically
   */
  const trackLocation = useCallback(async (userEmail) => {
    try {
      const position = await getCurrentPosition();
      
      // Reverse geocoding would happen here with a service like Google Maps
      // For now, we'll just store coordinates
      await updateLocation({
        email: userEmail,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
      });
      
      return position;
    } catch (err) {
      console.error("Error tracking location:", err);
      throw err;
    }
  }, [getCurrentPosition, updateLocation]);

  return {
    loading,
    error,
    getCurrentPosition,
    updateLocation,
    getNearbyUsers,
    getUsersInDistanceRange,
    getFrequentLocations,
    getLocationCompatibility,
    trackLocation,
  };
}
