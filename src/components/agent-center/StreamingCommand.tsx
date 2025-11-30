/**
 * 🌊 Streaming Command Component
 *
 * Displays streaming command execution with real-time updates
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface StreamingEvent {
  type: 'thinking' | 'action' | 'result' | 'complete' | 'error';
  content?: string;
  action?: string;
  message?: string;
  function?: string;
  workflow?: any;
  workflows?: number;
}

export function StreamingCommand({
  command,
  onComplete
}: {
  command: string;
  onComplete?: (result: any) => void;
}) {
  const [events, setEvents] = useState<StreamingEvent[]>([]);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!command) return;

    // Reset state
    setEvents([]);
    setStreamingContent('');
    setCurrentAction(null);
    setIsComplete(false);

    // Use fetch with POST for SSE (EventSource doesn't support POST)
    const abortController = new AbortController();

    fetch(`${API_BASE}/api/ai/command/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command }),
      signal: abortController.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Stream failed');

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('No reader available');

        const readStream = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              setIsComplete(true);
              return;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data: StreamingEvent = JSON.parse(line.slice(6));

                  setEvents((prev) => [...prev, data]);

                  if (data.type === 'thinking' && data.content) {
                    setStreamingContent((prev) => prev + data.content);
                  } else if (data.type === 'action') {
                    setCurrentAction(data.action || null);
                  } else if (data.type === 'complete') {
                    setIsComplete(true);
                    if (onComplete) {
                      onComplete(data);
                    }
                  } else if (data.type === 'error') {
                    setIsComplete(true);
                  }
                } catch (error) {
                  console.error('Error parsing SSE event:', error);
                }
              }
            }

            readStream();
          }).catch((error) => {
            if (error.name !== 'AbortError') {
              console.error('SSE read error:', error);
              setIsComplete(true);
            }
          });
        };

        readStream();
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('SSE error:', error);
          setIsComplete(true);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [command, onComplete]);

  if (!command) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Command */}
          <div>
            <div className="text-sm font-medium mb-1">Command:</div>
            <code className="text-sm bg-muted p-2 rounded">{command}</code>
          </div>

          {/* Current Action */}
          {currentAction && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm">Đang thực hiện: {currentAction}</span>
            </div>
          )}

          {/* Streaming Content */}
          {streamingContent && (
            <div className="space-y-2">
              <div className="text-sm font-medium">AI đang suy nghĩ:</div>
              <div className="prose prose-sm max-w-none bg-muted p-3 rounded">
                {streamingContent}
                {!isComplete && <span className="animate-pulse">|</span>}
              </div>
            </div>
          )}

          {/* Results */}
          {events.filter(e => e.type === 'result').map((event, i) => (
            <div key={i} className="space-y-2">
              <Badge variant="outline">Result: {event.function}</Badge>
              {event.workflow && (
                <div className="text-xs bg-muted p-2 rounded">
                  Workflow: {event.workflow.name}
                </div>
              )}
            </div>
          ))}

          {/* Complete */}
          {isComplete && (
            <div className="flex items-center gap-2">
              <Badge variant="default">Hoàn thành</Badge>
              {events.filter(e => e.type === 'complete').map((e, i) => (
                <span key={i} className="text-sm text-muted-foreground">
                  {e.message}
                </span>
              ))}
            </div>
          )}

          {/* Error */}
          {events.filter(e => e.type === 'error').map((event, i) => (
            <div key={i} className="text-sm text-destructive">
              ❌ {event.message}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

