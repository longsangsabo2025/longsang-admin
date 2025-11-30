import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus,
  Save,
  Share2,
  MoreHorizontal,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  CheckSquare,
  Image,
  Code,
  Quote,
  Minus,
  Table,
  Calendar,
  Link,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileText,
  Folder,
  Search,
  Star,
  Clock,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  author: string;
  status: "draft" | "published" | "archived";
  tags: string[];
  starred?: boolean;
}

interface Block {
  id: string;
  type: "heading1" | "heading2" | "heading3" | "paragraph" | "list" | "checklist" | "image" | "code" | "quote" | "divider";
  content: string;
  metadata?: any;
}

const AdminDocumentEditor = () => {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: "1",
      type: "heading1", 
      content: "Welcome to Document Editor"
    },
    {
      id: "2",
      type: "paragraph",
      content: "This is a Notion-like editor for creating and managing documents. You can add different types of blocks to build rich content."
    }
  ]);

  // Mock documents
  const documents: Document[] = [
    {
      id: "1",
      title: "AI Strategy Documentation",
      content: "Complete guide to AI implementation...",
      lastModified: "2 hours ago",
      author: "Admin",
      status: "draft",
      tags: ["AI", "Strategy", "Documentation"],
      starred: true
    },
    {
      id: "2",
      title: "Client Onboarding Process",
      content: "Step-by-step client onboarding workflow...",
      lastModified: "1 day ago", 
      author: "Admin",
      status: "published",
      tags: ["Process", "Client", "Workflow"]
    },
    {
      id: "3",
      title: "Marketing Campaign Ideas",
      content: "Creative ideas for upcoming campaigns...",
      lastModified: "3 days ago",
      author: "Admin", 
      status: "draft",
      tags: ["Marketing", "Ideas", "Campaign"]
    },
    {
      id: "4",
      title: "Technical Architecture Notes",
      content: "System architecture and technical decisions...",
      lastModified: "1 week ago",
      author: "Admin",
      status: "published", 
      tags: ["Technical", "Architecture", "Notes"],
      starred: true
    }
  ];

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const addBlock = (type: Block["type"]) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: "",
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, content } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
  };

  const renderBlock = (block: Block) => {
    const handleContentChange = (content: string) => {
      updateBlock(block.id, content);
    };

    switch (block.type) {
      case "heading1":
        return (
          <Input
            value={block.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Heading 1"
            className="text-3xl font-bold border-none shadow-none px-0 focus-visible:ring-0"
          />
        );
      case "heading2":
        return (
          <Input
            value={block.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Heading 2"
            className="text-2xl font-semibold border-none shadow-none px-0 focus-visible:ring-0"
          />
        );
      case "heading3":
        return (
          <Input
            value={block.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Heading 3"
            className="text-xl font-medium border-none shadow-none px-0 focus-visible:ring-0"
          />
        );
      case "paragraph":
        return (
          <Textarea
            value={block.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Write something..."
            className="border-none shadow-none px-0 focus-visible:ring-0 resize-none"
            rows={3}
          />
        );
      case "code":
        return (
          <Textarea
            value={block.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Enter code..."
            className="font-mono bg-gray-100 border border-gray-200 rounded-md"
            rows={4}
          />
        );
      case "quote":
        return (
          <div className="border-l-4 border-gray-300 pl-4">
            <Textarea
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter quote..."
              className="border-none shadow-none px-0 focus-visible:ring-0 resize-none italic"
              rows={2}
            />
          </div>
        );
      case "divider":
        return <hr className="border-t-2 border-gray-200 my-4" />;
      default:
        return (
          <Input
            value={block.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Enter text..."
            className="border-none shadow-none px-0 focus-visible:ring-0"
          />
        );
    }
  };

  if (selectedDoc) {
    return (
      <div className="space-y-6">
        {/* Editor Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedDoc(null)}>
            ← Back to Documents
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Main Editor */}
          <Card>
            <CardHeader>
              <Input
                value={selectedDoc.title}
                className="text-2xl font-bold border-none shadow-none px-0 focus-visible:ring-0"
                placeholder="Untitled Document"
              />
              <div className="flex items-center gap-2">
                {selectedDoc.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-1 p-2 border rounded-md">
                <Button variant="ghost" size="sm">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Underline className="h-4 w-4" />
                </Button>
                
                <div className="w-px h-6 bg-border mx-1" />
                
                <Button variant="ghost" size="sm">
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <AlignRight className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Block
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => addBlock("heading1")} className="gap-2">
                      <Heading1 className="h-4 w-4" />
                      Heading 1
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addBlock("heading2")} className="gap-2">
                      <Heading2 className="h-4 w-4" />
                      Heading 2
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addBlock("heading3")} className="gap-2">
                      <Heading3 className="h-4 w-4" />
                      Heading 3
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addBlock("paragraph")} className="gap-2">
                      <Type className="h-4 w-4" />
                      Paragraph
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => addBlock("code")} className="gap-2">
                      <Code className="h-4 w-4" />
                      Code Block
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addBlock("quote")} className="gap-2">
                      <Quote className="h-4 w-4" />
                      Quote
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addBlock("divider")} className="gap-2">
                      <Minus className="h-4 w-4" />
                      Divider
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Content Blocks */}
              <div className="space-y-4">
                {blocks.map((block, index) => (
                  <div key={block.id} className="group relative">
                    <div className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => deleteBlock(block.id)} className="text-red-600">
                            Delete Block
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {renderBlock(block)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Document Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Document Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={getStatusColor(selectedDoc.status)}>
                    {selectedDoc.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Author</span>
                  <span>{selectedDoc.author}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modified</span>
                  <span>{selectedDoc.lastModified}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Words</span>
                  <span>1,247</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Share2 className="h-4 w-4" />
                  Share Link
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  Export PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Create and manage your documents</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-2xl">{documents.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-2xl">
              {documents.filter(d => d.status === "published").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
            <CardTitle className="text-2xl">
              {documents.filter(d => d.status === "draft").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Starred</CardDescription>
            <CardTitle className="text-2xl">
              {documents.filter(d => d.starred).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Documents List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedDoc(doc)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">{doc.title}</CardTitle>
                    {doc.starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                  </div>
                  <CardDescription className="line-clamp-3">{doc.content}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {doc.lastModified}
                      </span>
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="published">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.filter(doc => doc.status === "published").map((doc) => (
              <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedDoc(doc)}>
                <CardHeader>
                  <CardTitle className="text-lg">{doc.title}</CardTitle>
                  <CardDescription>{doc.content}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="draft">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.filter(doc => doc.status === "draft").map((doc) => (
              <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedDoc(doc)}>
                <CardHeader>
                  <CardTitle className="text-lg">{doc.title}</CardTitle>
                  <CardDescription>{doc.content}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="starred">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.filter(doc => doc.starred).map((doc) => (
              <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedDoc(doc)}>
                <CardHeader>
                  <CardTitle className="text-lg">{doc.title}</CardTitle>
                  <CardDescription>{doc.content}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDocumentEditor;