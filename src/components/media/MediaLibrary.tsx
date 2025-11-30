import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { googleDriveAPI, DriveFile, DriveFolder } from "@/lib/api/google-drive-http";
import { 
  Upload, 
  Folder, 
  File, 
  Image, 
  FileText, 
  Video, 
  Music, 
  Search,
  Grid3X3,
  List,
  Plus,
  Loader2,
  Check,
  X,
  ChevronLeft,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size?: string;
  thumbnail?: string;
}

interface MediaLibraryProps {
  /** Trigger element to open the dialog */
  trigger?: React.ReactNode;
  /** Called when file(s) are selected */
  onSelect?: (files: MediaFile[]) => void;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Filter by file types */
  accept?: "image" | "video" | "audio" | "document" | "all";
  /** Default folder to open */
  defaultFolder?: string;
  /** Max number of files to select */
  maxFiles?: number;
  /** Title of the dialog */
  title?: string;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType?.startsWith('image/')) return <Image className="h-8 w-8 text-green-500" />;
  if (mimeType?.startsWith('video/')) return <Video className="h-8 w-8 text-purple-500" />;
  if (mimeType?.startsWith('audio/')) return <Music className="h-8 w-8 text-pink-500" />;
  if (mimeType?.includes('pdf') || mimeType?.includes('document')) return <FileText className="h-8 w-8 text-red-500" />;
  return <File className="h-8 w-8 text-gray-500" />;
};

const formatFileSize = (bytes?: string): string => {
  if (!bytes) return '';
  const size = Number.parseInt(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const filterByType = (files: DriveFile[], accept: string): DriveFile[] => {
  if (accept === 'all') return files;
  return files.filter(file => {
    const mimeType = file.mimeType || '';
    switch (accept) {
      case 'image': return mimeType.startsWith('image/');
      case 'video': return mimeType.startsWith('video/');
      case 'audio': return mimeType.startsWith('audio/');
      case 'document': return mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text');
      default: return true;
    }
  });
};

export const MediaLibrary = ({
  trigger,
  onSelect,
  multiple = false,
  accept = "all",
  defaultFolder = "root",
  maxFiles = 10,
  title = "Chọn File"
}: MediaLibraryProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState(defaultFolder);
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([{ id: "root", name: "My Drive" }]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [activeTab, setActiveTab] = useState<"browse" | "upload">("browse");

  // Load files when dialog opens or folder changes
  const loadFiles = useCallback(async (folderId: string) => {
    setLoading(true);
    try {
      const result = await googleDriveAPI.listFiles(folderId);
      setFiles(filterByType(result.files || [], accept));
      setFolders(result.folders || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách file",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [accept, toast]);

  // Handle dialog open
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      loadFiles(currentFolder);
    } else {
      // Reset state when closing
      setSelectedFiles([]);
      setSearchQuery("");
    }
  };

  // Navigate to folder
  const navigateToFolder = (folder: DriveFolder) => {
    setCurrentFolder(folder.id);
    setFolderStack(prev => [...prev, { id: folder.id, name: folder.name }]);
    loadFiles(folder.id);
  };

  // Go back to parent folder
  const goBack = () => {
    if (folderStack.length > 1) {
      const newStack = [...folderStack];
      newStack.pop();
      const parentFolder = newStack.at(-1);
      if (parentFolder) {
        setFolderStack(newStack);
        setCurrentFolder(parentFolder.id);
        loadFiles(parentFolder.id);
      }
    }
  };

  // Toggle file selection
  const toggleFileSelection = (file: DriveFile) => {
    const mediaFile: MediaFile = {
      id: file.id,
      name: file.name,
      url: file.webViewLink || file.webContentLink || `https://drive.google.com/file/d/${file.id}/view`,
      mimeType: file.mimeType,
      size: file.size,
      thumbnail: file.thumbnailLink
    };

    if (multiple) {
      setSelectedFiles(prev => {
        const exists = prev.find(f => f.id === file.id);
        if (exists) {
          return prev.filter(f => f.id !== file.id);
        }
        if (prev.length >= maxFiles) {
          toast({
            title: "Giới hạn",
            description: `Chỉ có thể chọn tối đa ${maxFiles} files`,
            variant: "destructive"
          });
          return prev;
        }
        return [...prev, mediaFile];
      });
    } else {
      setSelectedFiles([mediaFile]);
    }
  };

  // Confirm selection
  const confirmSelection = () => {
    if (selectedFiles.length > 0 && onSelect) {
      onSelect(selectedFiles);
    }
    setOpen(false);
  };

  // Handle file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles?.length) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(uploadedFiles).map(file => 
        googleDriveAPI.uploadFile(file, currentFolder)
      );
      
      const results = await Promise.all(uploadPromises);
      
      toast({
        title: "Thành công!",
        description: `Đã upload ${results.length} file(s)`,
      });
      
      // Reload files
      loadFiles(currentFolder);
      setActiveTab("browse");
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Lỗi upload",
        description: "Không thể upload file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Filter files by search query
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline"><FolderOpen className="mr-2 h-4 w-4" /> Media Library</Button>}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "browse" | "upload")} className="flex-1 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="browse">
                <Folder className="mr-2 h-4 w-4" />
                Duyệt Files
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Mới
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              >
                {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <TabsContent value="browse" className="flex-1 overflow-hidden flex flex-col">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 mb-3 text-sm">
              {folderStack.length > 1 && (
                <Button variant="ghost" size="sm" onClick={goBack}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {folderStack.map((folder, index) => (
                <span key={folder.id} className="flex items-center">
                  {index > 0 && <span className="mx-1 text-muted-foreground">/</span>}
                  <span className={cn(
                    index === folderStack.length - 1 ? "font-medium" : "text-muted-foreground"
                  )}>
                    {folder.name}
                  </span>
                </span>
              ))}
            </div>

            {/* File Grid/List */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className={cn(
                  viewMode === "grid" 
                    ? "grid grid-cols-4 gap-3" 
                    : "flex flex-col gap-2"
                )}>
                  {/* Folders */}
                  {filteredFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className={cn(
                        "cursor-pointer rounded-lg border p-3 hover:bg-accent transition-colors",
                        viewMode === "list" && "flex items-center gap-3"
                      )}
                      onClick={() => navigateToFolder(folder)}
                    >
                      <Folder className="h-8 w-8 text-yellow-500" />
                      <span className="text-sm font-medium truncate">{folder.name}</span>
                    </div>
                  ))}

                  {/* Files */}
                  {filteredFiles.map((file) => {
                    const isSelected = selectedFiles.some(f => f.id === file.id);
                    return (
                      <div
                        key={file.id}
                        className={cn(
                          "cursor-pointer rounded-lg border p-3 transition-colors relative",
                          viewMode === "list" && "flex items-center gap-3",
                          isSelected ? "border-primary bg-primary/10" : "hover:bg-accent"
                        )}
                        onClick={() => toggleFileSelection(file)}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        
                        {file.thumbnailLink ? (
                          <img 
                            src={file.thumbnailLink} 
                            alt={file.name}
                            className={cn(
                              "object-cover rounded",
                              viewMode === "grid" ? "w-full h-20 mb-2" : "w-12 h-12"
                            )}
                          />
                        ) : (
                          getFileIcon(file.mimeType)
                        )}
                        
                        <div className={cn(viewMode === "list" && "flex-1")}>
                          <span className="text-sm font-medium truncate block">{file.name}</span>
                          {file.size && (
                            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredFiles.length === 0 && filteredFolders.length === 0 && (
                    <div className="col-span-4 text-center py-8 text-muted-foreground">
                      Không có file nào
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="flex-1">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Kéo thả file vào đây</p>
              <p className="text-sm text-muted-foreground mb-4">hoặc click để chọn file</p>
              <label>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                  accept={accept === "image" ? "image/*" : 
                         accept === "video" ? "video/*" :
                         accept === "audio" ? "audio/*" : undefined}
                />
                <Button disabled={uploading} asChild>
                  <span>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang upload...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Chọn Files
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer with selection info */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedFiles.length > 0 ? (
              <>Đã chọn: <strong>{selectedFiles.length}</strong> file(s)</>
            ) : (
              "Chưa chọn file nào"
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Hủy
            </Button>
            <Button 
              onClick={confirmSelection} 
              disabled={selectedFiles.length === 0}
            >
              <Check className="mr-2 h-4 w-4" />
              Chọn ({selectedFiles.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaLibrary;
