import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { googleDriveAPI } from '@/lib/api/google-drive-http';
import type { DriveFile, DriveFolder } from '@/lib/api/google-drive-http';
import { 
  Upload, 
  Folder, 
  File, 
  Image, 
  FileText, 
  Video, 
  Music, 
  Download, 
  Share2, 
  Trash2, 
  Search,
  Grid3X3,
  List,
  Plus,
  MoreHorizontal,
  Star,
  Clock,
  Eye,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileItem {
  id: string;
  name: string;
  type: "folder" | "file";
  fileType?: "image" | "document" | "video" | "audio" | "other";
  size?: string;
  modified: string;
  owner: string;
  starred?: boolean;
  thumbnail?: string;
  mimeType?: string;
  webViewLink?: string;
}

// Helper function to convert DriveFile to FileItem
const convertDriveFileToFileItem = (file: DriveFile): FileItem => {
  const getFileType = (mimeType: string): "image" | "document" | "video" | "audio" | "other" => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    return 'other';
  };

  const formatFileSize = (bytes?: string): string => {
    if (!bytes) return 'Unknown';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return {
    id: file.id,
    name: file.name,
    type: "file",
    fileType: getFileType(file.mimeType),
    size: formatFileSize(file.size),
    modified: new Date(file.modifiedTime).toLocaleString(),
    owner: file.owners?.[0]?.displayName || 'Unknown',
    mimeType: file.mimeType,
    webViewLink: file.webViewLink,
    thumbnail: file.thumbnailLink
  };
};

// Helper function to convert DriveFolder to FileItem  
const convertDriveFolderToFileItem = (folder: DriveFolder): FileItem => ({
  id: folder.id,
  name: folder.name,
  type: "folder",
  modified: new Date(folder.modifiedTime).toLocaleString(),
  owner: 'Admin'
});

const AdminFileManagerReal = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState("root");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalSize, setTotalSize] = useState("0 GB");

  // Mock data for demo - will be replaced with Google Drive API
  const mockFiles: FileItem[] = [
    {
      id: "1",
      name: "AI Workflows Documentation",
      type: "folder",
      modified: "2 hours ago",
      owner: "Admin",
      starred: true
    },
    {
      id: "2", 
      name: "Client Projects",
      type: "folder",
      modified: "1 day ago",
      owner: "Admin"
    },
    {
      id: "3",
      name: "Marketing Assets",
      type: "folder", 
      modified: "3 days ago",
      owner: "Admin"
    },
    {
      id: "4",
      name: "AI_Strategy_2025.pdf",
      type: "file",
      fileType: "document",
      size: "2.4 MB",
      modified: "5 minutes ago",
      owner: "Admin",
      starred: true,
      mimeType: "application/pdf"
    },
    {
      id: "5",
      name: "automation_demo.mp4",
      type: "file", 
      fileType: "video",
      size: "45.2 MB",
      modified: "1 hour ago",
      owner: "Admin",
      mimeType: "video/mp4"
    },
    {
      id: "6",
      name: "logo_variations.png",
      type: "file",
      fileType: "image", 
      size: "1.8 MB",
      modified: "2 days ago",
      owner: "Admin",
      thumbnail: "/api/placeholder/150/150",
      mimeType: "image/png"
    },
    {
      id: "7",
      name: "meeting_notes.md",
      type: "file",
      fileType: "document",
      size: "24 KB", 
      modified: "3 hours ago",
      owner: "Admin",
      mimeType: "text/markdown"
    }
  ];

  // Load files from Google Drive
  const loadFiles = async (folderId: string = 'root') => {
    setLoading(true);
    try {
      const result = await googleDriveAPI.listFiles(folderId);
      
      // Convert Drive files and folders to FileItem format
      const fileItems: FileItem[] = [
        ...result.folders.map(convertDriveFolderToFileItem),
        ...result.files.map(convertDriveFileToFileItem)
      ];
      
      setFiles(fileItems);
      setTotalFiles(fileItems.length);
      
      // Calculate total size from files
      const totalBytes = result.files.reduce((sum, file) => {
        return sum + (file.size ? parseInt(file.size) : 0);
      }, 0);
      const totalSizeFormatted = totalBytes > 0 ? `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB` : "0 GB";
      setTotalSize(totalSizeFormatted);
      
      toast({
        title: "Files loaded",
        description: `Found ${fileItems.length} items`,
      });
    } catch (error: any) {
      console.error('Error loading files:', error);
      toast({
        title: "Error loading files",
        description: error.message || "Failed to load files from Google Drive",
        variant: "destructive",
      });
      // Fallback to mock data on error
      setFiles(mockFiles);
      setTotalFiles(mockFiles.length);
      setTotalSize("2.4 GB");
    } finally {
      setLoading(false);
    }
  };

  // Upload files
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    
    try {
      for (const file of Array.from(selectedFiles)) {
        // Validate file size (100MB limit)
        if (file.size > 100 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 100MB limit`,
            variant: "destructive",
          });
          continue;
        }

        // Upload to Google Drive
        await googleDriveAPI.uploadFile(file, currentFolder);
        
        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded to Google Drive`,
        });
      }

      // Reload files
      await loadFiles(currentFolder);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload files to Google Drive",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  // Create new folder
  const handleCreateFolder = async () => {
    const name = prompt("Enter folder name:");
    if (!name?.trim()) return;

    setLoading(true);
    try {
      // Create folder in Google Drive
      await googleDriveAPI.createFolder(name, currentFolder);
      
      toast({
        title: "Folder created",
        description: `Folder "${name}" has been created in Google Drive`,
      });
      
      await loadFiles(currentFolder);
    } catch (error: any) {
      console.error('Create folder error:', error);
      toast({
        title: "Error creating folder",
        description: error.message || "Failed to create folder in Google Drive",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete file or folder
  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    setLoading(true);
    try {
      // Delete from Google Drive
      await googleDriveAPI.deleteFile(fileId);
      
      toast({
        title: "Deleted successfully",
        description: `"${fileName}" has been deleted from Google Drive`,
      });
      
      await loadFiles(currentFolder);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error deleting item",
        description: error.message || "Failed to delete item from Google Drive",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Download file
  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      toast({
        title: "Download started",
        description: `Downloading "${fileName}" from Google Drive...`,
      });

      // Download from Google Drive
      const blob = await googleDriveAPI.downloadFile(fileId);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download completed",
        description: `"${fileName}" has been downloaded successfully`,
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to download file from Google Drive",
        variant: "destructive",
      });
    }
  };

  // Share file
  const handleShare = async (fileId: string, fileName: string) => {
    const email = prompt("Enter email address to share with:");
    if (!email?.trim()) return;

    try {
      // Share file in Google Drive
      await googleDriveAPI.shareFile(fileId, email, 'reader');
      
      toast({
        title: "File shared",
        description: `"${fileName}" has been shared with ${email} via Google Drive`,
      });
    } catch (error: any) {
      console.error('Share error:', error);
      toast({
        title: "Sharing failed",
        description: error.message || "Failed to share file in Google Drive",
        variant: "destructive",
      });
    }
  };

  // Initial load
  useEffect(() => {
    loadFiles(currentFolder);
  }, [currentFolder]);

  const getFileIcon = (item: FileItem) => {
    if (item.type === "folder") return <Folder className="h-8 w-8 text-blue-600" />;
    
    switch (item.fileType) {
      case "image": return <Image className="h-8 w-8 text-green-600" />;
      case "document": return <FileText className="h-8 w-8 text-red-600" />;
      case "video": return <Video className="h-8 w-8 text-purple-600" />;
      case "audio": return <Music className="h-8 w-8 text-orange-600" />;
      default: return <File className="h-8 w-8 text-gray-600" />;
    }
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const FileCard = ({ file }: { file: FileItem }) => (
    <Card className="group hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* File Icon/Thumbnail */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {file.thumbnail ? (
                <img 
                  src={file.thumbnail} 
                  alt={file.name}
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                getFileIcon(file)
              )}
              {file.starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </DropdownMenuItem>
                {file.type === "file" && (
                  <DropdownMenuItem className="gap-2" onClick={() => handleDownload(file.id, file.name)}>
                    <Download className="h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="gap-2" onClick={() => handleShare(file.id, file.name)}>
                  <Share2 className="h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-red-600" onClick={() => handleDelete(file.id, file.name)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* File Info */}
          <div>
            <p className="font-medium text-sm truncate">{file.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              {file.modified}
            </div>
            {file.size && (
              <p className="text-xs text-muted-foreground">{file.size}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const FileRow = ({ file }: { file: FileItem }) => (
    <div className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {file.thumbnail ? (
          <img 
            src={file.thumbnail} 
            alt={file.name}
            className="h-8 w-8 rounded object-cover"
          />
        ) : (
          getFileIcon(file)
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{file.name}</p>
            {file.starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
          </div>
        </div>
      </div>
      
      <div className="hidden md:block text-sm text-muted-foreground min-w-0">
        {file.modified}
      </div>
      
      <div className="hidden md:block text-sm text-muted-foreground min-w-0">
        {file.size || "—"}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </DropdownMenuItem>
          {file.type === "file" && (
            <DropdownMenuItem className="gap-2" onClick={() => handleDownload(file.id, file.name)}>
              <Download className="h-4 w-4" />
              Download
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="gap-2" onClick={() => handleShare(file.id, file.name)}>
            <Share2 className="h-4 w-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-red-600" onClick={() => handleDelete(file.id, file.name)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (loading && files.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading files from Google Drive...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý File</h1>
          <p className="text-muted-foreground">Quản lý files Google Drive của bạn</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="file-upload"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button 
            className="gap-2"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải lên...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Tải Lên Files
              </>
            )}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleCreateFolder} disabled={loading}>
            <Plus className="h-4 w-4" />
            New Folder
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Files</CardDescription>
            <CardTitle className="text-2xl">{totalFiles}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Size</CardDescription>
            <CardTitle className="text-2xl">{totalSize}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Shared Files</CardDescription>
            <CardTitle className="text-2xl">12</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recent Uploads</CardDescription>
            <CardTitle className="text-2xl">5</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search & View Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* File Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredFiles.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {/* List Header */}
                  <div className="flex items-center gap-4 p-3 border-b text-sm font-medium text-muted-foreground">
                    <div className="flex-1">Name</div>
                    <div className="hidden md:block min-w-0">Modified</div>
                    <div className="hidden md:block min-w-0">Size</div>
                    <div className="w-8"></div>
                  </div>
                  
                  {/* File Rows */}
                  {filteredFiles.map((file) => (
                    <FileRow key={file.id} file={file} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Recent files will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="starred">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredFiles
              .filter(file => file.starred)
              .map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="shared">
          <Card>
            <CardContent className="p-6 text-center">
              <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Shared files will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFileManagerReal;