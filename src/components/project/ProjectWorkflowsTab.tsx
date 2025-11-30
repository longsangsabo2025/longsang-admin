import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Workflow,
  Play,
  Pause,
  ExternalLink,
  RefreshCw,
  Zap
} from "lucide-react";

interface ProjectWorkflowsTabProps {
  projectId: string;
  projectSlug: string;
}

export function ProjectWorkflowsTab({ projectId, projectSlug }: ProjectWorkflowsTabProps) {
  // Placeholder workflows - will be connected to n8n
  const workflows = [
    { 
      id: 1, 
      name: "Auto Social Post", 
      status: "active",
      lastRun: "2 giờ trước",
      runs: 127
    },
    { 
      id: 2, 
      name: "Content Generator", 
      status: "paused",
      lastRun: "1 ngày trước",
      runs: 45
    },
    { 
      id: 3, 
      name: "SEO Report", 
      status: "active",
      lastRun: "30 phút trước",
      runs: 89
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">n8n Workflows</h3>
          <p className="text-sm text-muted-foreground">
            Automation workflows cho dự án {projectSlug}
          </p>
        </div>
        <Button>
          <Zap className="h-4 w-4 mr-2" />
          Tạo Workflow Mới
        </Button>
      </div>

      {/* Workflows List */}
      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    workflow.status === "active" 
                      ? "bg-green-500/10" 
                      : "bg-gray-500/10"
                  }`}>
                    <Workflow className={`h-5 w-5 ${
                      workflow.status === "active" 
                        ? "text-green-500" 
                        : "text-gray-500"
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{workflow.name}</span>
                      <Badge variant={workflow.status === "active" ? "default" : "secondary"}>
                        {workflow.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Last run: {workflow.lastRun} • {workflow.runs} total runs
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    {workflow.status === "active" ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* n8n Link */}
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="font-semibold mb-2">Mở n8n Dashboard</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Quản lý workflows chi tiết trên n8n server
          </p>
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Mở n8n
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
