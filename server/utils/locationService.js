import UserProfile from "../models/UserProfile.js";

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Update user's location
 * @param {string} email - User's email
 * @param {object} locationData - Location data
 * @returns {Promise<object>} Updated profile
 */
export async function updateLocation(email, locationData) {
  try {
    const profile = await UserProfile.findOne({ user_email: email });
    
    if (!profile) {
      throw new Error("Profile not found");
    }

    const { latitude, longitude, accuracy, city, country } = locationData;

    // Validate coordinates
    if (latitude === undefined || longitude === undefined) {
      throw new Error("Latitude and longitude are required");
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error("Invalid coordinates");
    }

    // Update current location
    profile.location_coordinates = {
      latitude,
      longitude,
      last_updated: new Date(),
      accuracy: accuracy || null,
      city: city || profile.location_coordinates?.city,
      country: country || profile.location_coordinates?.country,
    };

    // Add to location history (keep last 50 locations)
    if (!profile.location_history) {
      profile.location_history = [];
    }
    
    profile.location_history.push({
      latitude,
      longitude,
      timestamp: new Date(),
      accuracy: accuracy || null,
    });

    // Limit history to 50 entries
    if (profile.location_history.length > 50) {
      profile.location_history = profile.location_history.slice(-50);
    }

    await profile.save();
    
    return {
      success: true,
      message: "Location updated successfully",
      coordinates: profile.location_coordinates,
    };
  } catch (error) {
    console.error("Error updating location:", error);
    throw error;
  }
}

/**
 * Find nearby users within a radius
 * @param {string} email - Current user's email
 * @param {number} radiusKm - Search radius in kilometers (default: 50km)
 * @param {object} filters - Additional filters (age, interests, etc.)
 * @returns {Promise<Array>} Array of nearby profiles with distances
 */
export async function findNearbyUsers(email, radiusKm = 50, filters = {}) {
  try {
    const currentUser = await UserProfile.findOne({ user_email: email });
    
    if (!currentUser || !currentUser.location_coordinates) {
      throw new Error("Current location not available");
    }

    const { latitude: userLat, longitude: userLon } = currentUser.location_coordinates;

    // Get all active profiles (excluding current user)
    const query = {
      user_email: { $ne: email },
      profile_complete: true,
      'location_coordinates.latitude': { $exists: true },
      'location_coordinates.longitude': { $exists: true },
    };

    // Apply filters
    if (filters.age_min) {
      query.age = { $gte: filters.age_min };
    }
    if (filters.age_max) {
      query.age = { ...query.age, $lte: filters.age_max };
    }
    if (filters.interests && filters.interests.length > 0) {
      query.interests = { $in: filters.interests };
    }
    if (filters.dating_intent) {
      query.dating_intent = filters.dating_intent;
    }

    const nearbyProfiles = await UserProfile.find(query);

    // Calculate distances and filter by radius
    const profilesWithDistance = nearbyProfiles
      .map(profile => {
        const distance = calculateDistance(
          userLat,
          userLon,
          profile.location_coordinates.latitude,
          profile.location_coordinates.longitude
        );

        return {
          profile: profile.toObject(),
          distance_km: Math.round(distance * 10) / 10, // Round to 1 decimal
          is_within_radius: distance <= radiusKm,
        };
      })
      .filter(item => item.is_within_radius)
      .sort((a, b) => a.distance_km - b.distance_km); // Sort by distance

    return profilesWithDistance;
  } catch (error) {
    console.error("Error finding nearby users:", error);
    throw error;
  }
}

/**
 * Get users within a specific distance range
 * @param {string} email - Current user's email
 * @param {number} minDistanceKm - Minimum distance
 * @param {number} maxDistanceKm - Maximum distance
 * @returns {Promise<Array>} Filtered profiles
 */
export async function getUsersInDistanceRange(email, minDistanceKm, maxDistanceKm) {
  try {
    const currentUser = await UserProfile.findOne({ user_email: email });
    
    if (!currentUser || !currentUser.location_coordinates) {
      throw new Error("Current location not available");
    }

    const { latitude: userLat, longitude: userLon } = currentUser.location_coordinates;

    const profiles = await UserProfile.find({
      user_email: { $ne: email },
      profile_complete: true,
      'location_coordinates.latitude': { $exists: true },
      'location_coordinates.longitude': { $exists: true },
    });

    const profilesWithDistance = profiles
      .map(profile => {
        const distance = calculateDistance(
          userLat,
          userLon,
          profile.location_coordinates.latitude,
          profile.location_coordinates.longitude
        );

        return {
          profile: profile.toObject(),
          distance_km: Math.round(distance * 10) / 10,
        };
      })
      .filter(item => item.distance_km >= minDistanceKm && item.distance_km <= maxDistanceKm)
      .sort((a, b) => a.distance_km - b.distance_km);

    return profilesWithDistance;
  } catch (error) {
    console.error("Error filtering by distance range:", error);
    throw error;
  }
}

/**
 * Get location-based compatibility score
 * @param {object} profile1 - First user's profile
 * @param {object} profile2 - Second user's profile
 * @returns {number} Location compatibility score (0-100)
 */
export function getLocationCompatibility(profile1, profile2) {
  if (!profile1.location_coordinates || !profile2.location_coordinates) {
    return 0;
  }

  const distance = calculateDistance(
    profile1.location_coordinates.latitude,
    profile1.location_coordinates.longitude,
    profile2.location_coordinates.latitude,
    profile2.location_coordinates.longitude
  );

  // Score based on distance (closer = higher score)
  if (distance < 5) return 100;      // Same city area
  if (distance < 10) return 90;      // Very close
  if (distance < 25) return 80;      // Close
  if (distance < 50) return 70;      // Moderate distance
  if (distance < 100) return 60;     // Far but manageable
  if (distance < 200) return 40;     // Long distance
  return 20;                          // Very long distance
}

/**
 * Get user's frequent locations (places they visit often)
 * @param {string} email - User's email
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} Array of frequent locations
 */
export async function getFrequentLocations(email, days = 30) {
  try {
    const profile = await UserProfile.findOne({ user_email: email });
    
    if (!profile || !profile.location_history) {
      return [];
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Filter recent locations
    const recentLocations = profile.location_history.filter(
      loc => new Date(loc.timestamp) >= cutoffDate
    );

    if (recentLocations.length === 0) {
      return [];
    }

    // Group locations by proximity (simple clustering)
    const clusters = [];
    const clusterRadius = 0.5; // 500 meters

    recentLocations.forEach(loc => {
      let addedToCluster = false;
      
      for (const cluster of clusters) {
        const distance = calculateDistance(
          cluster.center.lat,
          cluster.center.lng,
          loc.latitude,
          loc.longitude
        );

        if (distance < clusterRadius) {
          cluster.locations.push(loc);
          cluster.count++;
          // Recalculate center
          cluster.center.lat = cluster.locations.reduce((sum, l) => sum + l.latitude, 0) / cluster.count;
          cluster.center.lng = cluster.locations.reduce((sum, l) => sum + l.longitude, 0) / cluster.count;
          addedToCluster = true;
          break;
        }
      }

      if (!addedToCluster) {
        clusters.push({
          center: { lat: loc.latitude, lng: loc.longitude },
          locations: [loc],
          count: 1,
        });
      }
    });

    // Return clusters sorted by frequency
    return clusters
      .sort((a, b) => b.count - a.count)
      .map(cluster => ({
        latitude: cluster.center.lat,
        longitude: cluster.center.lng,
        visit_count: cluster.count,
        last_visited: cluster.locations[cluster.locations.length - 1].timestamp,
      }));
  } catch (error) {
    console.error("Error getting frequent locations:", error);
    return [];
  }
}
