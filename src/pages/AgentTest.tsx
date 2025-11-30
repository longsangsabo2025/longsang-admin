import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AgentExecutor from "@/components/agent-center/AgentExecutor";
import { getAllAgentsWithStats } from "@/lib/services/agentExecutionService";
import { ArrowLeft, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
}

export default function AgentTest() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await getAllAgentsWithStats();
      setAgents(data);
      if (data.length > 0) {
        setSelectedAgentId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/agent-center')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            🧪 Test AI Agents
          </CardTitle>
          <CardDescription>
            Test your AI agents with real tasks using GPT-4o mini (ultra cheap & fast!)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Agent Selector */}
          {agents.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">No Agents Found</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create some agents first in the Agent Center
              </p>
              <Button onClick={() => navigate('/agent-center')}>
                Go to Agent Center
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-sm font-medium">Select Agent to Test:</div>
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        🤖 {agent.name} - {agent.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Agent Info */}
              {selectedAgent && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Role:</span>
                        <p className="font-medium">{selectedAgent.role}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <p className="font-medium">{selectedAgent.agent_type || selectedAgent.type}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Executions:</span>
                        <p className="font-medium">{selectedAgent.total_executions}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Cost:</span>
                        <p className="font-medium">${selectedAgent.total_cost_usd?.toFixed(4) || '0.0000'}</p>
                      </div>
                    </div>
                    {selectedAgent.description && (
                      <div className="mt-4">
                        <span className="text-muted-foreground text-sm">Description:</span>
                        <p className="text-sm mt-1">{selectedAgent.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Agent Executor */}
              {selectedAgent && (
                <AgentExecutor 
                  agentId={selectedAgent.id} 
                  agentName={selectedAgent.name}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• GPT-4o mini is ~60% cheaper than GPT-3.5 Turbo while being smarter!</p>
          <p>• Average cost per task: $0.0005 - $0.002 (less than a penny)</p>
          <p>• You can run 500-2000 tasks for just $1</p>
          <p>• Fast response times (usually 1-3 seconds)</p>
          <p>• All executions are tracked in the database</p>
        </CardContent>
      </Card>
    </div>
  );
}
