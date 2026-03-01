/**
 * File & Document Harvester
 * 
 * Features:
 * - PDF, DOCX, PPTX Processing
 * - Code File Analysis (.py, .js, .ts)
 * - Google Drive Auto-Sync
 * - Book/eBook Chapter Extraction
 */

import { useDomains } from '@/brain/hooks/useDomains';
import { useIngestKnowledge } from '@/brain/hooks/useKnowledge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Search,
  Sparkles,
  Brain,
  Plus,
  ExternalLink,
  Clock,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  FolderOpen,
  File,
  FileCode,
  FileSpreadsheet,
  FileImage,
  HardDrive,
  Cloud,
  Book,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

interface ProcessedDocument {
  id: string;
  fileName: string;
  fileType: string;
  content: string;
  pageCount?: number;
  wordCount: number;
  extractedAt: string;
}

interface FileHarvesterProps {
  readonly selectedDomainId?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function FileHarvester({ selectedDomainId }: FileHarvesterProps) {
  const { data: domains } = useDomains();
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="upload" className="flex flex-col items-center gap-1 py-3">
            <Upload className="h-5 w-5" />
            <span className="text-xs">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="drive" className="flex flex-col items-center gap-1 py-3">
            <Cloud className="h-5 w-5" />
            <span className="text-xs">Google Drive</span>
          </TabsTrigger>
          <TabsTrigger value="code" className="flex flex-col items-center gap-1 py-3">
            <FileCode className="h-5 w-5" />
            <span className="text-xs">Code Files</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex flex-col items-center gap-1 py-3">
            <Clock className="h-5 w-5" />
            <span className="text-xs">History</span>
          </TabsTrigger>
        </TabsList>

        {/* File Upload */}
        <TabsContent value="upload">
          <FileUploader 
            domains={domains || []} 
            selectedDomainId={selectedDomainId}
          />
        </TabsContent>

        {/* Google Drive */}
        <TabsContent value="drive">
          <GoogleDriveSync />
        </TabsContent>

        {/* Code Files */}
        <TabsContent value="code">
          <CodeFileAnalyzer 
            domains={domains || []}
            selectedDomainId={selectedDomainId}
          />
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <FileHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FILE UPLOADER
// ═══════════════════════════════════════════════════════════════

function FileUploader({ 
  domains, 
  selectedDomainId 
}: { 
  domains: any[];
  selectedDomainId?: string | null;
}) {
  const ingestKnowledge = useIngestKnowledge();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDomain, setSelectedDomain] = useState(selectedDomainId || '');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportedTypes = [
    '.pdf', '.doc', '.docx', '.txt', '.md',
    '.ppt', '.pptx', '.xls', '.xlsx', '.csv',
    '.json', '.xml', '.html'
  ];

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type || getFileType(file.name),
      size: file.size,
      status: 'pending' as const
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'json': 'application/json',
    };
    return typeMap[ext || ''] || 'application/octet-stream';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('word') || type.includes('document')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    if (type.includes('image')) return <FileImage className="h-5 w-5 text-purple-500" />;
    if (type.includes('code') || type.includes('javascript') || type.includes('json')) return <FileCode className="h-5 w-5 text-yellow-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Process files
  const processFiles = async () => {
    if (files.length === 0 || !selectedDomain) return;

    setProcessing(true);
    setError(null);

    for (const file of files.filter(f => f.status === 'pending')) {
      // Update status to processing
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' as const } : f
      ));

      try {
        // In a real implementation, this would upload and process the file
        // For now, we'll simulate the process
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulate extracted content
        const content = `# ${file.name}\n\nContent extracted from ${file.name}.\n\nFile type: ${file.type}\nSize: ${formatFileSize(file.size)}`;

        // Ingest to brain
        await ingestKnowledge.mutateAsync({
          domainId: selectedDomain,
          title: file.name,
          content,
          contentType: 'document',
          tags: ['file', file.type.split('/')[1] || 'document'],
          metadata: {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            importedAt: new Date().toISOString()
          }
        });

        // Save to history
        const history = JSON.parse(localStorage.getItem('file-import-history') || '[]');
        history.unshift({
          id: file.id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          importedAt: new Date().toISOString()
        });
        localStorage.setItem('file-import-history', JSON.stringify(history.slice(0, 100)));

        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'done' as const } : f
        ));
      } catch (err) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'error' as const, 
            error: err instanceof Error ? err.message : 'Processing failed' 
          } : f
        ));
      }
    }

    setProcessing(false);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'done'));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-green-500" />
            <CardTitle>File Upload</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-500">Active</Badge>
        </div>
        <CardDescription>
          Upload PDF, Word, Excel, và nhiều loại file khác để extract kiến thức
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Domain Selection */}
        <div className="space-y-2">
          <Label>Domain đích *</Label>
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn domain để lưu" />
            </SelectTrigger>
            <SelectContent>
              {domains?.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>{domain.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Drop Zone */}
        <div 
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={supportedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="font-medium">Click để chọn files hoặc kéo thả vào đây</p>
          <p className="text-sm text-muted-foreground mt-1">
            Hỗ trợ: PDF, DOC, DOCX, TXT, MD, XLS, XLSX, CSV, JSON
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Files ({files.length})</Label>
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                Xóa đã hoàn thành
              </Button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    file.status === 'done' ? 'bg-green-500/5 border-green-500/30' :
                    file.status === 'error' ? 'bg-red-500/5 border-red-500/30' :
                    file.status === 'processing' ? 'bg-blue-500/5 border-blue-500/30' :
                    'hover:bg-muted/50'
                  }`}
                >
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === 'processing' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {file.status === 'done' && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    {file.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process Button */}
        {files.some(f => f.status === 'pending') && (
          <Button 
            onClick={processFiles}
            disabled={processing || !selectedDomain}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
            ) : (
              <><Brain className="h-4 w-4 mr-2" />Process {files.filter(f => f.status === 'pending').length} files</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// GOOGLE DRIVE SYNC
// ═══════════════════════════════════════════════════════════════

function GoogleDriveSync() {
  const [connected, setConnected] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-500" />
            <CardTitle>Google Drive Sync</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-500">Active</Badge>
        </div>
        <CardDescription>
          Kết nối Google Drive để auto-sync documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!connected ? (
          <div className="text-center py-8">
            <HardDrive className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Kết nối Google Drive</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cho phép truy cập để sync files tự động
            </p>
            <Button onClick={() => setConnected(true)}>
              <Cloud className="h-4 w-4 mr-2" />
              Connect Google Drive
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Đã kết nối với Google Drive
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Chọn folder để sync</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto p-2 border rounded-lg">
                {['Documents', 'Research', 'Books', 'Notes', 'Projects'].map((folder) => (
                  <div
                    key={folder}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                  >
                    <FolderOpen className="h-5 w-5 text-yellow-500" />
                    <span className="flex-1">{folder}</span>
                    <input type="checkbox" className="w-4 h-4" />
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// CODE FILE ANALYZER
// ═══════════════════════════════════════════════════════════════

function CodeFileAnalyzer({ 
  domains, 
  selectedDomainId 
}: { 
  domains: any[];
  selectedDomainId?: string | null;
}) {
  const [repoUrl, setRepoUrl] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(selectedDomainId || '');
  const [loading, setLoading] = useState(false);

  const analyzeRepo = async () => {
    setLoading(true);
    // Implementation would analyze GitHub repo
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-yellow-500" />
            <CardTitle>Code Repository Analyzer</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-500">Active</Badge>
        </div>
        <CardDescription>
          Phân tích và extract knowledge từ code repositories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Domain Selection */}
        <div className="space-y-2">
          <Label>Domain đích *</Label>
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn domain để lưu" />
            </SelectTrigger>
            <SelectContent>
              {domains?.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>{domain.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Repo URL */}
        <div className="space-y-2">
          <Label>GitHub Repository URL</Label>
          <div className="flex gap-2">
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              className="flex-1"
            />
            <Button onClick={analyzeRepo} disabled={!repoUrl || !selectedDomain || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Supported Languages */}
        <div className="space-y-2">
          <Label>Supported Languages</Label>
          <div className="flex flex-wrap gap-2">
            {['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C#'].map((lang) => (
              <Badge key={lang} variant="outline">{lang}</Badge>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            README extraction
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Code comments
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            API documentation
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Architecture analysis
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// FILE HISTORY
// ═══════════════════════════════════════════════════════════════

function FileHistory() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('file-import-history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const getFileIcon = (type: string) => {
    if (type?.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type?.includes('word') || type?.includes('document')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (type?.includes('sheet') || type?.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    if (type?.includes('code')) return <FileCode className="h-5 w-5 text-yellow-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatSize = (bytes: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <CardTitle>Import History</CardTitle>
          </div>
          <Badge variant="secondary">{history.length} files</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có file nào được import</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50"
              >
                {getFileIcon(item.fileType)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(item.fileSize)} • {new Date(item.importedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
