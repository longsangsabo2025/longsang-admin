import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Star,
  Clock,
  Users,
  Zap,
  TrendingUp,
  DollarSign,
  Sparkles,
  LogIn,
  User,
} from 'lucide-react';
import { MVP_AGENTS, MVPAgent } from '@/data/mvp-agents';
import { useToast } from '@/hooks/use-toast';
import { activateAgent } from '@/lib/marketplace/service';
import { LoginModal } from '@/components/auth/LoginModal';
import { supabase } from '@/integrations/supabase/client';

const CATEGORIES = [
  { id: 'all', label: 'All Agents', icon: '🎯' },
  { id: 'sales', label: 'Sales', icon: '💼' },
  { id: 'content', label: 'Content', icon: '✍️' },
  { id: 'marketing', label: 'Marketing', icon: '📱' },
  { id: 'data', label: 'Data', icon: '📊' },
  { id: 'automation', label: 'Automation', icon: '⚙️' },
];

export const MVPMarketplace = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const filteredAgents = MVP_AGENTS.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleActivate = async (agent: MVPAgent) => {
    try {
      console.log('🔍 Activating agent:', agent.id);

      const result = await activateAgent(agent);

      console.log('✅ Activation result:', result);

      toast({
        title: '🎉 Agent Activated!',
        description: `${agent.name} is now active. You have ${agent.pricing.free_trial_runs} free runs to try it out.`,
      });
    } catch (error) {
      console.error('❌ Activation error:', error);

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to activate agent',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (agentId: string) => {
    navigate(`/marketplace/${agentId}`);
  };

  const totalAgents = MVP_AGENTS.length;
  const totalRuns = MVP_AGENTS.reduce((sum, a) => sum + a.metrics.total_runs, 0);
  const totalUsers = MVP_AGENTS.reduce((sum, a) => sum + a.metrics.user_count, 0);
  const avgRating = (MVP_AGENTS.reduce((sum, a) => sum + a.rating.score, 0) / totalAgents).toFixed(
    1
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Auth Button - Top Right */}
        <div className="flex justify-end">
          {user ? (
            <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-lg">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">{user.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  toast({ title: 'Signed out successfully' });
                }}
              >
                Logout
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowLoginModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          )}
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-4 py-2 rounded-full">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-300">AI Automation Marketplace</span>
          </div>

          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Browse & Activate AI Agents
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Pre-built AI agents ready to automate your work. Pay per use, cancel anytime.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Agents</p>
                  <p className="text-3xl font-bold text-white">{totalAgents}</p>
                </div>
                <Zap className="w-10 h-10 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Runs</p>
                  <p className="text-3xl font-bold text-white">{totalRuns.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Active Users</p>
                  <p className="text-3xl font-bold text-white">{totalUsers.toLocaleString()}</p>
                </div>
                <Users className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Avg Rating</p>
                  <p className="text-3xl font-bold text-white">{avgRating}</p>
                </div>
                <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search agents by name, capability, or use case..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 text-lg"
          />
        </div>

        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="data-[state=active]:bg-indigo-600"
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-8">
            {/* Agent Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent) => (
                <Card
                  key={agent.id}
                  className="bg-slate-900/50 border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group"
                  onClick={() => handleViewDetails(agent.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-5xl">{agent.icon}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-white font-medium">{agent.rating.score}</span>
                        <span className="text-slate-400">({agent.rating.count})</span>
                      </div>
                    </div>

                    <CardTitle className="text-xl text-white group-hover:text-indigo-400 transition-colors">
                      {agent.name}
                    </CardTitle>

                    <CardDescription className="text-slate-400 line-clamp-2">
                      {agent.tagline}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                      <DollarSign className="w-5 h-5 text-indigo-400" />
                      <span className="text-2xl font-bold text-white">${agent.pricing.price}</span>
                      <span className="text-sm text-slate-400">{agent.pricing.unit}</span>
                    </div>

                    {/* Free Trial Badge */}
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                      🎁 {agent.pricing.free_trial_runs} free runs
                    </Badge>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>{agent.metrics.avg_execution_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Users className="w-4 h-4" />
                        <span>{agent.metrics.user_count.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Use Cases Preview */}
                    <div className="flex flex-wrap gap-1">
                      {agent.use_cases.slice(0, 2).map((useCase) => (
                        <Badge
                          key={useCase}
                          variant="outline"
                          className="text-xs border-slate-700 text-slate-400"
                        >
                          {useCase}
                        </Badge>
                      ))}
                      {agent.use_cases.length > 2 && (
                        <Badge
                          variant="outline"
                          className="text-xs border-slate-700 text-slate-400"
                        >
                          +{agent.use_cases.length - 2} more
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivate(agent);
                        }}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Activate
                      </Button>
                      <Button
                        variant="outline"
                        className="border-slate-700 hover:bg-slate-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(agent.id);
                        }}
                      >
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredAgents.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-white mb-2">No agents found</h3>
                <p className="text-slate-400">Try adjusting your search or browse all categories</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-500/30">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Can't find what you need?</h2>
            <p className="text-slate-300 mb-6">
              Request a custom agent or build your own with our Agent Builder
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" variant="outline" className="border-slate-700">
                Request Custom Agent
              </Button>
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                Build Your Own
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSuccess={() => {
          toast({ title: 'Login successful!', description: 'You can now activate agents' });
        }}
      />
    </div>
  );
};
