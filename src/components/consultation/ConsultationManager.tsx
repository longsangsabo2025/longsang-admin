import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  getConsultations,
  updateConsultation,
  cancelConsultation,
  getAvailabilitySettings,
  setAvailability,
  getDayName,
  formatTime,
  type Consultation,
  type AvailabilitySetting,
} from '@/lib/api/consultations';
import { Calendar, Clock, Mail, Phone, User, Check, X, Settings } from 'lucide-react';

interface ConsultationManagerProps {
  consultantId: string;
}

export function ConsultationManager({ consultantId }: ConsultationManagerProps) {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySetting[]>([]);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);

  useEffect(() => {
    loadConsultations();
    loadAvailability();
  }, [consultantId]);

  const loadConsultations = async () => {
    try {
      const data = await getConsultations({
        consultant_id: consultantId,
        from_date: new Date().toISOString().split('T')[0],
      });
      setConsultations(data);
    } catch (error) {
      toast.error('Không thể tải danh sách tư vấn');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      const settings = await getAvailabilitySettings(consultantId);
      setAvailabilitySettings(settings);
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await updateConsultation(id, { status: 'confirmed' });
      toast.success('Đã xác nhận lịch tư vấn');
      loadConsultations();
    } catch (error) {
      toast.error('Không thể xác nhận');
      console.error(error);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelConsultation(id, 'Cancelled by admin');
      toast.success('Đã hủy lịch tư vấn');
      loadConsultations();
    } catch (error) {
      toast.error('Không thể hủy');
      console.error(error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await updateConsultation(id, { status: 'completed' });
      toast.success('Đã đánh dấu hoàn thành');
      loadConsultations();
    } catch (error) {
      toast.error('Không thể cập nhật');
      console.error(error);
    }
  };

  const handleSaveAvailability = async () => {
    try {
      await setAvailability(availabilitySettings);
      toast.success('Đã cập nhật lịch làm việc');
      setShowAvailabilityDialog(false);
    } catch (error) {
      toast.error('Không thể cập nhật');
      console.error(error);
    }
  };

  const addTimeSlot = (dayOfWeek: number) => {
    setAvailabilitySettings([
      ...availabilitySettings,
      {
        day_of_week: dayOfWeek,
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
      },
    ]);
  };

  const removeTimeSlot = (index: number) => {
    setAvailabilitySettings(availabilitySettings.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, updates: Partial<AvailabilitySetting>) => {
    const newSettings = [...availabilitySettings];
    newSettings[index] = { ...newSettings[index], ...updates };
    setAvailabilitySettings(newSettings);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-500', label: 'Chờ xác nhận' },
      confirmed: { color: 'bg-green-500', label: 'Đã xác nhận' },
      cancelled: { color: 'bg-red-500', label: 'Đã hủy' },
      completed: { color: 'bg-blue-500', label: 'Hoàn thành' },
      no_show: { color: 'bg-gray-500', label: 'Không đến' },
    };

    const variant = variants[status] || variants.pending;
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý lịch tư vấn</h2>
          <p className="text-muted-foreground">Xem và quản lý các cuộc tư vấn sắp tới</p>
        </div>
        <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Cấu hình lịch làm việc
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cấu hình lịch làm việc</DialogTitle>
              <DialogDescription>
                Thiết lập các khung giờ làm việc cho từng ngày trong tuần
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const daySettings = availabilitySettings.filter((s) => s.day_of_week === day);
                return (
                  <Card key={day}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{getDayName(day)}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {daySettings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Chưa có khung giờ</p>
                      ) : (
                        daySettings.map((setting, index) => {
                          const globalIndex = availabilitySettings.indexOf(setting);
                          return (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={setting.start_time}
                                onChange={(e) =>
                                  updateTimeSlot(globalIndex, { start_time: e.target.value })
                                }
                              />
                              <span>-</span>
                              <Input
                                type="time"
                                value={setting.end_time}
                                onChange={(e) =>
                                  updateTimeSlot(globalIndex, { end_time: e.target.value })
                                }
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTimeSlot(globalIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })
                      )}
                      <Button variant="outline" size="sm" onClick={() => addTimeSlot(day)}>
                        Thêm khung giờ
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
              <Button onClick={handleSaveAvailability} className="w-full">
                Lưu cấu hình
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Consultations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách cuộc tư vấn</CardTitle>
          <CardDescription>Tất cả các cuộc tư vấn từ hôm nay trở đi</CardDescription>
        </CardHeader>
        <CardContent>
          {consultations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Chưa có lịch tư vấn nào</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày & Giờ</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultations.map((consultation) => (
                  <TableRow key={consultation.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {new Date(consultation.consultation_date).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatTime(consultation.start_time)} -{' '}
                            {formatTime(consultation.end_time)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{consultation.client_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{consultation.client_email}</span>
                        </div>
                        {consultation.client_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{consultation.client_phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{consultation.consultation_type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(consultation.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {consultation.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleConfirm(consultation.id!)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancel(consultation.id!)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {consultation.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleComplete(consultation.id!)}
                          >
                            Hoàn thành
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
