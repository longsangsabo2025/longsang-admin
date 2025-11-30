import { BookingForm } from '@/components/consultation/BookingForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle2, MessageSquare } from 'lucide-react';

export default function ConsultationBooking() {
  // TODO: Get consultant ID from settings or default consultant
  const consultantId = 'default-consultant-id'; // Replace with actual logic

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Đặt lịch tư vấn miễn phí
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Để chúng tôi giúp bạn tìm ra giải pháp tối ưu cho doanh nghiệp
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-base">Linh hoạt</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Chọn ngày giờ phù hợp với lịch của bạn
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Clock className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-base">Nhanh chóng</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Chỉ mất 30-60 phút để hiểu rõ nhu cầu
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-base">Chuyên nghiệp</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Đội ngũ chuyên gia giàu kinh nghiệm
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <MessageSquare className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-base">Tư vấn miễn phí</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                100% miễn phí, không ràng buộc
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Booking Form */}
        <BookingForm
          consultantId={consultantId}
          onSuccess={() => {
            // Scroll to top or show success message
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* FAQ */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Câu hỏi thường gặp</CardTitle>
            </CardHeader>
            <CardContent className="text-left space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Tư vấn có mất phí không?</h3>
                <p className="text-muted-foreground">
                  Hoàn toàn miễn phí. Chúng tôi muốn hiểu rõ nhu cầu của bạn trước khi đưa ra giải pháp phù hợp.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Tôi cần chuẩn bị gì?</h3>
                <p className="text-muted-foreground">
                  Chỉ cần chia sẻ về doanh nghiệp và những thách thức bạn đang gặp phải. Chúng tôi sẽ lắng nghe và tư vấn.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Hình thức tư vấn?</h3>
                <p className="text-muted-foreground">
                  Tùy bạn chọn: gặp mặt trực tiếp, video call (Zoom/Google Meet) hoặc điện thoại.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Tôi có thể hủy/đổi lịch không?</h3>
                <p className="text-muted-foreground">
                  Có thể! Vui lòng thông báo trước ít nhất 24 giờ bằng cách trả lời email xác nhận.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
