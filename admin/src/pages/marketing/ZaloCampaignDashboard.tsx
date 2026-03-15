/**
 * =================================================================
 * ZALO CAMPAIGN DASHBOARD - Warm Up Cold Customers
 * =================================================================
 * UI quản lý chiến dịch làm nóng khách hàng cold
 */

import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  Gift,
  MousePointer,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Send,
  Target,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

import { getZaloCampaignService } from '@/services/zalo-campaign.service';
import { getZaloOAService } from '@/services/zalo-oa.service';
import type {
  Campaign,
  CampaignStats,
  CampaignTarget,
  MessageTemplate,
  Voucher,
  WarmUpConfig,
} from '@/types/zalo-campaign';

// Status badge component
const CampaignStatusBadge = ({ status }: { status: Campaign['status'] }) => {
  const config = {
    draft: { label: 'Nháp', variant: 'secondary' as const, icon: Clock },
    scheduled: { label: 'Đã lên lịch', variant: 'outline' as const, icon: Calendar },
    running: { label: 'Đang chạy', variant: 'default' as const, icon: Play },
    paused: { label: 'Tạm dừng', variant: 'secondary' as const, icon: Pause },
    completed: { label: 'Hoàn thành', variant: 'default' as const, icon: CheckCircle2 },
    cancelled: { label: 'Đã hủy', variant: 'destructive' as const, icon: XCircle },
  };

  const { label, variant, icon: Icon } = config[status] || config.draft;

  return (
    <Badge variant={variant} className="flex items-center gap-1 w-fit">
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
};

// Helper function for target status badge variant
const getTargetStatusVariant = (
  status: string
): 'default' | 'destructive' | 'secondary' | 'outline' => {
  switch (status) {
    case 'sent':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'skipped':
      return 'secondary';
    default:
      return 'outline';
  }
};

// Stats card component
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'text-primary',
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color?: string;
  trend?: number;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {trend !== undefined && (
            <TrendingUp className={`w-3 h-3 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          )}
          {subtitle}
        </p>
      )}
    </CardContent>
  </Card>
);

export const ZaloCampaignDashboard = () => {
  const { toast } = useToast();
  const campaignService = getZaloCampaignService();
  const zaloService = getZaloOAService();

  // State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [targets, setTargets] = useState<CampaignTarget[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);

  // Create campaign dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [warmUpConfig, setWarmUpConfig] = useState<WarmUpConfig>({
    campaignName: `🔥 Warm Up - ${new Date().toLocaleDateString('vi-VN')}`,
    voucherValue: 30,
    voucherValidDays: 14,
    messageDelay: 3000,
    autoReminder: true,
    reminderDays: 3,
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [campaignList, templateList] = await Promise.all([
        campaignService.getCampaigns(),
        campaignService.getMessageTemplates(),
      ]);
      setCampaigns(campaignList);
      // Templates for message sending
      if (templateList.length > 0) setTemplates(templateList);

      // Auto-select first campaign
      if (campaignList.length > 0 && !selectedCampaign) {
        await selectCampaign(campaignList[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCampaign = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);

    const [stats, targetList, voucherList] = await Promise.all([
      campaignService.getCampaignStats(campaign.id),
      campaignService.getCampaignTargets(campaign.id),
      campaignService.getVouchers(campaign.id),
    ]);

    setCampaignStats(stats);
    setTargets(targetList);
    setVouchers(voucherList);
  };

  // Create warm-up campaign
  const handleCreateCampaign = async () => {
    setIsLoading(true);
    try {
      const result = await campaignService.createWarmUpCampaign(warmUpConfig);

      if (result) {
        toast({
          title: '🎉 Tạo chiến dịch thành công!',
          description: `${result.targetCount} khách hàng cold đã được thêm vào chiến dịch`,
        });
        setShowCreateDialog(false);
        await loadData();
        await selectCampaign(result.campaign);
      } else {
        throw new Error('Failed to create campaign');
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo chiến dịch',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Prepare message from template
  const prepareMessage = (
    template: MessageTemplate | null,
    customerName: string,
    voucher: Voucher | undefined
  ) => {
    let message =
      template?.content ||
      'Chào {name}! Bạn nhận được voucher {voucher_value} phút miễn phí tại SABO. Mã: {voucher_code}';
    message = message.replace('{name}', customerName);
    message = message.replace('{voucher_value}', voucher?.value?.toString() || '30');
    message = message.replace('{voucher_code}', voucher?.code || 'SABO2024');
    message = message.replace(
      '{expiry_date}',
      voucher ? new Date(voucher.validUntil).toLocaleDateString('vi-VN') : ''
    );
    return message;
  };

  // Helper: Send single message to target
  const sendToTarget = async (
    target: CampaignTarget,
    template: MessageTemplate | null,
    voucher: Voucher | undefined
  ): Promise<{ success: boolean }> => {
    if (!target.customer?.zaloUserId) {
      await campaignService.updateTargetStatus(target.id, 'skipped', undefined, 'Chưa follow OA');
      return { success: false };
    }

    const message = prepareMessage(template, target.customer.name, voucher);
    const result = await zaloService.sendMessage(target.customer.zaloUserId, message);

    if (result.error === 0) {
      await campaignService.updateTargetStatus(target.id, 'sent', result.data?.message_id);
      return { success: true };
    }

    await campaignService.updateTargetStatus(target.id, 'failed', undefined, result.message);
    return { success: false };
  };

  // Start campaign - send messages
  const handleStartCampaign = async () => {
    if (!selectedCampaign) return;

    const pendingTargets = targets.filter((t) => t.status === 'pending' && t.customer?.zaloUserId);

    if (pendingTargets.length === 0) {
      toast({
        title: 'Không có khách hàng để gửi',
        description: 'Tất cả khách hàng chưa follow OA hoặc đã được gửi rồi',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    setSendProgress(0);
    await campaignService.updateCampaignStatus(selectedCampaign.id, 'running');

    const voucher = vouchers[0];
    const template = templates.find((t) => t.templateType === 'warmup_voucher') || null;
    let successCount = 0;

    for (let i = 0; i < pendingTargets.length; i++) {
      try {
        const result = await sendToTarget(pendingTargets[i], template, voucher);
        if (result.success) successCount++;
      } catch {
        await campaignService.updateTargetStatus(
          pendingTargets[i].id,
          'failed',
          undefined,
          'Lỗi hệ thống'
        );
      }

      setSendProgress(((i + 1) / pendingTargets.length) * 100);

      if (i < pendingTargets.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, selectedCampaign.delayBetweenMessages));
      }
    }

    await campaignService.updateCampaignStatus(selectedCampaign.id, 'completed');

    toast({
      title: '🎉 Hoàn thành!',
      description: `Đã gửi ${successCount}/${pendingTargets.length} tin nhắn thành công`,
    });

    setIsSending(false);
    setSendProgress(0);
    await selectCampaign(selectedCampaign);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Flame className="w-8 h-8 text-orange-500" />
            Warm Up Campaign
          </h1>
          <p className="text-muted-foreground">
            Chiến dịch làm nóng khách hàng cold - SABO Billiards
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo chiến dịch mới
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Campaign List - Left */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Chiến dịch</CardTitle>
            <CardDescription>{campaigns.length} chiến dịch</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 p-4">
                {campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedCampaign?.id === campaign.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => selectCampaign(campaign)}
                  >
                    <div className="font-medium truncate">{campaign.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <CampaignStatusBadge status={campaign.status} />
                      <span className="text-xs text-muted-foreground">
                        {campaign.totalTargets} KH
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Campaign Details - Right */}
        <div className="lg:col-span-3 space-y-6">
          {selectedCampaign ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Tổng khách hàng"
                  value={campaignStats?.totalTargets || 0}
                  subtitle="Trong chiến dịch"
                  icon={Users}
                  color="text-blue-500"
                />
                <StatCard
                  title="Đã gửi"
                  value={campaignStats?.sent || 0}
                  subtitle={`${campaignStats?.deliveryRate.toFixed(0)}% delivery`}
                  icon={Send}
                  color="text-green-500"
                />
                <StatCard
                  title="Đã mở"
                  value={campaignStats?.opened || 0}
                  subtitle={`${campaignStats?.openRate.toFixed(0)}% open rate`}
                  icon={Eye}
                  color="text-purple-500"
                />
                <StatCard
                  title="Đã click"
                  value={campaignStats?.clicked || 0}
                  subtitle={`${campaignStats?.clickRate.toFixed(0)}% click rate`}
                  icon={MousePointer}
                  color="text-orange-500"
                />
              </div>

              {/* Campaign Info & Actions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedCampaign.name}</CardTitle>
                      <CardDescription>{selectedCampaign.description}</CardDescription>
                    </div>
                    <CampaignStatusBadge status={selectedCampaign.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress bar for running campaigns */}
                  {isSending && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Đang gửi tin nhắn...</span>
                        <span>{sendProgress.toFixed(0)}%</span>
                      </div>
                      <Progress value={sendProgress} />
                    </div>
                  )}

                  {/* Voucher Info */}
                  {vouchers.length > 0 && (
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 rounded-lg">
                      <Gift className="w-10 h-10 text-orange-500" />
                      <div>
                        <p className="font-semibold">{vouchers[0].title}</p>
                        <p className="text-sm text-muted-foreground">
                          Mã: <code className="bg-muted px-1 rounded">{vouchers[0].code}</code> •
                          Hết hạn: {new Date(vouchers[0].validUntil).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {selectedCampaign.status === 'draft' && (
                      <Button onClick={handleStartCampaign} disabled={isSending}>
                        <Play className="w-4 h-4 mr-2" />
                        Bắt đầu gửi
                      </Button>
                    )}
                    {selectedCampaign.status === 'running' && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          campaignService.updateCampaignStatus(selectedCampaign.id, 'paused')
                        }
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Tạm dừng
                      </Button>
                    )}
                    {selectedCampaign.status === 'paused' && (
                      <Button onClick={handleStartCampaign} disabled={isSending}>
                        <Play className="w-4 h-4 mr-2" />
                        Tiếp tục
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Target List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Danh sách khách hàng ({targets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tên</TableHead>
                          <TableHead>SĐT</TableHead>
                          <TableHead>Follow OA</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Thời gian</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {targets.map((target) => (
                          <TableRow key={target.id}>
                            <TableCell className="font-medium">
                              {target.customer?.name || 'N/A'}
                            </TableCell>
                            <TableCell>{target.customer?.phone}</TableCell>
                            <TableCell>
                              {target.customer?.zaloUserId ? (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Có
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Chưa
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getTargetStatusVariant(target.status)}>
                                {target.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {target.sentAt
                                ? new Date(target.sentAt).toLocaleString('vi-VN')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <Flame className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium">Chọn hoặc tạo chiến dịch</h3>
                <p className="text-muted-foreground">Bắt đầu warm-up khách hàng cold của bạn</p>
                <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo chiến dịch mới
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Tạo chiến dịch Warm Up
            </DialogTitle>
            <DialogDescription>
              Gửi voucher miễn phí để làm nóng lại khách hàng cold
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Campaign Name */}
            <div className="space-y-2">
              <Label>Tên chiến dịch</Label>
              <Input
                value={warmUpConfig.campaignName}
                onChange={(e) =>
                  setWarmUpConfig((prev) => ({ ...prev, campaignName: e.target.value }))
                }
              />
            </div>

            {/* Voucher Value */}
            <div className="space-y-2">
              <Label>Giá trị voucher (phút free)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[warmUpConfig.voucherValue]}
                  onValueChange={([v]) => setWarmUpConfig((prev) => ({ ...prev, voucherValue: v }))}
                  min={15}
                  max={60}
                  step={15}
                  className="flex-1"
                />
                <span className="font-bold text-lg w-20 text-right">
                  {warmUpConfig.voucherValue} phút
                </span>
              </div>
            </div>

            {/* Valid Days */}
            <div className="space-y-2">
              <Label>Số ngày hiệu lực voucher</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[warmUpConfig.voucherValidDays]}
                  onValueChange={([v]) =>
                    setWarmUpConfig((prev) => ({ ...prev, voucherValidDays: v }))
                  }
                  min={7}
                  max={30}
                  step={7}
                  className="flex-1"
                />
                <span className="font-bold text-lg w-20 text-right">
                  {warmUpConfig.voucherValidDays} ngày
                </span>
              </div>
            </div>

            <Separator />

            {/* Auto Reminder */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tự động nhắc nhở</Label>
                <p className="text-sm text-muted-foreground">
                  Gửi nhắc nhở trước khi voucher hết hạn
                </p>
              </div>
              <Switch
                checked={warmUpConfig.autoReminder}
                onCheckedChange={(v) => setWarmUpConfig((prev) => ({ ...prev, autoReminder: v }))}
              />
            </div>

            {warmUpConfig.autoReminder && (
              <div className="space-y-2">
                <Label>Nhắc trước (ngày)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[warmUpConfig.reminderDays]}
                    onValueChange={([v]) =>
                      setWarmUpConfig((prev) => ({ ...prev, reminderDays: v }))
                    }
                    min={1}
                    max={7}
                    step={1}
                    className="flex-1"
                  />
                  <span className="font-bold w-16 text-right">
                    {warmUpConfig.reminderDays} ngày
                  </span>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Gift className="w-4 h-4 text-orange-500" />
                Tóm tắt chiến dịch
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>
                  • Voucher: <strong>{warmUpConfig.voucherValue} phút FREE</strong>
                </li>
                <li>
                  • Hiệu lực: <strong>{warmUpConfig.voucherValidDays} ngày</strong>
                </li>
                <li>
                  • Đối tượng: <strong>Khách hàng Cold</strong>
                </li>
                <li>
                  • Nhắc nhở:{' '}
                  <strong>
                    {warmUpConfig.autoReminder
                      ? `Trước ${warmUpConfig.reminderDays} ngày`
                      : 'Không'}
                  </strong>
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateCampaign} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 mr-2" />
                  Tạo chiến dịch
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZaloCampaignDashboard;
