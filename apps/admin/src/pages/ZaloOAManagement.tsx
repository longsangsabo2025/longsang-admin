/**
 * =================================================================
 * ZALO OA MANAGEMENT - Quản lý Zalo Official Account
 * =================================================================
 * Dashboard quản lý Zalo OA cho SABO Billiards
 * - Xem thông tin OA
 * - Quản lý danh sách khách hàng
 * - Gửi tin nhắn xin đánh giá
 * - Xem lịch sử gửi
 */

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  Star,
  Send,
  RefreshCw,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Settings,
  Download,
  Search,
  UserPlus,
  History,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useScrollRestore, usePersistedState } from '@/hooks/usePersistedState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

import { getZaloOAService } from '@/services/zalo-oa.service';
import type {
  ZaloCustomer,
  ZaloOAInfo,
  ZaloOAStats,
  ReviewRequestBatch,
  ReviewRequestStatus,
} from '@/types/zalo-oa';

// Status badge component
const StatusBadge = ({ status }: { status: ZaloCustomer['status'] }) => {
  const variants = {
    pending: { label: 'Chưa gửi', variant: 'secondary' as const, icon: Clock },
    contacted: { label: 'Đã liên hệ', variant: 'default' as const, icon: MessageSquare },
    reviewed: { label: 'Đã đánh giá', variant: 'default' as const, icon: CheckCircle2 },
    not_following: { label: 'Chưa follow', variant: 'destructive' as const, icon: XCircle },
  };
  
  const config = variants[status] || variants.pending;
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

export const ZaloOAManagement = () => {
  useScrollRestore('zalo-oa-management');
  const [activeTab, setActiveTab] = usePersistedState('zalo-oa-tab', 'dashboard');
  
  const { toast } = useToast();
  const service = getZaloOAService();
  
  // State
  const [oaInfo, setOaInfo] = useState<ZaloOAInfo | null>(null);
  const [stats, setStats] = useState<ZaloOAStats | null>(null);
  const [customers, setCustomers] = useState<ZaloCustomer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [batchHistory, setBatchHistory] = useState<ReviewRequestBatch[]>([]);
  
  // Add customer dialog
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  
  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load OA info
      const oaResult = await service.getOAInfo();
      if (oaResult.error === 0 && oaResult.data) {
        setOaInfo(oaResult.data);
      }
      
      // Load stats
      const statsResult = await service.getStats();
      setStats(statsResult);
      
      // Load customers from Supabase
      const customerList = await service.getCustomers();
      setCustomers(customerList);
      
      // Load batch history from Supabase
      const history = await service.getBatchHistory();
      setBatchHistory(history.map(h => ({
        id: h.id,
        createdAt: h.createdAt,
        totalCustomers: h.totalCount,
        successCount: h.successCount,
        failedCount: h.failedCount,
        pendingCount: 0,
        results: [],
      })));
      
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Lỗi tải dữ liệu',
        description: 'Không thể tải dữ liệu từ Zalo OA',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  
  // Toggle customer selection
  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  };
  
  // Select all filtered customers
  const toggleSelectAll = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
    }
  };
  
  // Send review requests
  const sendReviewRequests = async () => {
    if (selectedCustomers.size === 0) {
      toast({
        title: 'Chưa chọn khách hàng',
        description: 'Vui lòng chọn ít nhất 1 khách hàng để gửi tin nhắn',
        variant: 'destructive',
      });
      return;
    }
    
    const customersToSend = customers.filter(c => selectedCustomers.has(c.id));
    
    setIsSending(true);
    setSendProgress(0);
    
    try {
      let processed = 0;
      
      const batch = await service.batchSendReviewRequests(
        customersToSend,
        (status: ReviewRequestStatus) => {
          processed++;
          setSendProgress((processed / customersToSend.length) * 100);
          
          // Show toast for each result
          if (status.status === 'success') {
            toast({
              title: `✅ ${status.customerName}`,
              description: 'Đã gửi tin nhắn thành công',
            });
          }
        }
      );
      
      // Reload data
      await loadData();
      setSelectedCustomers(new Set());
      
      toast({
        title: '🎉 Hoàn thành!',
        description: `Đã gửi ${batch.successCount}/${batch.totalCustomers} tin nhắn thành công`,
      });
      
    } catch (error) {
      toast({
        title: 'Lỗi gửi tin nhắn',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
      setSendProgress(0);
    }
  };
  
  // Add new customer
  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập đầy đủ tên và số điện thoại',
        variant: 'destructive',
      });
      return;
    }
    
    const result = await service.addCustomer({
      name: newCustomer.name,
      phone: newCustomer.phone,
    });
    
    if (result) {
      const customerList = await service.getCustomers();
      setCustomers(customerList);
      setNewCustomer({ name: '', phone: '' });
      setShowAddCustomer(false);
      
      toast({
        title: '✅ Đã thêm khách hàng',
        description: `${newCustomer.name} đã được thêm vào danh sách`,
      });
    } else {
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm khách hàng. Có thể số điện thoại đã tồn tại.',
        variant: 'destructive',
      });
    }
  };
  
  // Export customers to CSV
  const exportToCSV = () => {
    const csv = [
      ['STT', 'Tên', 'Số điện thoại', 'Trạng thái', 'Link Zalo'].join(','),
      ...customers.map((c, i) => [
        i + 1,
        `"${c.name}"`,
        c.phone,
        c.status,
        `https://zalo.me/${c.phone.replace(/^0/, '84')}`,
      ].join(',')),
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sabo-customers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: '📥 Đã xuất file CSV',
      description: 'File đã được tải về máy',
    });
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            Zalo OA Management
          </h1>
          <p className="text-muted-foreground">
            Quản lý Zalo Official Account - SABO Billiards
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Xuất CSV
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người theo dõi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFollowers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {oaInfo?.name || 'SABO Billiards'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              {customers.filter(c => c.status === 'pending').length} chờ gửi
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã gửi review</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.status === 'reviewed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                (customers.filter(c => c.status === 'reviewed').length / customers.length) * 100
              ) || 0}% hoàn thành
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ thành công</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.successRate ? `${Math.round(stats.successRate * 100)}%` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Tin nhắn gửi thành công
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">
            <MessageSquare className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="w-4 h-4 mr-2" />
            Khách hàng ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="send">
            <Send className="w-4 h-4 mr-2" />
            Gửi tin nhắn
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            Lịch sử
          </TabsTrigger>
        </TabsList>
        
        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OA Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  Thông tin Zalo OA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    🎱
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{oaInfo?.name || 'SABO Billiards'}</h3>
                    <p className="text-sm text-muted-foreground">
                      ID: {oaInfo?.oa_id || '3494355851305108700'}
                    </p>
                    <Badge variant={oaInfo?.is_verified ? 'default' : 'secondary'}>
                      {oaInfo?.package_name || 'Gói Dùng Thử'}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Người theo dõi</p>
                    <p className="text-2xl font-bold">{oaInfo?.num_follower || 10}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                    <Badge variant="default" className="bg-green-500">Hoạt động</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Thao tác nhanh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  onClick={() => setActiveTab('send')}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Gửi yêu cầu đánh giá
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowAddCustomer(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Thêm khách hàng mới
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={exportToCSV}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Xuất danh sách CSV
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <a href="https://oa.zalo.me" target="_blank" rel="noopener noreferrer">
                    <Settings className="w-4 h-4 mr-2" />
                    Mở Zalo OA Admin
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
              <CardDescription>
                Các tin nhắn đã gửi gần đây
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batchHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có hoạt động nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {batchHistory.slice(0, 5).map(batch => (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          Gửi {batch.totalCustomers} tin nhắn
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(batch.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-500">
                          {batch.successCount} thành công
                        </Badge>
                        {batch.failedCount > 0 && (
                          <Badge variant="destructive">
                            {batch.failedCount} thất bại
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chưa gửi</SelectItem>
                <SelectItem value="contacted">Đã liên hệ</SelectItem>
                <SelectItem value="reviewed">Đã đánh giá</SelectItem>
                <SelectItem value="not_following">Chưa follow</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Thêm khách hàng
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm khách hàng mới</DialogTitle>
                  <DialogDescription>
                    Nhập thông tin khách hàng để thêm vào danh sách
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tên khách hàng</Label>
                    <Input
                      placeholder="VD: Nguyễn Văn A"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <Input
                      placeholder="VD: 0909123456"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddCustomer(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleAddCustomer}>
                    Thêm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Customer Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            filteredCustomers.length > 0 &&
                            selectedCustomers.size === filteredCustomers.length
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-12">STT</TableHead>
                      <TableHead>Tên khách hàng</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer, index) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCustomers.has(customer.id)}
                            onCheckedChange={() => toggleCustomerSelection(customer.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {customer.name}
                        </TableCell>
                        <TableCell>
                          <a
                            href={`https://zalo.me/${customer.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {customer.phone}
                          </a>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={customer.status} />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            title={`Mở Zalo chat với ${customer.name}`}
                          >
                            <a
                              href={`https://zalo.me/${customer.phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Chat với ${customer.name}`}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* Selection Summary */}
          {selectedCustomers.size > 0 && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">
                    Đã chọn {selectedCustomers.size} khách hàng
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCustomers(new Set())}
                  >
                    Bỏ chọn tất cả
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab('send')}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Gửi tin nhắn
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Send Tab */}
        <TabsContent value="send" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Message Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Xem trước tin nhắn</CardTitle>
                <CardDescription>
                  Tin nhắn sẽ được gửi đến khách hàng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      🎱
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                      <p className="text-sm whitespace-pre-line">
                        🎱 Xin chào [Tên khách hàng]!{'\n\n'}
                        Cảm ơn bạn đã đến chơi tại SABO Billiards!{'\n\n'}
                        ⭐ Nếu hài lòng với dịch vụ, xin bạn dành 30 giây đánh giá 5 sao cho SABO nhé!{'\n\n'}
                        Mỗi đánh giá của bạn giúp SABO phục vụ tốt hơn! ❤️
                      </p>
                      
                      <div className="mt-3 space-y-2">
                        <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">
                          ⭐ Đánh giá 5 sao
                        </Button>
                        <Button variant="outline" className="w-full">
                          📍 Xem trên Maps
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Send Action */}
            <Card>
              <CardHeader>
                <CardTitle>Gửi tin nhắn xin đánh giá</CardTitle>
                <CardDescription>
                  Chọn khách hàng và gửi tin nhắn hàng loạt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold">Đã chọn</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {selectedCustomers.size}
                    <span className="text-lg font-normal text-muted-foreground ml-2">
                      khách hàng
                    </span>
                  </p>
                </div>
                
                {selectedCustomers.size === 0 ? (
                  <div className="text-center py-6">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Vui lòng chọn khách hàng trong tab "Khách hàng"
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setActiveTab('customers')}
                    >
                      Đi đến danh sách khách hàng
                    </Button>
                  </div>
                ) : (
                  <>
                    {isSending && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Đang gửi...</span>
                          <span>{Math.round(sendProgress)}%</span>
                        </div>
                        <Progress value={sendProgress} />
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={sendReviewRequests}
                        disabled={isSending}
                      >
                        {isSending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Gửi tin nhắn ({selectedCustomers.size})
                          </>
                        )}
                      </Button>
                      
                      <p className="text-xs text-muted-foreground text-center">
                        ⚠️ Mỗi tin nhắn cách nhau 2 giây để tránh bị khóa
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử gửi tin nhắn</CardTitle>
              <CardDescription>
                Xem lại các đợt gửi tin nhắn đã thực hiện
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batchHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Chưa có lịch sử</h3>
                  <p className="text-muted-foreground">
                    Lịch sử gửi tin nhắn sẽ hiển thị ở đây
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {batchHistory.map(batch => (
                    <Card key={batch.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">
                              Đợt gửi #{batch.id.split('_')[1]}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(batch.createdAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {batch.successCount}
                            </Badge>
                            {batch.failedCount > 0 && (
                              <Badge variant="destructive">
                                <XCircle className="w-3 h-3 mr-1" />
                                {batch.failedCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <Progress
                          value={(batch.successCount / batch.totalCustomers) * 100}
                          className="mb-2"
                        />
                        
                        <p className="text-sm text-muted-foreground">
                          {batch.successCount} / {batch.totalCustomers} tin nhắn gửi thành công
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ZaloOAManagement;
