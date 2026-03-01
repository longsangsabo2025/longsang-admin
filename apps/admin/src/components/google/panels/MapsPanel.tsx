/**
 * Maps Panel - Location & Geocoding Component
 * Geocode addresses and manage business locations
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Search,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Navigation,
  Building2,
} from 'lucide-react';
import {
  geocodeAddress,
  getLocationStats,
  listLocations,
  GeocodingResult,
} from '@/lib/google/maps-api';
import { toast } from 'sonner';

interface LocationStats {
  total: number;
  verified: number;
  needsUpdate: number;
  locations: Array<{
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    verified: boolean;
  }>;
}

export const MapsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [stats, setStats] = useState<LocationStats | null>(null);
  const [locations, setLocations] = useState<
    Array<{
      id: string;
      name: string;
      address: string;
      lat?: number;
      lng?: number;
    }>
  >([]);

  const [address, setAddress] = useState('');
  const [geocodeResult, setGeocodeResult] = useState<GeocodingResult | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, locationsData] = await Promise.all([
        getLocationStats().catch(() => null),
        listLocations().catch(() => []),
      ]);
      setStats(statsData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading maps data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeocode = async () => {
    if (!address) {
      toast.error('Please enter an address');
      return;
    }

    try {
      setGeocoding(true);
      const result = await geocodeAddress(address);
      setGeocodeResult(result);
      toast.success('Address geocoded successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to geocode address');
      setGeocodeResult(null);
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || locations.length || 0}</div>
            <p className="text-xs text-muted-foreground">Business locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.verified || 0}</div>
            <p className="text-xs text-muted-foreground">Google verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Needs Update</CardTitle>
            <Building2 className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.needsUpdate || 0}</div>
            <p className="text-xs text-muted-foreground">Pending verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Geocode Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Geocode Address
          </CardTitle>
          <CardDescription>Convert address to coordinates (latitude/longitude)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter address (e.g., 123 Main St, Vung Tau)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGeocode()}
              />
            </div>
            <Button onClick={handleGeocode} disabled={geocoding}>
              {geocoding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {geocodeResult && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="font-medium">Result</span>
              </div>
              <div className="grid gap-2 text-sm">
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p>{geocodeResult.formattedAddress}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-muted-foreground">Latitude</Label>
                    <p className="font-mono">{geocodeResult.latitude}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Longitude</Label>
                    <p className="font-mono">{geocodeResult.longitude}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Place ID</Label>
                  <p className="font-mono text-xs truncate">{geocodeResult.placeId}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps?q=${geocodeResult.latitude},${geocodeResult.longitude}`,
                    '_blank'
                  );
                }}
              >
                <MapPin className="h-3 w-3 mr-1" />
                Open in Google Maps
              </Button>
            </div>
          )}

          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </CardContent>
      </Card>

      {/* Locations List */}
      {locations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Business Locations</CardTitle>
            <CardDescription>Saved locations from database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium">{location.name}</div>
                    <div className="text-xs text-muted-foreground">{location.address}</div>
                    {location.lat && location.lng && (
                      <div className="text-xs text-muted-foreground font-mono">
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (location.lat && location.lng) {
                        window.open(
                          `https://www.google.com/maps?q=${location.lat},${location.lng}`,
                          '_blank'
                        );
                      }
                    }}
                    disabled={!location.lat || !location.lng}
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
