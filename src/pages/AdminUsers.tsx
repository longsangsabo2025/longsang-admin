import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/subscription/api";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Search, 
  Filter,
  Crown,
  Ban,
  CheckCircle,
  XCircle,
  TrendingUp
} from "lucide-react";
import { usePersistedState, useScrollRestore } from "@/hooks/usePersistedState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserWithSubscription {
  id: string;
  email: string;
  created_at: string;
  raw_user_meta_data: {
    full_name?: string;
  };
  subscription: {
    plan: {
      display_name: string;
      name: string;
    };
    status: string;
    billing_cycle: string;
  };
  usage: {
    api_calls_count: number;
    workflows_executed: number;
    agents_created: number;
  };
}

export default function AdminUsers() {
  // Restore scroll & persist search/filter states
  useScrollRestore('admin-users');
  const [searchQuery, setSearchQuery] = usePersistedState('admin-users-search', '');
  const [statusFilter, setStatusFilter] = usePersistedState('admin-users-status', 'all');
  const [planFilter, setPlanFilter] = usePersistedState('admin-users-plan', 'all');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Get all users with their subscriptions
      const { data: authUsers, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) throw userError;

      // Get subscriptions and usage for each user
      const usersWithData = await Promise.all(
        authUsers.users.map(async (user) => {
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select(`
              *,
              plan:subscription_plans(display_name, name)
            `)
            .eq('user_id', user.id)
            .single();

          const { data: usage } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...user,
            subscription,
            usage: usage || { api_calls_count: 0, workflows_executed: 0, agents_created: 0 }
          };
        })
      );

      return usersWithData as UserWithSubscription[];
    }
  });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.raw_user_meta_data?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.subscription?.status === statusFilter;
    const matchesPlan = planFilter === 'all' || user.subscription?.plan?.name === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const stats = {
    total: users?.length || 0,
    active: users?.filter(u => u.subscription?.status === 'active').length || 0,
    free: users?.filter(u => u.subscription?.plan?.name === 'free').length || 0,
    pro: users?.filter(u => u.subscription?.plan?.name === 'pro').length || 0,
    enterprise: users?.filter(u => u.subscription?.plan?.name === 'enterprise').length || 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Free Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.free}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Crown className="h-4 w-4 text-blue-500" />
              Pro Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pro}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Enterprise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.enterprise}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Management
          </CardTitle>
          <CardDescription>View and manage all registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <Crown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">API Calls</TableHead>
                  <TableHead className="text-right">Workflows</TableHead>
                  <TableHead className="text-right">Agents</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.raw_user_meta_data?.full_name || 'No name'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        user.subscription?.plan?.name === 'enterprise' ? 'default' :
                        user.subscription?.plan?.name === 'pro' ? 'secondary' : 'outline'
                      }>
                        {user.subscription?.plan?.display_name || 'Free'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.subscription?.status === 'active' ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <XCircle className="h-3 w-3 mr-1" />
                          {user.subscription?.status || 'N/A'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {user.usage?.api_calls_count?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {user.usage?.workflows_executed || 0}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {user.usage?.agents_created || 0}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button variant="destructive" size="sm">
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No users found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
