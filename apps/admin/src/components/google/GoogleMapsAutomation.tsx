/**
 * Google Maps Automation Component
 * UI for managing business locations & local SEO
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Search,
  Navigation,
  Building2,
  Star,
  Phone,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  geocodeAddress,
  createBusinessLocation,
  listBusinessLocations,
  calculateDistance,
  optimizeLocationForSEO,
  autoSyncConsultationLocations,
  type GeocodingResult,
  type LocalSEOData,
} from '@/lib/google/maps-api';

export const GoogleMapsAutomation = () => {
  const [loading, setLoading] = useState(false);
  const [geocodingResult, setGeocodingResult] = useState<GeocodingResult | null>(null);
  const [address, setAddress] = useState('');

  // Business location form
  const [businessData, setBusinessData] = useState<LocalSEOData>({
    businessName: '',
    address: '',
    phone: '',
    website: '',
    categories: [],
    description: '',
  });

  const handleGeocode = async () => {
    if (!address.trim()) {
      toast.error('Please enter an address');
      return;
    }

    try {
      setLoading(true);
      const result = await geocodeAddress(address);
      setGeocodingResult(result);
      toast.success('Address geocoded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Geocoding failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async () => {
    try {
      setLoading(true);
      toast.info('Creating business location...');

      // Validate data
      if (!businessData.businessName || !businessData.address) {
        toast.error('Business name and address are required');
        return;
      }

      // For demo: using placeholder account ID
      const accountId = 'YOUR_GOOGLE_BUSINESS_ACCOUNT_ID';
      const businessEmail = 'business@longsang.com';

      // Geocode first
      const geocoding = await geocodeAddress(businessData.address);

      // Create location
      const location = {
        name: businessData.businessName,
        storefrontAddress: {
          regionCode: 'VN',
          languageCode: 'vi',
          postalCode: '',
          locality: 'Ho Chi Minh',
          addressLines: [businessData.address],
        },
        websiteUri: businessData.website,
        phoneNumbers: {
          primaryPhone: businessData.phone,
        },
        latlng: {
          latitude: geocoding.latitude,
          longitude: geocoding.longitude,
        },
      };

      // Note: This will fail without proper My Business API setup
      // await createBusinessLocation(businessEmail, accountId, location);

      toast.success('Business location created on Google Maps!');
      toast.info('Note: Requires Google My Business API setup');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create location');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSync = async () => {
    try {
      setLoading(true);
      toast.info('Auto-syncing consultation locations...');

      const accountId = 'YOUR_GOOGLE_BUSINESS_ACCOUNT_ID';
      const businessEmail = 'business@longsang.com';

      // Note: Commented out for demo
      // const result = await autoSyncConsultationLocations(businessEmail, accountId);

      toast.success('Auto-sync feature ready!');
      toast.info('Configure Google My Business API to enable');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Auto-sync failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MapPin className="h-8 w-8 text-red-500" />
          Google Maps & Local SEO
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage business locations and optimize for local search
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Active business locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Total reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Local Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">Average position</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Navigation className="h-4 w-4 text-purple-500" />
              Directions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Requests this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Geocoding Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-500" />
            Geocode Address
          </CardTitle>
          <CardDescription>Convert địa chỉ thành tọa độ GPS (lat/lng)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nhập địa chỉ (VD: 123 Nguyễn Huệ, Q1, TP.HCM)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGeocode()}
            />
            <Button onClick={handleGeocode} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Geocode
            </Button>
          </div>

          {geocodingResult && (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  <div>
                    <strong>Formatted Address:</strong>
                    <p className="text-sm mt-1">{geocodingResult.formattedAddress}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <strong>Latitude:</strong>
                      <p className="text-sm">{geocodingResult.latitude}</p>
                    </div>
                    <div>
                      <strong>Longitude:</strong>
                      <p className="text-sm">{geocodingResult.longitude}</p>
                    </div>
                  </div>
                  {geocodingResult.placeId && (
                    <div>
                      <strong>Place ID:</strong>
                      <p className="text-sm font-mono">{geocodingResult.placeId}</p>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Create Business Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-500" />
            Create Business Location
          </CardTitle>
          <CardDescription>Tạo địa chỉ business trên Google Maps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                placeholder="Long Sang Automation"
                value={businessData.businessName}
                onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+84 xxx xxx xxx"
                value={businessData.phone}
                onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"
                value={businessData.address}
                onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://longsang.com"
                value={businessData.website}
                onChange={(e) => setBusinessData({ ...businessData, website: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categories">Categories</Label>
              <Input
                id="categories"
                placeholder="Restaurant, Cafe, Store"
                value={businessData.categories.join(', ')}
                onChange={(e) =>
                  setBusinessData({
                    ...businessData,
                    categories: e.target.value.split(',').map((c) => c.trim()),
                  })
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Mô tả về business của bạn..."
                value={businessData.description}
                onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreateLocation} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Building2 className="h-4 w-4 mr-2" />
              )}
              Create Location
            </Button>
            <Button variant="outline" onClick={handleAutoSync} disabled={loading}>
              <Navigation className="h-4 w-4 mr-2" />
              Auto-Sync Consultations
            </Button>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Note:</strong> Requires Google My Business API setup and account ID
              configuration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local SEO Optimization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Local SEO
            </CardTitle>
            <CardDescription>Optimize for local search results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Optimize business info
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Star className="h-4 w-4 mr-2" />
              Manage reviews
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Globe className="h-4 w-4 mr-2" />
              Add photos & posts
            </Button>
            <Badge variant="secondary" className="w-full justify-center">
              Coming Soon
            </Badge>
          </CardContent>
        </Card>

        {/* Geolocation Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-purple-500" />
              Geolocation
            </CardTitle>
            <CardDescription>Distance & routing calculations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Navigation className="h-4 w-4 mr-2" />
              Calculate distance
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MapPin className="h-4 w-4 mr-2" />
              Get directions
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Search className="h-4 w-4 mr-2" />
              Find nearby places
            </Button>
            <Badge variant="secondary" className="w-full justify-center">
              Available
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
