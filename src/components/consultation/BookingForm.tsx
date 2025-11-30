import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  getConsultationTypes,
  getAvailableTimeSlots,
  createConsultation,
  calculateEndTime,
  formatTime,
  type ConsultationType,
  type TimeSlot,
} from '@/lib/api/consultations';
import { Calendar as CalendarIcon, Clock, Mail, Phone, User } from 'lucide-react';

interface BookingFormProps {
  consultantId: string;
  onSuccess?: () => void;
}

export function BookingForm({ consultantId, onSuccess }: BookingFormProps) {
  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Form data
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadConsultationTypes();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedType) {
      loadTimeSlots();
    }
  }, [selectedDate, selectedType]);

  const loadConsultationTypes = async () => {
    try {
      const types = await getConsultationTypes();
      setConsultationTypes(types);
      if (types.length > 0) {
        setSelectedType(types[0].id);
      }
    } catch (error) {
      toast.error('Không thể tải loại tư vấn');
      console.error(error);
    }
  };

  const loadTimeSlots = async () => {
    if (!selectedDate || !selectedType) return;

    setLoadingSlots(true);
    try {
      const type = consultationTypes.find(t => t.id === selectedType);
      if (!type) return;

      const dateStr = selectedDate.toISOString().split('T')[0];
      const slots = await getAvailableTimeSlots(
        consultantId,
        dateStr,
        type.duration_minutes
      );
      setTimeSlots(slots);
    } catch (error) {
      toast.error('Không thể tải thời gian khả dụng');
      console.error(error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime || !selectedType) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const type = consultationTypes.find(t => t.id === selectedType);
    if (!type) return;

    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const endTime = calculateEndTime(selectedTime, type.duration_minutes);

      await createConsultation({
        consultant_id: consultantId,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        consultation_date: dateStr,
        start_time: selectedTime,
        end_time: endTime,
        duration_minutes: type.duration_minutes,
        status: 'pending',
        consultation_type: type.name,
        notes,
      });

      toast.success('Đặt lịch thành công! Chúng tôi sẽ liên hệ sớm.');
      
      // Reset form
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setNotes('');
      setSelectedDate(undefined);
      setSelectedTime('');
      
      onSuccess?.();
    } catch (error) {
      toast.error('Đặt lịch thất bại');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeData = consultationTypes.find(t => t.id === selectedType);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Calendar & Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Chọn ngày & giờ
          </CardTitle>
          <CardDescription>
            Chọn ngày và khung giờ phù hợp với bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Consultation Type */}
          <div className="space-y-2">
            <Label>Loại tư vấn</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại tư vấn" />
              </SelectTrigger>
              <SelectContent>
                {consultationTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span>{type.name}</span>
                      <span className="text-muted-foreground">({type.duration_minutes} phút)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTypeData?.description && (
              <p className="text-sm text-muted-foreground">{selectedTypeData.description}</p>
            )}
          </div>

          {/* Calendar */}
          <div className="space-y-2">
            <Label>Chọn ngày</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Chọn giờ
              </Label>
              {loadingSlots ? (
                <div className="text-center py-8 text-muted-foreground">
                  Đang tải...
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Không có khung giờ khả dụng trong ngày này
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map(slot => (
                    <Button
                      key={slot.time}
                      type="button"
                      variant={selectedTime === slot.time ? 'default' : 'outline'}
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className="h-auto py-2"
                    >
                      {formatTime(slot.time)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Thông tin liên hệ
          </CardTitle>
          <CardDescription>
            Để chúng tôi có thể xác nhận và liên hệ với bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Nguyễn Văn A"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0901234567"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                placeholder="Chia sẻ thêm về nhu cầu tư vấn của bạn..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            {/* Summary */}
            {selectedDate && selectedTime && selectedTypeData && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Tóm tắt đặt lịch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loại tư vấn:</span>
                    <Badge style={{ backgroundColor: selectedTypeData.color }}>
                      {selectedTypeData.name}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày:</span>
                    <span className="font-medium">
                      {selectedDate.toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giờ:</span>
                    <span className="font-medium">
                      {formatTime(selectedTime)} - {formatTime(calculateEndTime(selectedTime, selectedTypeData.duration_minutes))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thời lượng:</span>
                    <span className="font-medium">{selectedTypeData.duration_minutes} phút</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || !selectedDate || !selectedTime}
            >
              {loading ? 'Đang xử lý...' : 'Đặt lịch tư vấn'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
