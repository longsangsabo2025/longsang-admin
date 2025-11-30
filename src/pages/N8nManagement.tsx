import { N8nController } from "@/components/automation/N8nController";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Settings, Workflow, Zap } from "lucide-react";

export default function N8nManagement() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">n8n Workflow Management</h1>
        <p className="text-muted-foreground">Manage your n8n automation server and workflows</p>
      </div>

      {/* Server Controller */}
      <N8nController />

      {/* Quick Guide */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Start Server</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Click "Start & Open" to launch n8n and open the editor in your browser
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Edit Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Use the visual editor to create and modify automation workflows
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connect to Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Workflows can read/write to your Supabase database automatically
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitor Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Check server status, logs, and uptime in real-time
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Getting Started with n8n</CardTitle>
          <CardDescription>Learn how to create powerful automation workflows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">What is n8n?</h3>
            <p className="text-sm text-muted-foreground">
              n8n is a powerful workflow automation tool that connects your apps and services.
              Create workflows visually by connecting different nodes (services, actions,
              conditions).
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Common Use Cases:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Auto-generate content from AI and post to social media</li>
              <li>Monitor website changes and send notifications</li>
              <li>Process form submissions and store in database</li>
              <li>Schedule automated reports and emails</li>
              <li>Sync data between different platforms</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Quick Tips:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                <strong>Webhook Node:</strong> Trigger workflows from external HTTP requests
              </li>
              <li>
                <strong>HTTP Request Node:</strong> Call APIs and fetch data from web services
              </li>
              <li>
                <strong>Supabase Node:</strong> Query and update your database directly
              </li>
              <li>
                <strong>Schedule Trigger:</strong> Run workflows on a schedule (cron jobs)
              </li>
              <li>
                <strong>AI Nodes:</strong> Integrate OpenAI, Claude, and other AI services
              </li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm font-medium">
              💡 Pro Tip: After creating a workflow, activate it using the toggle switch in the n8n
              editor. Inactive workflows won't run even if triggered.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
