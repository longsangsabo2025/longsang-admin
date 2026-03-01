import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { HelpCircle, Zap, Eye, Play, Pause, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export const HelpGuide = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <HelpCircle className="w-5 h-5" />
          <span className="sr-only">Hướng dẫn sử dụng</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">📚 Hướng Dẫn Sử Dụng Automation Hub</DialogTitle>
          <DialogDescription>
            Hệ thống tự động hóa với AI agents để quản lý và thực hiện các tác vụ tự động
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="actions">Thao tác</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Automation Hub là gì?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Đây là hệ thống tự động hóa với AI agents giúp bạn:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                  <li>Tự động tạo blog posts từ contact forms</li>
                  <li>Gửi email follow-up cho khách hàng tiềm năng</li>
                  <li>Tạo nội dung social media tự động</li>
                  <li>Monitor và phân tích metrics website</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">🎯 Dashboard Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <strong className="min-w-32">Active Agents:</strong>
                    <span className="text-muted-foreground">Số AI agents đang hoạt động</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <strong className="min-w-32">Actions Today:</strong>
                    <span className="text-muted-foreground">Tổng hành động hôm nay</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <strong className="min-w-32">Success Rate:</strong>
                    <span className="text-muted-foreground">
                      Tỷ lệ thành công (100 actions gần nhất)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <strong className="min-w-32">Queue Size:</strong>
                    <span className="text-muted-foreground">Nội dung đang chờ xử lý</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="agents" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">🤖 Các loại AI Agents</h3>

                <div className="space-y-4">
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold text-blue-600 mb-1">✍️ Content Writer Agent</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Tự động tạo blog posts từ contact form submissions
                    </p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                      <li>Phân tích message từ contact forms</li>
                      <li>Extract topic chính</li>
                      <li>Generate blog post với AI</li>
                      <li>Tạo SEO metadata</li>
                      <li>Thêm vào content queue</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold text-green-600 mb-1">💌 Lead Nurture Agent</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Gửi email follow-up tự động cho leads
                    </p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                      <li>Chờ 24h sau contact submission</li>
                      <li>Generate personalized email</li>
                      <li>Schedule email gửi</li>
                      <li>Track engagement</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold text-purple-600 mb-1">📱 Social Media Agent</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Tạo social posts từ blog content
                    </p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                      <li>Tự động từ blog posts mới</li>
                      <li>Generate posts cho LinkedIn, Twitter, Facebook</li>
                      <li>Thêm hashtags phù hợp</li>
                      <li>Schedule optimal timing</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold text-orange-600 mb-1">📊 Analytics Agent</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Monitor metrics và tạo insights
                    </p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                      <li>Weekly automated reports</li>
                      <li>Traffic analysis</li>
                      <li>Conversion tracking</li>
                      <li>Alerts khi có vấn đề</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">⚙️ Các thao tác chính</h3>

                <div className="space-y-4">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <h4 className="font-semibold">Xem chi tiết Agent</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Click vào agent card để xem:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside mt-1">
                      <li>Performance metrics</li>
                      <li>Configuration settings</li>
                      <li>Activity history</li>
                      <li>Triggers và workflows</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Play className="w-4 h-4 text-green-500" />
                      <Pause className="w-4 h-4 text-orange-500" />
                      <h4 className="font-semibold">Pause/Resume Agent</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Click nút pause/play để tạm dừng hoặc kích hoạt lại agent
                    </p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside mt-1">
                      <li>Agent paused: không tự động chạy</li>
                      <li>Agent active: sẵn sàng xử lý</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <h4 className="font-semibold">Manual Trigger</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Chạy agent thủ công với custom context:
                    </p>
                    <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                      <li>Vào agent detail page</li>
                      <li>Click "Manual Trigger"</li>
                      <li>Nhập context JSON (nếu cần)</li>
                      <li>Click "Trigger Agent"</li>
                    </ol>
                    <div className="mt-2 bg-muted p-2 rounded text-xs font-mono">
                      {`{"contact_id": "uuid-here"}`}
                    </div>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-4 h-4 text-gray-500" />
                      <h4 className="font-semibold">Xem Activity Logs</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Activity logs cho thấy:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside mt-1">
                      <li>Tất cả hành động của agents</li>
                      <li>Status (success/error/warning)</li>
                      <li>Execution time</li>
                      <li>Error messages nếu có</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tips" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">💡 Tips & Best Practices</h3>

                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 bg-blue-500/10 p-3 rounded">
                    <h4 className="font-semibold text-blue-700 mb-1">🎯 Monitor Success Rate</h4>
                    <p className="text-sm text-muted-foreground">
                      Nếu success rate {'<'} 90%, check activity logs để tìm errors và fix issues
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 bg-green-500/10 p-3 rounded">
                    <h4 className="font-semibold text-green-700 mb-1">
                      ⏰ Test với Manual Trigger
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Trước khi enable auto-trigger, test agent với manual trigger để đảm bảo hoạt
                      động đúng
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-500 bg-purple-500/10 p-3 rounded">
                    <h4 className="font-semibold text-purple-700 mb-1">📝 Review Content Queue</h4>
                    <p className="text-sm text-muted-foreground">
                      Thường xuyên check content queue để review và approve nội dung trước khi
                      publish
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-500 bg-orange-500/10 p-3 rounded">
                    <h4 className="font-semibold text-orange-700 mb-1">
                      🔧 Customize Agent Config
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Có thể customize AI model, prompts, và settings trong agent configuration
                    </p>
                  </div>

                  <div className="border-l-4 border-red-500 bg-red-500/10 p-3 rounded">
                    <h4 className="font-semibold text-red-700 mb-1">⚠️ Check Logs khi có Error</h4>
                    <p className="text-sm text-muted-foreground">
                      Nếu agent status là "error", xem activity logs để biết chi tiết và khắc phục
                    </p>
                  </div>
                </div>

                <div className="mt-4 bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">📚 Tài liệu</h4>
                  <p className="text-sm text-muted-foreground mb-2">Xem thêm tài liệu chi tiết:</p>
                  <ul className="text-sm space-y-1">
                    <li>
                      •{' '}
                      <code className="text-xs bg-background px-1 rounded">
                        AUTOMATION_SETUP.md
                      </code>{' '}
                      - Setup guide
                    </li>
                    <li>
                      •{' '}
                      <code className="text-xs bg-background px-1 rounded">
                        AUTOMATION_README.md
                      </code>{' '}
                      - Feature docs
                    </li>
                    <li>
                      •{' '}
                      <code className="text-xs bg-background px-1 rounded">
                        IMPLEMENTATION_SUMMARY.md
                      </code>{' '}
                      - Overview
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
