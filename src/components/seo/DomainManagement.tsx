import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit, Globe, Check, X, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Domain {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  autoIndex: boolean;
  googleApiKey?: string;
  bingApiKey?: string;
  totalUrls: number;
  indexedUrls: number;
  lastUpdated: string;
}

export function DomainManagement() {
  const { toast } = useToast();
  const [domains, setDomains] = useState<Domain[]>([
    {
      id: "1",
      name: "SABO Arena",
      url: "https://saboarena.com",
      enabled: true,
      autoIndex: true,
      totalUrls: 310,
      indexedUrls: 0,
      lastUpdated: "2025-11-11T20:18:00Z"
    },
    {
      id: "2",
      name: "Long Sang Forge",
      url: "https://longsang.ai",
      enabled: true,
      autoIndex: false,
      totalUrls: 0,
      indexedUrls: 0,
      lastUpdated: "2025-11-11T20:18:00Z"
    }
  ]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [newDomain, setNewDomain] = useState({
    name: "",
    url: "",
    googleApiKey: "",
    bingApiKey: ""
  });

  const handleAddDomain = () => {
    if (!newDomain.name || !newDomain.url) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên và URL domain",
        variant: "destructive"
      });
      return;
    }

    const domain: Domain = {
      id: Date.now().toString(),
      name: newDomain.name,
      url: newDomain.url,
      enabled: true,
      autoIndex: true,
      googleApiKey: newDomain.googleApiKey,
      bingApiKey: newDomain.bingApiKey,
      totalUrls: 0,
      indexedUrls: 0,
      lastUpdated: new Date().toISOString()
    };

    setDomains([...domains, domain]);
    setNewDomain({ name: "", url: "", googleApiKey: "", bingApiKey: "" });
    setIsAddDialogOpen(false);
    
    toast({
      title: "✅ Thành công",
      description: `Đã thêm domain ${domain.name}`
    });
  };

  const handleToggleEnabled = (id: string) => {
    setDomains(domains.map(d => 
      d.id === id ? { ...d, enabled: !d.enabled } : d
    ));
    
    toast({
      title: "Đã cập nhật",
      description: "Trạng thái domain đã được thay đổi"
    });
  };

  const handleToggleAutoIndex = (id: string) => {
    setDomains(domains.map(d => 
      d.id === id ? { ...d, autoIndex: !d.autoIndex } : d
    ));
    
    toast({
      title: "Đã cập nhật",
      description: "Cài đặt tự động indexing đã được thay đổi"
    });
  };

  const handleDeleteDomain = (id: string) => {
    setDomains(domains.filter(d => d.id !== id));
    toast({
      title: "Đã xóa",
      description: "Domain đã được xóa khỏi hệ thống"
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Quản Lý Domains
            </CardTitle>
            <CardDescription>
              Thêm và quản lý các domains cần SEO automation
            </CardDescription>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Thêm Domain
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Thêm Domain Mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin domain và API keys để bắt đầu SEO automation
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Tên Domain</Label>
                  <Input
                    id="name"
                    placeholder="SABO Arena"
                    value={newDomain.name}
                    onChange={(e) => setNewDomain({...newDomain, name: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    placeholder="https://saboarena.com"
                    value={newDomain.url}
                    onChange={(e) => setNewDomain({...newDomain, url: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="googleKey">Google API Service Account JSON (Optional)</Label>
                  <Input
                    id="googleKey"
                    placeholder="Paste JSON hoặc để trống"
                    value={newDomain.googleApiKey}
                    onChange={(e) => setNewDomain({...newDomain, googleApiKey: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Để trống nếu muốn dùng API key chung của hệ thống
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="bingKey">Bing Webmaster API Key (Optional)</Label>
                  <Input
                    id="bingKey"
                    placeholder="Bing API key hoặc để trống"
                    value={newDomain.bingApiKey}
                    onChange={(e) => setNewDomain({...newDomain, bingApiKey: e.target.value})}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleAddDomain}>Thêm Domain</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>URLs</TableHead>
              <TableHead>Indexed</TableHead>
              <TableHead>Auto Index</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map((domain) => (
              <TableRow key={domain.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="font-medium flex items-center gap-2">
                      {domain.name}
                      <a 
                        href={domain.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-xs text-muted-foreground">{domain.url}</div>
                  </div>
                </TableCell>
                <TableCell>{domain.totalUrls}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {domain.indexedUrls}
                    <Badge variant="secondary" className="text-xs">
                      {domain.totalUrls > 0 
                        ? Math.round((domain.indexedUrls / domain.totalUrls) * 100) 
                        : 0}%
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={domain.autoIndex}
                    onCheckedChange={() => handleToggleAutoIndex(domain.id)}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={domain.enabled ? "default" : "secondary"}>
                    {domain.enabled ? "Hoạt động" : "Tắt"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleEnabled(domain.id)}
                    >
                      {domain.enabled ? (
                        <X className="w-4 h-4 text-red-500" />
                      ) : (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingDomain(domain)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDomain(domain.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {domains.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có domain nào. Nhấn "Thêm Domain" để bắt đầu.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
