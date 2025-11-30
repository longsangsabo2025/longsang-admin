import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDriveOperations, DriveFile } from '@/lib/google-drive/hooks';
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AdminFileManager = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  const driveOps = useDriveOperations();

  // Load files from Google Drive
  const loadFiles = async () => {
    if (!driveOps.isAvailable) {
      console.warn('Google Drive not available, using mock data');
      // Keep mock data for demo
      setFiles([
        {
          id: '1',
          name: 'AI Workflows Documentation',
          type: 'folder',
          mimeType: 'application/vnd.google-apps.folder',
          modifiedTime: '2 hours ago',
          starred: true,
        },
        {
          id: '4',
          name: 'AI_Strategy_2025.pdf',
          type: 'file',
          mimeType: 'application/pdf',
          fileType: 'document',
          size: '2.4 MB',
          modifiedTime: '5 minutes ago',
          starred: true,
        },
      ] as DriveFile[]);
      return;
    }

    setLoading(true);
    try {
      const driveFiles = await driveOps.listFiles();
      setFiles(driveFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !driveOps.isAvailable) return;

    setUploadingFile(file);
    try {
      await driveOps.uploadFile(file);
      await loadFiles(); // Refresh list
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingFile(null);
      event.target.value = ''; // Reset input
    }
  };

  // Handle create folder
  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName || !driveOps.isAvailable) return;

    try {
      await driveOps.createFolder(folderName);
      await loadFiles(); // Refresh list
    } catch (error) {
      console.error('Create folder failed:', error);
    }
  };

  // Handle file actions
  const handleDownload = async (file: DriveFile) => {
    if (!driveOps.isAvailable) return;
    try {
      await driveOps.downloadFile(file.id, file.name);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = async (file: DriveFile) => {
    if (!confirm(`Delete "${file.name}"?`) || !driveOps.isAvailable) return;

    try {
      await driveOps.deleteFile(file.id);
      await loadFiles(); // Refresh list
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleToggleStar = async (file: DriveFile) => {
    if (!driveOps.isAvailable) return;

    try {
      await driveOps.toggleStar(file.id, !file.starred);
      await loadFiles(); // Refresh list
    } catch (error) {
      console.error('Toggle star failed:', error);
    }
  };

  // Search files
  const handleSearch = async () => {
    if (!searchQuery || !driveOps.isAvailable) {
      await loadFiles();
      return;
    }

    setLoading(true);
    try {
      const searchResults = await driveOps.searchFiles(searchQuery);
      setFiles(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        handleSearch();
      } else {
        loadFiles();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Mock data fallback
  const mockFiles: DriveFile[] = [
    {
      id: '1',
      name: 'AI Workflows Documentation',
      type: 'folder',
      modified: '2 hours ago',
      owner: 'Admin',
      starred: true,
    },
    {
      id: '2',
      name: 'Client Projects',
      type: 'folder',
      modified: '1 day ago',
      owner: 'Admin',
    },
    {
      id: '3',
      name: 'Marketing Assets',
      type: 'folder',
      modified: '3 days ago',
      owner: 'Admin',
    },
    {
      id: '4',
      name: 'AI_Strategy_2025.pdf',
      type: 'file',
      fileType: 'document',
      size: '2.4 MB',
      modified: '5 minutes ago',
      owner: 'Admin',
      starred: true,
    },
    {
      id: '5',
      name: 'automation_demo.mp4',
      type: 'file',
      fileType: 'video',
      size: '45.2 MB',
      modified: '1 hour ago',
      owner: 'Admin',
    },
    {
      id: '6',
      name: 'logo_variations.png',
      type: 'file',
      fileType: 'image',
      size: '1.8 MB',
      modified: '2 days ago',
      owner: 'Admin',
      thumbnail: '/api/placeholder/150/150',
    },
    {
      id: '7',
      name: 'meeting_notes.md',
      type: 'file',
      fileType: 'document',
      size: '24 KB',
      modified: '3 hours ago',
      owner: 'Admin',
    },
  ];

  const getFileIcon = (item: DriveFile) => {
    if (item.type === 'folder') return <Folder className="h-8 w-8 text-blue-600" />;

    switch (item.fileType) {
      case 'image':
        return <Image className="h-8 w-8 text-green-600" />;
      case 'document':
        return <FileText className="h-8 w-8 text-red-600" />;
      case 'video':
        return <Video className="h-8 w-8 text-purple-600" />;
      case 'audio':
        return <Music className="h-8 w-8 text-orange-600" />;
      default:
        return <File className="h-8 w-8 text-gray-600" />;
    }
  };

  const displayFiles = files.length > 0 ? files : mockFiles;

  const FileCard = ({ file }: { file: DriveFile }) => (
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
                <DropdownMenuItem className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-red-600">
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
            {file.size && <p className="text-xs text-muted-foreground">{file.size}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const FileRow = ({ file }: { file: FileItem }) => (
    <div className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {file.thumbnail ? (
          <img src={file.thumbnail} alt={file.name} className="h-8 w-8 rounded object-cover" />
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

      <div className="hidden md:block text-sm text-muted-foreground min-w-0">{file.modified}</div>

      <div className="hidden md:block text-sm text-muted-foreground min-w-0">
        {file.size || '—'}
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
          <DropdownMenuItem className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-red-600">
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">File Manager</h1>
          <p className="text-muted-foreground">Manage your files and documents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>
          <Button variant="outline" className="gap-2">
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
            <CardTitle className="text-2xl">247</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Size</CardDescription>
            <CardTitle className="text-2xl">2.4 GB</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Shared Files</CardDescription>
            <CardTitle className="text-2xl">18</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recent Uploads</CardDescription>
            <CardTitle className="text-2xl">12</CardTitle>
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
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
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
          {viewMode === 'grid' ? (
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
              .filter((file) => file.starred)
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

export default AdminFileManager;
