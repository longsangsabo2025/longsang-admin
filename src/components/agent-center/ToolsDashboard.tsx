import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Search, Plus, TrendingUp, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { agentCenterApi } from "@/services/agent-center.service";
import { AITool, ToolCategory } from "@/types/agent-center.types";

const ToolsDashboard = () => {
  const [tools, setTools] = useState<AITool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | "all">("all");
  const { toast } = useToast();

  const fetchTools = useCallback(async () => {
    try {
      setLoading(true);
      const data = await agentCenterApi.tools.list();
      setTools(data);
    } catch (error) {
      console.error("Error fetching tools:", error);
      toast({
        title: "Error",
        description: "Failed to load tools",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const categories = ["all", ...new Set(tools.map(t => t.category))];

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const calculateStats = () => {
    const totalCalls = tools.reduce((sum, t) => sum + t.total_calls, 0);
    const totalCost = tools.reduce((sum, t) => sum + (t.cost_per_use * t.total_calls), 0);
    const avgSuccessRate = tools.length > 0
      ? tools.reduce((sum, t) => {
          const rate = t.total_calls > 0 ? (t.successful_calls / t.total_calls) * 100 : 0;
          return sum + rate;
        }, 0) / tools.length
      : 0;

    return { totalCalls, totalCost, avgSuccessRate };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border-blue-700 shadow-lg shadow-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Tools</CardTitle>
            <Wrench className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{tools.length}</div>
            <p className="text-xs text-slate-400">
              {tools.filter(t => t.is_builtin).length} built-in
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-950 to-green-900 border-green-700 shadow-lg shadow-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Calls</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalCalls.toLocaleString()}</div>
            <p className="text-xs text-slate-400">
              Across all tools
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-950 to-purple-900 border-purple-700 shadow-lg shadow-purple-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.avgSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-400">
              Average
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-950 to-orange-900 border-orange-700 shadow-lg shadow-orange-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-slate-400">
              Lifetime usage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Tools Registry</h2>
          <p className="text-sm text-slate-400">
            Browse and manage available tools
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
            />
          </div>
          <Button className="gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white">
            <Plus className="w-4 h-4" />
            Add Tool
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="w-full justify-start overflow-x-auto bg-slate-900 border-slate-700">
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="capitalize data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">
              {category.replace('_', ' ')}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <Card className="bg-slate-900 border-slate-700 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="w-16 h-16 text-slate-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-slate-200">No tools found</h3>
            <p className="text-sm text-slate-400 mb-4">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => (
            <Card key={tool.id} className="bg-slate-900 border-slate-700 hover:border-orange-500 hover:shadow-xl hover:shadow-orange-500/10 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-600 to-red-700 shadow-lg shadow-orange-500/20">
                      <Wrench className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-100">{tool.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1 text-slate-400">
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                          {tool.category}
                        </Badge>
                        {tool.is_builtin && (
                          <Badge variant="secondary" className="text-xs border-slate-600 text-slate-300">
                            Built-in
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-400 line-clamp-2">
                  {tool.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  {tool.tags.slice(0, 3).map((tag) => (
                    <Badge key={`${tool.id}-${tag}`} variant="outline" className="text-xs border-slate-600 text-slate-300">
                      {tag}
                    </Badge>
                  ))}
                  {tool.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                      +{tool.tags.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700 text-center">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400">Calls</div>
                    <div className="font-semibold text-orange-400">{tool.total_calls}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400">Success</div>
                    <div className="font-semibold text-green-400">
                      {tool.total_calls > 0 
                        ? ((tool.successful_calls / tool.total_calls) * 100).toFixed(0)
                        : 0}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400">Time</div>
                    <div className="font-semibold text-blue-400">
                      {(tool.avg_execution_time_ms / 1000).toFixed(1)}s
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-xs text-slate-500">
                  <span>v{tool.version}</span>
                  <span>{tool.author}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolsDashboard;
