import express from "express";
import { 
  updateLocation, 
  findNearbyUsers, 
  getUsersInDistanceRange,
  getFrequentLocations,
  getLocationCompatibility 
} from "../utils/locationService.js";
import UserProfile from "../models/UserProfile.js";

const router = express.Router();

/**
 * POST /api/location/update
 * Update user's current location
 */
router.post("/update", async (req, res) => {
  try {
    const { email, latitude, longitude, accuracy, city, country } = req.body;

    if (!email || !latitude || !longitude) {
      return res.status(400).json({ 
        error: "Email, latitude, and longitude are required" 
      });
    }

    const result = await updateLocation(email, {
      latitude,
      longitude,
      accuracy,
      city,
      country,
    });

    res.json(result);
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ 
      error: error.message || "Failed to update location" 
    });
  }
});

/**
 * GET /api/location/nearby
 * Get nearby users within radius
 */
router.get("/nearby", async (req, res) => {
  try {
    const { email, radius = 50, age_min, age_max, interests, dating_intent } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const filters = {};
    if (age_min) filters.age_min = parseInt(age_min);
    if (age_max) filters.age_max = parseInt(age_max);
    if (interests) filters.interests = interests.split(",");
    if (dating_intent) filters.dating_intent = dating_intent;

    const nearbyUsers = await findNearbyUsers(email, parseFloat(radius), filters);

    res.json({
      success: true,
      count: nearbyUsers.length,
      users: nearbyUsers.map(item => ({
        ...item.profile,
        distance_km: item.distance_km,
        location_compatibility: getLocationCompatibility(
          { location_coordinates: item.profile.location_coordinates },
          { location_coordinates: { 
            latitude: parseFloat(req.query.current_lat) || item.profile.location_coordinates.latitude,
            longitude: parseFloat(req.query.current_lng) || item.profile.location_coordinates.longitude,
          }}
        ),
      })),
    });
  } catch (error) {
    console.error("Error finding nearby users:", error);
    res.status(500).json({ 
      error: error.message || "Failed to find nearby users" 
    });
  }
});

/**
 * GET /api/location/distance-range
 * Get users within a specific distance range
 */
router.get("/distance-range", async (req, res) => {
  try {
    const { email, min_distance, max_distance } = req.query;

    if (!email || !min_distance || !max_distance) {
      return res.status(400).json({ 
        error: "Email, min_distance, and max_distance are required" 
      });
    }

    const users = await getUsersInDistanceRange(
      email, 
      parseFloat(min_distance), 
      parseFloat(max_distance)
    );

    res.json({
      success: true,
      count: users.length,
      users: users.map(item => ({
        ...item.profile,
        distance_km: item.distance_km,
      })),
    });
  } catch (error) {
    console.error("Error filtering by distance:", error);
    res.status(500).json({ 
      error: error.message || "Failed to filter by distance" 
    });
  }
});

/**
 * GET /api/location/frequent
 * Get user's frequent locations
 */
router.get("/frequent", async (req, res) => {
  try {
    const { email, days = 30 } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const frequentLocations = await getFrequentLocations(email, parseInt(days));

    res.json({
      success: true,
      count: frequentLocations.length,
      locations: frequentLocations,
    });
  } catch (error) {
    console.error("Error getting frequent locations:", error);
    res.status(500).json({ 
      error: error.message || "Failed to get frequent locations" 
    });
  }
});

/**
 * GET /api/location/compatibility
 * Calculate location compatibility between two users
 */
router.get("/compatibility", async (req, res) => {
  try {
    const { email1, email2 } = req.query;

    if (!email1 || !email2) {
      return res.status(400).json({ 
        error: "Both email1 and email2 are required" 
      });
    }

    const profile1 = await UserProfile.findOne({ user_email: email1 });
    const profile2 = await UserProfile.findOne({ user_email: email2 });

    if (!profile1 || !profile2) {
      return res.status(404).json({ error: "One or both profiles not found" });
    }

    const compatibility = getLocationCompatibility(profile1, profile2);
    
    // Calculate actual distance if both have coordinates
    let distance = null;
    if (profile1.location_coordinates && profile2.location_coordinates) {
      const { calculateDistance } = await import("../utils/locationService.js");
      distance = calculateDistance(
        profile1.location_coordinates.latitude,
        profile1.location_coordinates.longitude,
        profile2.location_coordinates.latitude,
        profile2.location_coordinates.longitude
      );
    }

    res.json({
      success: true,
      location_compatibility_score: compatibility,
      distance_km: distance ? Math.round(distance * 10) / 10 : null,
      interpretation: interpretCompatibility(compatibility),
    });
  } catch (error) {
    console.error("Error calculating compatibility:", error);
    res.status(500).json({ 
      error: error.message || "Failed to calculate compatibility" 
    });
  }
});

function interpretCompatibility(score) {
  if (score >= 90) return "Excellent - Very close proximity";
  if (score >= 80) return "Great - Close distance";
  if (score >= 70) return "Good - Moderate distance";
  if (score >= 60) return "Fair - Manageable distance";
  if (score >= 40) return "Challenging - Long distance";
  return "Difficult - Very long distance";
}

export default router;
