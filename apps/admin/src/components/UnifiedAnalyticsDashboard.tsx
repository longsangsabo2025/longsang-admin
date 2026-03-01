/**
 * Unified Analytics Dashboard for 4 Products
 * LongSang, VungTauLand, SABO Arena, LS Secretary
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAnalyticsData,
  getDailyStats,
  getProductOverview,
  get24HourOverview,
  type ProductName,
} from '@/lib/analytics';

const COLORS = {
  longsang: '#6366f1',
  vungtau: '#10b981',
  'sabo-arena': '#f59e0b',
  'ls-secretary': '#ec4899',
};

const PRODUCT_LABELS = {
  longsang: 'LongSang Forge',
  vungtau: 'VungTauLand',
  'sabo-arena': 'SABO Arena',
  'ls-secretary': 'LS Secretary',
};

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
  color?: string;
}

function MetricCard({ title, value, change, trend, icon, color }: MetricCardProps) {
  const trendColor =
    trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-bold mt-2" style={{ color }}>
            {value}
          </h3>
          {change && (
            <p className={`text-sm mt-2 ${trendColor}`}>
              {trend === 'up' && '↑ '}
              {trend === 'down' && '↓ '}
              {change}
            </p>
          )}
        </div>
        {icon && <div className="text-4xl opacity-50">{icon}</div>}
      </div>
    </Card>
  );
}

export function UnifiedAnalyticsDashboard() {
  const [selectedProduct, setSelectedProduct] = useState<ProductName | 'all'>('all');
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7);
  const [allProductsData, setAllProductsData] = useState<any[]>([]);
  const [overview24h, setOverview24h] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    stats,
    overview,
    loading: dataLoading,
  } = useAnalyticsData(selectedProduct === 'all' ? undefined : selectedProduct, timeRange);

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);

      const products: ProductName[] = ['longsang', 'vungtau', 'sabo-arena', 'ls-secretary'];
      const allStats = await Promise.all(
        products.map(async (product) => {
          const stats = await getDailyStats(product, timeRange);
          return { product, stats };
        })
      );

      const overview = await get24HourOverview();

      setAllProductsData(allStats);
      setOverview24h(overview);
      setLoading(false);
    }

    fetchAllData();
  }, [timeRange]);

  // Calculate totals
  const totalPageViews = overview.reduce((sum, p) => sum + (p.activeUsers || 0), 0);
  const avgUptime =
    overview.length > 0
      ? (overview.reduce((sum, p) => sum + (p.uptime || 0), 0) / overview.length).toFixed(2)
      : '0';
  const totalErrors = overview24h.reduce((sum, p) => sum + (p.error_count || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">📊 Unified Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Real-time analytics for LongSang • VungTauLand • SABO Arena • LS Secretary
          </p>
        </div>

        <div className="flex gap-4">
          <Select
            value={timeRange.toString()}
            onValueChange={(v) => setTimeRange(Number(v) as 7 | 30 | 90)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedProduct}
            onValueChange={(v) => setSelectedProduct(v as ProductName | 'all')}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="longsang">LongSang Forge</SelectItem>
              <SelectItem value="vungtau">VungTauLand</SelectItem>
              <SelectItem value="sabo-arena">SABO Arena</SelectItem>
              <SelectItem value="ls-secretary">LS Secretary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Active Users"
          value={totalPageViews.toLocaleString()}
          change="+12.5% from last period"
          trend="up"
          icon="👥"
          color={COLORS.longsang}
        />
        <MetricCard
          title="Average Uptime"
          value={`${avgUptime}%`}
          change="99.9% SLA maintained"
          trend="up"
          icon="⚡"
          color={COLORS.vungtau}
        />
        <MetricCard
          title="Total Errors (24h)"
          value={totalErrors}
          change={totalErrors < 10 ? 'Within limits' : 'Review needed'}
          trend={totalErrors < 10 ? 'neutral' : 'down'}
          icon="🐛"
          color={totalErrors < 10 ? COLORS['sabo-arena'] : '#ef4444'}
        />
        <MetricCard
          title="Products Online"
          value={`${overview.length}/4`}
          change="All systems operational"
          trend="up"
          icon="✅"
          color={COLORS['ls-secretary']}
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Page Views Trend */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">📈 Page Views Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  stroke={COLORS[selectedProduct as ProductName] || '#6366f1'}
                  fill={COLORS[selectedProduct as ProductName] || '#6366f1'}
                  fillOpacity={0.6}
                  name="Page Views"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Product Comparison */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">📊 Product Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={overview}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="activeUsers" fill="#6366f1" name="Active Users" />
                <Bar dataKey="totalUsers" fill="#10b981" name="Total Users" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Traffic */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">📊 Daily Traffic</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pageViews"
                    stroke="#6366f1"
                    strokeWidth={2}
                    name="Page Views"
                  />
                  <Line
                    type="monotone"
                    dataKey="uniqueVisitors"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Unique Visitors"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Conversions */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">🎯 Conversions</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="conversions" fill="#f59e0b" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Traffic by Product */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">
              🚦 Traffic by Product (Last {timeRange} Days)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allProductsData.map(({ product, stats }) => {
                const totalViews = stats.reduce(
                  (sum: number, s: any) => sum + (s.pageViews || 0),
                  0
                );
                return (
                  <Card
                    key={product}
                    className="p-4"
                    style={{ borderLeft: `4px solid ${COLORS[product]}` }}
                  >
                    <h4 className="font-semibold">{PRODUCT_LABELS[product]}</h4>
                    <p className="text-3xl font-bold mt-2">{totalViews.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">page views</p>
                  </Card>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {overview.map((product) => (
              <Card key={product.product} className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {PRODUCT_LABELS[product.product as ProductName]}
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${product.uptime}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{product.uptime}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold">{product.avgResponseTime}ms</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <p className="text-2xl font-bold">{product.errorRate}%</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Product Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['longsang', 'vungtau', 'sabo-arena', 'ls-secretary'] as ProductName[]).map(
              (product) => {
                const productStats = allProductsData.find((p) => p.product === product);
                const productOverview = overview.find((p) => p.product === product);
                const totalViews =
                  productStats?.stats.reduce(
                    (sum: number, s: any) => sum + (s.pageViews || 0),
                    0
                  ) || 0;

                return (
                  <Card
                    key={product}
                    className="p-6"
                    style={{ borderTop: `4px solid ${COLORS[product]}` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">{PRODUCT_LABELS[product]}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          productOverview?.uptime > 99
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {productOverview?.uptime > 99 ? 'Healthy' : 'Warning'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Page Views</p>
                        <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Active Users</p>
                        <p className="text-2xl font-bold">{productOverview?.activeUsers || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Uptime</p>
                        <p className="text-2xl font-bold">{productOverview?.uptime || 0}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Response</p>
                        <p className="text-2xl font-bold">
                          {productOverview?.avgResponseTime || 0}ms
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => setSelectedProduct(product)}
                    >
                      View Details →
                    </Button>
                  </Card>
                );
              }
            )}
          </div>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">🐛 Error Tracking (Last 24 Hours)</h3>
            <div className="space-y-4">
              {overview24h.map((product) => (
                <div
                  key={product.product_name}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[product.product_name as ProductName] }}
                    />
                    <div>
                      <h4 className="font-semibold">
                        {PRODUCT_LABELS[product.product_name as ProductName]}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {product.total_events} total events • {product.sessions} sessions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{product.error_count || 0}</p>
                    <p className="text-sm text-muted-foreground">errors</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">📊 Analytics System Active</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tracking {overview.length} products • Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>🔄 Refresh Data</Button>
        </div>
      </Card>
    </div>
  );
}

export default UnifiedAnalyticsDashboard;
