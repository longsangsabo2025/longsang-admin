/**
 * Domain Agent Component
 * Chat interface for domain-specific AI agent
 */

import { useDomainQuery, useDomainSuggestions } from "@/brain/hooks/useDomainAgent";
import type { DomainQueryResponse } from "@/brain/types/domain-agent.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useState } from "react";

interface DomainAgentProps {
  domainId: string;
  domainName: string;
}

export function DomainAgent({ domainId, domainName }: DomainAgentProps) {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>>([]);
  const queryMutation = useDomainQuery();
  const { data: suggestions } = useDomainSuggestions(domainId, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || queryMutation.isPending) return;

    const userMessage = question.trim();
    setQuestion("");
    setConversation((prev) => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);

    try {
      const response = await queryMutation.mutateAsync({
        question: userMessage,
        domainId,
      });

      setConversation((prev) => [
        ...prev,
        { role: "assistant", content: response.response, timestamp: new Date() },
      ]);
    } catch (error) {
      setConversation((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`, timestamp: new Date() },
      ]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion);
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Domain Agent: {domainName}
          </CardTitle>
          <CardDescription>Ask questions about this domain's knowledge</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          {/* Conversation History */}
          <ScrollArea className="flex-1 border rounded-lg p-4 min-h-[400px]">
            {conversation.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with the domain agent</p>
                {suggestions && suggestions.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm mb-2">Suggested questions:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestions.slice(0, 3).map((s, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(`Tell me about ${s.title}`)}
                        >
                          {s.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {conversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-2 max-w-[80%] ${
                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {queryMutation.isPending && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about this domain..."
              disabled={queryMutation.isPending}
              className="flex-1"
            />
            <Button type="submit" disabled={!question.trim() || queryMutation.isPending}>
              {queryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

