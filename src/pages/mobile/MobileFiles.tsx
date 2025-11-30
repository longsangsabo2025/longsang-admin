import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { 
  Folder, 
  File, 
  ChevronRight, 
  ArrowLeft,
  Code,
  FileText,
  FileJson,
  FileImage,
  Loader2,
  RefreshCw,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FileItem {
  name: string;
  type: "file" | "folder";
  path: string;
  extension?: string;
}

const getFileIcon = (file: FileItem) => {
  if (file.type === "folder") {
    return <Folder className="w-5 h-5 text-yellow-400" />;
  }
  
  const ext = file.extension?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
      return <Code className="w-5 h-5 text-blue-400" />;
    case "json":
      return <FileJson className="w-5 h-5 text-yellow-400" />;
    case "md":
    case "txt":
      return <FileText className="w-5 h-5 text-gray-400" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
      return <FileImage className="w-5 h-5 text-purple-400" />;
    default:
      return <File className="w-5 h-5 text-gray-400" />;
  }
};

export function MobileFiles() {
  const [currentPath, setCurrentPath] = useState("src");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  // Mock data - replace with actual API call
  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath]);

  const loadFiles = async (path: string) => {
    setLoading(true);
    try {
      // Mock file list - replace with actual API
      const mockFiles: FileItem[] = [
        { name: "components", type: "folder", path: `${path}/components` },
        { name: "pages", type: "folder", path: `${path}/pages` },
        { name: "lib", type: "folder", path: `${path}/lib` },
        { name: "hooks", type: "folder", path: `${path}/hooks` },
        { name: "App.tsx", type: "file", path: `${path}/App.tsx`, extension: "tsx" },
        { name: "main.tsx", type: "file", path: `${path}/main.tsx`, extension: "tsx" },
        { name: "index.css", type: "file", path: `${path}/index.css`, extension: "css" },
        { name: "vite-env.d.ts", type: "file", path: `${path}/vite-env.d.ts`, extension: "ts" },
      ];
      
      await new Promise((r) => setTimeout(r, 500));
      setFiles(mockFiles);
    } catch (error) {
      console.error("Failed to load files:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFileContent = async (file: FileItem) => {
    setSelectedFile(file);
    setLoading(true);
    try {
      const response = await fetch("/api/ai/workspace-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Đọc nội dung file ${file.path}`,
          sessionId: "mobile-files",
          useMCPTools: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFileContent(data.response || "// File content here");
      }
    } catch (error) {
      setFileContent("// Error loading file");
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folder: FileItem) => {
    setCurrentPath(folder.path);
    setSelectedFile(null);
    setFileContent(null);
  };

  const goBack = () => {
    if (selectedFile) {
      setSelectedFile(null);
      setFileContent(null);
      return;
    }
    
    const parts = currentPath.split("/");
    if (parts.length > 1) {
      parts.pop();
      setCurrentPath(parts.join("/") || "src");
    }
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // File Viewer
  if (selectedFile && fileContent !== null) {
    return (
      <MobileLayout title={selectedFile.name}>
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          {/* Header */}
          <div className="flex items-center gap-2 p-3 bg-gray-900 border-b border-gray-800">
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getFileIcon(selectedFile)}
              <span className="text-sm text-gray-300 truncate">{selectedFile.path}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 bg-gray-950">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            ) : (
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                {fileContent}
              </pre>
            )}
          </div>
        </div>
      </MobileLayout>
    );
  }

  // File Browser
  return (
    <MobileLayout title="Files">
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Path & Search */}
        <div className="p-3 space-y-2 bg-gray-900 border-b border-gray-800">
          {/* Current Path */}
          <div className="flex items-center gap-2">
            {currentPath !== "src" && (
              <Button variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex items-center gap-1 text-sm text-gray-400 overflow-x-auto">
              <Folder className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{currentPath}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadFiles(currentPath)}
              className="ml-auto"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm file..."
              className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto">
          {loading && !files.length ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {/* Folders first, then files */}
              {filteredFiles
                .sort((a, b) => {
                  if (a.type === b.type) return a.name.localeCompare(b.name);
                  return a.type === "folder" ? -1 : 1;
                })
                .map((file) => (
                  <button
                    key={file.path}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-900 active:bg-gray-800 transition-colors text-left"
                    onClick={() =>
                      file.type === "folder"
                        ? navigateToFolder(file)
                        : loadFileContent(file)
                    }
                  >
                    {getFileIcon(file)}
                    <span className="flex-1 text-sm text-white truncate">
                      {file.name}
                    </span>
                    {file.type === "folder" && (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                ))}

              {filteredFiles.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Không tìm thấy file</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

export default MobileFiles;
