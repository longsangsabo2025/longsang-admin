import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileJson,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wand2,
  Copy,
  ExternalLink,
  Shield,
  Zap,
  ArrowRight,
  Code,
  Eye,
  Settings,
  Download,
  RotateCcw,
  Edit,
  Play,
  Globe,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface WorkflowAnalysis {
  summary: string;
  category: string;
  triggerType: string;
  requiredCredentials: string[];
  suggestedName: string;
  webhookPath: string;
  modifications: string[];
  risks: string[];
  estimatedCost: string;
  complexity: string;
}

interface ImportResult {
  success: boolean;
  workflow?: {
    id: string;
    name: string;
    webhookUrl: string;
    webhookPath: string;
    status: string;
  };
  analysis?: WorkflowAnalysis;
  error?: string;
}

interface SmartImportResult {
  success: boolean;
  analysis: WorkflowAnalysis;
  recommendations: Array<{
    type: string;
    target: string;
    suggestion: string;
    priority: string;
    reason: string;
  }>;
  missingCredentials: Array<{
    name: string;
    status: string;
    message: string;
  }>;
  previewWorkflow: any;
  warnings: string[];
}

const WorkflowImporter: React.FC = () => {
  const { toast } = useToast();
  
  // State
  const [workflowJson, setWorkflowJson] = useState<string>("");
  const [parsedWorkflow, setParsedWorkflow] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");
  const [options, setOptions] = useState({
    customize: true,
    autoActivate: true,
    saveAsTemplate: false,
  });
  
  // Loading states
  const [isValidating, setIsValidating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Results
  const [validationResult, setValidationResult] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<WorkflowAnalysis | null>(null);
  const [smartResult, setSmartResult] = useState<SmartImportResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Fetch projects from Supabase directly
  const { data: projectsData } = useQuery({
    queryKey: ["projects-for-import"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, slug, type, status')
        .order('name');
      
      if (error) throw error;
      return { projects: data || [] };
    },
  });

  const projects = projectsData?.projects || [];

  // Dropzone for file upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setWorkflowJson(content);
        try {
          const parsed = JSON.parse(content);
          setParsedWorkflow(parsed);
          setValidationResult(null);
          setAnalysisResult(null);
          setSmartResult(null);
          setImportResult(null);
          toast({
            title: "📄 File loaded",
            description: `Loaded: ${file.name}`,
          });
        } catch (err) {
          toast({
            title: "❌ Invalid JSON",
            description: "File is not valid JSON",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    multiple: false,
  });

  // Validate workflow
  const handleValidate = async () => {
    if (!workflowJson) return;
    
    setIsValidating(true);
    try {
      const res = await fetch(`${API_URL}/api/workflow-import/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow_json: workflowJson }),
      });
      const result = await res.json();
      setValidationResult(result);
      
      if (result.valid) {
        toast({ title: "✅ Valid workflow", description: `${result.nodeCount} nodes found` });
      } else {
        toast({ title: "❌ Invalid workflow", description: result.errors[0], variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsValidating(false);
    }
  };

  // Analyze with AI
  const handleAnalyze = async () => {
    if (!workflowJson) return;
    
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/workflow-import/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          workflow_json: workflowJson,
          project_id: selectedProjectId || undefined,
        }),
      });
      const result = await res.json();
      
      if (result.success) {
        setAnalysisResult(result.analysis);
        toast({ title: "🔍 Analysis complete", description: result.analysis.summary });
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Smart import with AI recommendations
  const handleSmartAnalyze = async () => {
    if (!workflowJson) return;
    
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/workflow-import/smart-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          workflow_json: workflowJson,
          project_id: selectedProjectId || undefined,
          purpose,
        }),
      });
      const result = await res.json();
      
      if (result.success) {
        setSmartResult(result);
        setAnalysisResult(result.analysis);
        toast({ 
          title: "🧠 Smart analysis complete", 
          description: `${result.recommendations.length} recommendations` 
        });
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Import workflow to n8n
  const handleImport = async () => {
    if (!workflowJson || !selectedProjectId) {
      toast({ 
        title: "Missing info", 
        description: "Please select a project first",
        variant: "destructive" 
      });
      return;
    }
    
    setIsImporting(true);
    try {
      const res = await fetch(`${API_URL}/api/workflow-import/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow_json: workflowJson,
          project_id: selectedProjectId,
          customize: options.customize,
          auto_activate: options.autoActivate,
          save_as_template: options.saveAsTemplate,
        }),
      });
      const result = await res.json();
      setImportResult(result);
      
      if (result.success) {
        toast({ 
          title: "🎉 Import successful!", 
          description: `Workflow "${result.workflow.name}" created`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setWorkflowJson("");
    setParsedWorkflow(null);
    setValidationResult(null);
    setAnalysisResult(null);
    setSmartResult(null);
    setImportResult(null);
    setPurpose("");
  };

  // Copy webhook URL
  const copyWebhookUrl = () => {
    if (importResult?.workflow?.webhookUrl) {
      navigator.clipboard.writeText(importResult.workflow.webhookUrl);
      toast({ title: "Copied!", description: "Webhook URL copied to clipboard" });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      automation: "bg-blue-500",
      marketing: "bg-purple-500",
      support: "bg-green-500",
      integration: "bg-orange-500",
      content: "bg-pink-500",
      "data-processing": "bg-cyan-500",
      notification: "bg-yellow-500",
      other: "bg-gray-500",
    };
    return colors[category] || colors.other;
  };

  const getComplexityColor = (complexity: string) => {
    const colors: Record<string, string> = {
      simple: "bg-green-500",
      moderate: "bg-yellow-500",
      complex: "bg-red-500",
    };
    return colors[complexity] || colors.moderate;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="text-4xl">🚀</div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Smart Workflow Importer
            </h1>
            <p className="text-muted-foreground mt-1">
              Upload workflow từ n8n community, AI sẽ phân tích và tùy chỉnh cho dự án của bạn
            </p>
            <div className="flex gap-2 mt-3">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" /> AI-Powered
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Zap className="w-3 h-3" /> Auto-Configure
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Shield className="w-3 h-3" /> Smart Validation
              </Badge>
            </div>
          </div>
          {/* Quick Actions */}
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("http://localhost:5678", "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open n8n
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://n8n.io/workflows", "_blank")}
            >
              <Globe className="w-4 h-4 mr-2" />
              n8n Community
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Upload & Input */}
        <div className="space-y-6">
          {/* Upload Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Workflow
              </CardTitle>
              <CardDescription>
                Kéo thả file JSON hoặc paste workflow từ n8n
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <FileJson className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                {isDragActive ? (
                  <p className="text-primary font-medium">Thả file vào đây...</p>
                ) : (
                  <>
                    <p className="font-medium">Kéo thả file .json vào đây</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      hoặc click để chọn file
                    </p>
                  </>
                )}
              </div>

              {/* Manual Input */}
              <div className="relative">
                <Textarea
                  placeholder='Hoặc paste workflow JSON ở đây...&#10;&#10;{"name": "My Workflow", "nodes": [...], "connections": {...}}'
                  value={workflowJson}
                  onChange={(e) => {
                    setWorkflowJson(e.target.value);
                    try {
                      setParsedWorkflow(JSON.parse(e.target.value));
                    } catch {
                      setParsedWorkflow(null);
                    }
                  }}
                  className="min-h-[150px] font-mono text-sm"
                />
                {workflowJson && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleReset}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Parsed Info */}
              {parsedWorkflow && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Valid JSON: <strong>{parsedWorkflow.name || "Unnamed"}</strong>
                    {" "}• {parsedWorkflow.nodes?.length || 0} nodes
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Import Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Project Select */}
              <div className="space-y-2">
                <Label>Dự án đích</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn dự án..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <Label>Mục đích sử dụng (optional)</Label>
                <Textarea
                  placeholder="Ví dụ: Tự động gửi email chào mừng cho khách hàng mới..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Tùy chỉnh cho dự án</Label>
                    <p className="text-xs text-muted-foreground">
                      AI sẽ đổi tên, webhook path phù hợp
                    </p>
                  </div>
                  <Switch
                    checked={options.customize}
                    onCheckedChange={(v) => setOptions({ ...options, customize: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Tự động kích hoạt</Label>
                    <p className="text-xs text-muted-foreground">
                      Workflow sẽ active ngay sau import
                    </p>
                  </div>
                  <Switch
                    checked={options.autoActivate}
                    onCheckedChange={(v) => setOptions({ ...options, autoActivate: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lưu làm template</Label>
                    <p className="text-xs text-muted-foreground">
                      Dùng lại cho các dự án khác
                    </p>
                  </div>
                  <Switch
                    checked={options.saveAsTemplate}
                    onCheckedChange={(v) => setOptions({ ...options, saveAsTemplate: v })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleValidate}
              disabled={!workflowJson || isValidating}
              className="flex-1"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Validate
            </Button>

            <Button
              variant="outline"
              onClick={handleAnalyze}
              disabled={!workflowJson || isAnalyzing}
              className="flex-1"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              Analyze
            </Button>

            <Button
              variant="secondary"
              onClick={handleSmartAnalyze}
              disabled={!workflowJson || isAnalyzing}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Smart AI
            </Button>
          </div>

          <Button
            onClick={handleImport}
            disabled={!workflowJson || !selectedProjectId || isImporting}
            className="w-full h-12 text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            {isImporting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            Import to n8n
          </Button>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {/* Validation Result */}
          {validationResult && (
            <Card className={validationResult.valid ? "border-green-500/50" : "border-red-500/50"}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {validationResult.valid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  Validation Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nodes:</span>{" "}
                    <strong>{validationResult.nodeCount}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Connections:</span>{" "}
                    <strong>{validationResult.connectionCount}</strong>
                  </div>
                </div>

                {validationResult.errors?.length > 0 && (
                  <div className="space-y-1">
                    {validationResult.errors.map((err: string, i: number) => (
                      <Alert key={i} variant="destructive" className="py-2">
                        <AlertDescription className="text-sm">{err}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {validationResult.warnings?.length > 0 && (
                  <div className="space-y-1">
                    {validationResult.warnings.map((warn: string, i: number) => (
                      <Alert key={i} className="py-2 border-yellow-500/50">
                        <AlertDescription className="text-sm text-yellow-600 dark:text-yellow-400">
                          ⚠️ {warn}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analysis Result */}
          {analysisResult && (
            <Card className="border-purple-500/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{analysisResult.summary}</p>

                <div className="flex flex-wrap gap-2">
                  <Badge className={getCategoryColor(analysisResult.category)}>
                    {analysisResult.category}
                  </Badge>
                  <Badge variant="outline">{analysisResult.triggerType}</Badge>
                  <Badge className={getComplexityColor(analysisResult.complexity)}>
                    {analysisResult.complexity}
                  </Badge>
                  <Badge variant="secondary">Cost: {analysisResult.estimatedCost}</Badge>
                </div>

                {analysisResult.requiredCredentials?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Required Credentials:</p>
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.requiredCredentials.map((cred, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          🔑 {cred}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.risks?.length > 0 && (
                  <Alert className="border-yellow-500/50">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <AlertTitle className="text-sm">Warnings</AlertTitle>
                    <AlertDescription className="text-xs">
                      <ul className="list-disc list-inside">
                        {analysisResult.risks.map((risk, i) => (
                          <li key={i}>{risk}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Smart Import Recommendations */}
          {smartResult?.recommendations && smartResult.recommendations.length > 0 && (
            <Card className="border-indigo-500/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wand2 className="w-5 h-5 text-indigo-500" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {smartResult.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border ${
                        rec.priority === "high"
                          ? "border-red-500/50 bg-red-500/5"
                          : rec.priority === "medium"
                          ? "border-yellow-500/50 bg-yellow-500/5"
                          : "border-gray-500/50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs shrink-0">
                          {rec.type}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{rec.suggestion}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            📍 {rec.target} • {rec.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Result */}
          {importResult && (
            <Card className={importResult.success ? "border-green-500" : "border-red-500"}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {importResult.success ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Import Successful! 🎉
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      Import Failed
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {importResult.success && importResult.workflow ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Workflow Name</span>
                        <span className="font-medium">{importResult.workflow.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">n8n ID</span>
                        <code className="text-sm bg-muted px-2 py-0.5 rounded">
                          {importResult.workflow.id}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge className="bg-green-500">{importResult.workflow.status}</Badge>
                      </div>
                    </div>

                    {importResult.workflow.webhookUrl && (
                      <div className="space-y-2">
                        <Label className="text-sm">Webhook URL</Label>
                        <div className="flex gap-2">
                          <code className="flex-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                            {importResult.workflow.webhookUrl}
                          </code>
                          <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(`http://localhost:5678/workflow/${importResult.workflow?.id}`, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in n8n
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => window.open(`http://localhost:5678/workflow/${importResult.workflow?.id}/edit`, "_blank")}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Workflow
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          if (importResult.workflow?.webhookUrl) {
                            window.open(importResult.workflow.webhookUrl, "_blank");
                          }
                        }}
                        disabled={!importResult.workflow?.webhookUrl}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Test Webhook
                      </Button>
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={handleReset}
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Import Another
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{importResult.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Preview JSON */}
          {smartResult?.previewWorkflow && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Code className="w-5 h-5" />
                  Preview Customized Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                  </TabsList>
                  <TabsContent value="summary" className="space-y-2 pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{smartResult.previewWorkflow.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nodes</span>
                      <span>{smartResult.previewWorkflow.nodes?.length}</span>
                    </div>
                  </TabsContent>
                  <TabsContent value="json" className="pt-3">
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-[300px]">
                      {JSON.stringify(smartResult.previewWorkflow, null, 2)}
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowImporter;
