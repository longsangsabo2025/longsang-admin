/**
 * Google Maps API Routes
 * Server-side endpoints for Google Maps operations
 */

const express = require("express");
const router = express.Router();
const { Client } = require("@googlemaps/google-maps-services-js");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize Google Maps client
const getMapsClient = () => {
  return new Client({});
};

/**
 * POST /api/google/maps/geocode
 * Convert address to coordinates
 */
router.post("/geocode", async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "address is required" });
    }

    const client = getMapsClient();
    const response = await client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== "OK") {
      return res.status(400).json({ error: response.data.status });
    }

    const result = response.data.results[0];
    const geocoded = {
      address: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      placeId: result.place_id,
      types: result.types,
    };

    res.json(geocoded);
  } catch (error) {
    console.error("Error geocoding address:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/maps/create-location
 * Create a business location with geocoding
 */
router.post("/create-location", async (req, res) => {
  try {
    const { name, address, description } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: "name and address are required" });
    }

    // Geocode the address
    const client = getMapsClient();
    const geocodeResponse = await client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    if (geocodeResponse.data.status !== "OK") {
      return res.status(400).json({ error: "Failed to geocode address" });
    }

    const result = geocodeResponse.data.results[0];
    const location = {
      name,
      address: result.formatted_address,
      description: description || "",
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      place_id: result.place_id,
      types: result.types,
    };

    // Save to Supabase
    const { data, error } = await supabase
      .from("business_locations")
      .insert(location)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/maps/update-location
 * Update business location
 */
router.post("/update-location", async (req, res) => {
  try {
    const { locationId, updates } = req.body;

    if (!locationId || !updates) {
      return res.status(400).json({ error: "locationId and updates are required" });
    }

    // If address changed, re-geocode
    if (updates.address) {
      const client = getMapsClient();
      const geocodeResponse = await client.geocode({
        params: {
          address: updates.address,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      });

      if (geocodeResponse.data.status === "OK") {
        const result = geocodeResponse.data.results[0];
        updates.address = result.formatted_address;
        updates.lat = result.geometry.location.lat;
        updates.lng = result.geometry.location.lng;
        updates.place_id = result.place_id;
      }
    }

    // Update in Supabase
    const { data, error } = await supabase
      .from("business_locations")
      .update(updates)
      .eq("id", locationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/maps/optimize-seo
 * Optimize location for local SEO
 */
router.post("/optimize-seo", async (req, res) => {
  try {
    const { locationId } = req.body;

    if (!locationId) {
      return res.status(400).json({ error: "locationId is required" });
    }

    // Get location from Supabase
    const { data: location, error } = await supabase
      .from("business_locations")
      .select("*")
      .eq("id", locationId)
      .single();

    if (error || !location) {
      return res.status(404).json({ error: "Location not found" });
    }

    // Generate SEO optimizations
    const optimizations = {
      meta_title: `${location.name} - ${location.address}`,
      meta_description: `Visit ${location.name} at ${location.address}. ${
        location.description || "Your trusted local business."
      }`,
      structured_data: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: location.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: location.address,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: location.lat,
          longitude: location.lng,
        },
      },
      keywords: [location.name, location.address.split(",")[0], ...location.types],
    };

    // Update location with SEO data
    const { data: updated, error: updateError } = await supabase
      .from("business_locations")
      .update({
        seo_optimizations: optimizations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", locationId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      location: updated,
      optimizations,
    });
  } catch (error) {
    console.error("Error optimizing SEO:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/maps/directions
 * Get directions between two locations
 */
router.post("/directions", async (req, res) => {
  try {
    const { origin, destination, mode = "driving" } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: "origin and destination are required" });
    }

    const client = getMapsClient();
    const response = await client.directions({
      params: {
        origin,
        destination,
        mode,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== "OK") {
      return res.status(400).json({ error: response.data.status });
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    const directions = {
      distance: leg.distance.text,
      duration: leg.duration.text,
      startAddress: leg.start_address,
      endAddress: leg.end_address,
      steps: leg.steps.map((step) => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ""),
        distance: step.distance.text,
        duration: step.duration.text,
      })),
      overview_polyline: route.overview_polyline.points,
    };

    res.json(directions);
  } catch (error) {
    console.error("Error getting directions:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
