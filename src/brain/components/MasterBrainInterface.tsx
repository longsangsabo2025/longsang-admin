/**
 * Master Brain Interface Component
 * Main interface for Master Brain orchestrator
 */

import {
  useMasterBrainQuery,
  useCreateMasterSession,
  useMasterBrainSession,
  useMasterBrainSessions,
  useEndMasterSession,
} from "@/brain/hooks/useMasterBrain";
import { useDomains } from "@/brain/hooks/useDomains";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Brain, MessageSquare, Plus, X, Send, History } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export function MasterBrainInterface() {
  const [query, setQuery] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>([]);

  const queryMutation = useMasterBrainQuery();
  const createSessionMutation = useCreateMasterSession();
  const { data: sessionState } = useMasterBrainSession(selectedSessionId);
  const { data: sessions } = useMasterBrainSessions();
  const { data: domains } = useDomains();
  const endSessionMutation = useEndMasterSession();

  const handleQuery = async () => {
    if (!query.trim()) return;

    try {
      await queryMutation.mutateAsync({
        query: query.trim(),
        sessionId: selectedSessionId || undefined,
      });
      setQuery("");
    } catch (error) {
      console.error("Query error:", error);
    }
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim() || selectedDomainIds.length === 0) {
      return;
    }

    try {
      const sessionId = await createSessionMutation.mutateAsync({
        sessionName: newSessionName.trim(),
        domainIds: selectedDomainIds,
      });
      setSelectedSessionId(sessionId);
      setIsCreatingSession(false);
      setNewSessionName("");
      setSelectedDomainIds([]);
    } catch (error) {
      console.error("Create session error:", error);
    }
  };

  const handleEndSession = async () => {
    if (!selectedSessionId) return;

    try {
      await endSessionMutation.mutateAsync({ sessionId: selectedSessionId });
      setSelectedSessionId(null);
    } catch (error) {
      console.error("End session error:", error);
    }
  };

  const conversationHistory = sessionState?.session?.conversation_history || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Master Brain</h2>
          <p className="text-muted-foreground">
            Central orchestrator for complex queries across multiple domains
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreatingSession} onOpenChange={setIsCreatingSession}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Master Brain Session</DialogTitle>
                <DialogDescription>
                  Create a new session to manage multi-domain conversations
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label htmlFor="session-name" className="text-sm font-medium mb-2 block">Session Name</label>
                  <Input
                    id="session-name"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="e.g., Project Planning Discussion"
                  />
                </div>
                <div>
                  <label htmlFor="domain-selection" className="text-sm font-medium mb-2 block">Select Domains</label>
                  <div id="domain-selection" className="space-y-2 max-h-48 overflow-y-auto">
                    {domains?.map((domain) => (
                      <div key={domain.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`domain-${domain.id}`}
                          checked={selectedDomainIds.includes(domain.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDomainIds([...selectedDomainIds, domain.id]);
                            } else {
                              setSelectedDomainIds(selectedDomainIds.filter((id) => id !== domain.id));
                            }
                          }}
                        />
                        <label htmlFor={`domain-${domain.id}`} className="text-sm cursor-pointer">
                          {domain.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreatingSession(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSession}
                  disabled={!newSessionName.trim() || selectedDomainIds.length === 0 || createSessionMutation.isPending}
                >
                  {createSessionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Create Session
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedSessionId && (
            <Button variant="outline" onClick={handleEndSession} disabled={endSessionMutation.isPending}>
              <X className="h-4 w-4 mr-2" />
              End Session
            </Button>
          )}
        </div>
      </div>

      {/* Session Selector */}
      {sessions && sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions
                .filter((s) => s.is_active)
                .map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSessionId === session.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedSessionId(session.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{session.session_name || "Unnamed Session"}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.initial_domain_ids?.length || 0} domains • {session.total_queries || 0} queries
                        </p>
                      </div>
                      <Badge variant={selectedSessionId === session.id ? "default" : "secondary"}>
                        {selectedSessionId === session.id ? "Active" : "Select"}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Master Brain Chat
            {selectedSessionId && (
              <Badge variant="outline" className="ml-2">
                Session Active
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {selectedSessionId
              ? `Session: ${sessionState?.session?.session_name || "Unnamed"}`
              : "Start a new session or select an existing one to begin"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 pt-0">
          <ScrollArea className="flex-1 pr-4 mb-4">
            <div className="space-y-4">
              {conversationHistory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversation yet. Start by asking a question.</p>
                </div>
              )}

              {conversationHistory.map((msg, idx) => (
                <div
                  key={`msg-${idx}-${msg.timestamp}`}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <p className="font-semibold mb-1">{msg.role === "user" ? "You" : "Master Brain"}</p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {format(new Date(msg.timestamp), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}

              {queryMutation.isPending && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] p-3 rounded-lg bg-muted text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                    Master Brain is thinking...
                  </div>
                </div>
              )}

              {queryMutation.data && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] p-3 rounded-lg bg-muted text-muted-foreground">
                    <p className="font-semibold mb-2">Master Brain Response</p>
                    <p className="whitespace-pre-wrap mb-3">{queryMutation.data.response}</p>
                    <div className="text-xs space-y-1">
                      <p>
                        <span className="font-semibold">Domains:</span>{" "}
                        {queryMutation.data.domains.map((d) => d.domainName).join(", ")}
                      </p>
                      <p>
                        <span className="font-semibold">Confidence:</span>{" "}
                        {(queryMutation.data.confidence * 100).toFixed(1)}%
                      </p>
                      <p>
                        <span className="font-semibold">Latency:</span> {queryMutation.data.latency}ms
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuery();
            }}
            className="flex gap-2"
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Master Brain a question..."
              className="flex-1"
              disabled={queryMutation.isPending}
            />
            <Button type="submit" disabled={queryMutation.isPending || !query.trim()}>
              {queryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Context Display */}
      {sessionState && sessionState.context.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Session Context
            </CardTitle>
            <CardDescription>Context gathered from domains in this session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessionState.context.map((ctx) => (
                <div key={ctx.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{ctx.domainName || ctx.domainId}</Badge>
                    <Badge variant="secondary">{(ctx.relevanceScore * 100).toFixed(0)}%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ctx.contextText}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

