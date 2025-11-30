/**
 * Google Maps API & My Business Integration - Browser Safe Version
 * Calls API server endpoints for Google Maps operations
 */

import { supabase } from '@/integrations/supabase/client';

const API_BASE = 'http://localhost:3001/api/google/maps';

export interface BusinessLocation {
  name: string;
  address: string;
  phone: string;
  website?: string;
  categories: string[];
  description?: string;
  hours?: {
    [day: string]: { open: string; close: string };
  };
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId: string;
}

// ============================================================
// API FUNCTIONS - Call through API server
// ============================================================

/**
 * Geocode address to coordinates
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  const response = await fetch(`${API_BASE}/geocode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to geocode address');
  }
  
  const data = await response.json();
  return {
    latitude: data.lat,
    longitude: data.lng,
    formattedAddress: data.address,
    placeId: data.placeId,
  };
}

/**
 * Create business location
 */
export async function createBusinessLocation(userEmail: string, location: BusinessLocation) {
  const response = await fetch(`${API_BASE}/create-location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail, ...location }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create location');
  }
  
  return response.json();
}

/**
 * Update business location
 */
export async function updateBusinessLocation(userEmail: string, locationId: string, updates: Partial<BusinessLocation>) {
  const response = await fetch(`${API_BASE}/update-location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail, locationId, updates }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update location');
  }
  
  return response.json();
}

/**
 * Calculate distance between two locations
 */
export async function calculateDistance(origin: string, destination: string) {
  const response = await fetch(`${API_BASE}/distance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to calculate distance');
  }
  
  return response.json();
}

/**
 * Get directions
 */
export async function getDirections(origin: string, destination: string, mode: string = 'driving') {
  const response = await fetch(`${API_BASE}/directions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination, mode }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get directions');
  }
  
  return response.json();
}

/**
 * Search nearby places
 */
export async function searchNearbyPlaces(location: string, type: string, radius: number = 5000) {
  const response = await fetch(`${API_BASE}/nearby`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location, type, radius }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to search nearby places');
  }
  
  return response.json();
}

/**
 * Get place details
 */
export async function getPlaceDetails(placeId: string) {
  const response = await fetch(`${API_BASE}/place-details`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ placeId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get place details');
  }
  
  return response.json();
}

/**
 * Get location stats from database
 * This function can run in browser as it only queries Supabase
 */
export async function getLocationStats() {
  const { data: locations, error } = await supabase
    .from('business_locations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return {
    total: locations?.length || 0,
    verified: locations?.filter(l => l.verified).length || 0,
    needsUpdate: locations?.filter(l => !l.verified).length || 0,
    locations: locations || [],
  };
}

/**
 * Get location by ID from database
 * This function can run in browser as it only queries Supabase
 */
export async function getLocation(locationId: string) {
  const { data, error } = await supabase
    .from('business_locations')
    .select('*')
    .eq('id', locationId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * List all locations from database
 * This function can run in browser as it only queries Supabase
 */
export async function listLocations() {
  const { data, error } = await supabase
    .from('business_locations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
