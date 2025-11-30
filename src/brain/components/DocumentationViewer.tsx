/**
 * Documentation Viewer Component
 * Displays AI Second Brain user guide in a modal/dialog
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Rocket,
  FolderOpen,
  Brain,
  Zap,
  Bell,
  Search,
  MessageSquare,
  Code,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export function DocumentationViewer() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Hướng Dẫn Sử Dụng
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Brain className="h-6 w-6 text-primary" />
            AI Second Brain - Hướng Dẫn Sử Dụng
          </DialogTitle>
          <DialogDescription>
            Hướng dẫn đầy đủ về cách sử dụng hệ thống quản lý tri thức AI
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="intro" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="intro" className="text-xs">
              <Rocket className="h-3 w-3 mr-1" />
              Giới Thiệu
            </TabsTrigger>
            <TabsTrigger value="domains" className="text-xs">
              <FolderOpen className="h-3 w-3 mr-1" />
              Domains
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              Knowledge
            </TabsTrigger>
            <TabsTrigger value="automation" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs">
              <Code className="h-3 w-3 mr-1" />
              API
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4 pr-4">
            {/* Giới Thiệu Tab */}
            <TabsContent value="intro" className="space-y-6">
              <Section title="AI Second Brain là gì?">
                <p className="text-muted-foreground mb-4">
                  AI Second Brain là hệ thống quản lý tri thức thông minh, cho phép bạn:
                </p>
                <div className="grid gap-3">
                  <FeatureItem
                    icon={<FolderOpen className="h-4 w-4" />}
                    title="Lưu trữ & tổ chức kiến thức"
                  >
                    Theo từng domain riêng biệt
                  </FeatureItem>
                  <FeatureItem icon={<Search className="h-4 w-4" />} title="Tìm kiếm ngữ nghĩa">
                    Sử dụng vector embeddings
                  </FeatureItem>
                  <FeatureItem icon={<Zap className="h-4 w-4" />} title="Tự động hóa">
                    Với Actions & Workflows
                  </FeatureItem>
                  <FeatureItem icon={<Bell className="h-4 w-4" />} title="Quản lý công việc">
                    Tasks & Notifications
                  </FeatureItem>
                  <FeatureItem
                    icon={<MessageSquare className="h-4 w-4" />}
                    title="Truy vấn đa domain"
                  >
                    Câu trả lời toàn diện
                  </FeatureItem>
                </div>
              </Section>

              <Section title="Kiến Trúc Hệ Thống">
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  <pre className="whitespace-pre-wrap">
                    {`┌─────────────────────────────────────┐
│         🖥️ Frontend (UI)             │
│        localhost:8082               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         🚀 Backend API              │
│        localhost:3001               │
│  Domains | Knowledge | Actions      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     🗄️ Supabase PostgreSQL          │
│       + pgvector (1536 dims)        │
│  16 Tables | 20+ Functions | RLS    │
└─────────────────────────────────────┘`}
                  </pre>
                </div>
              </Section>

              <Section title="Khởi Động Nhanh">
                <div className="space-y-3">
                  <Step number={1} title="Chọn tab 'Domains'">
                    Tạo domain mới hoặc chọn domain có sẵn
                  </Step>
                  <Step number={2} title="Thêm Knowledge">
                    Vào tab 'Add Knowledge', nhập title và content
                  </Step>
                  <Step number={3} title="Tìm kiếm">
                    Dùng tab 'Search' để tìm knowledge
                  </Step>
                  <Step number={4} title="Multi-Domain Query">
                    Đặt câu hỏi và nhận câu trả lời từ AI
                  </Step>
                </div>
              </Section>
            </TabsContent>

            {/* Domains Tab */}
            <TabsContent value="domains" className="space-y-6">
              <Section title="Domain là gì?">
                <p className="text-muted-foreground mb-4">
                  Domain là không gian tri thức riêng biệt, giúp tổ chức knowledge theo chủ đề:
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">AI & Machine Learning</Badge>
                  <Badge variant="secondary">Web Development</Badge>
                  <Badge variant="secondary">Business Strategy</Badge>
                  <Badge variant="secondary">Personal Notes</Badge>
                </div>
              </Section>

              <Section title="Tạo Domain Mới">
                <div className="space-y-3">
                  <Step number={1} title="Click '+ New Domain'">
                    Trong tab Domains
                  </Step>
                  <Step number={2} title="Nhập thông tin">
                    Name và Description
                  </Step>
                  <Step number={3} title="Click 'Create'">
                    Domain sẽ được tạo ngay lập tức
                  </Step>
                </div>
              </Section>

              <Section title="Domain Stats">
                <p className="text-muted-foreground mb-3">Mỗi domain hiển thị:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <strong>Total Knowledge:</strong> Số lượng knowledge items
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <strong>This Week/Month:</strong> Knowledge mới thêm
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <strong>Last Activity:</strong> Hoạt động gần nhất
                  </li>
                </ul>
              </Section>

              <Section title="Best Practices">
                <div className="grid gap-3">
                  <TipItem type="do" text="Tạo domains theo chủ đề rõ ràng" />
                  <TipItem type="do" text="Mỗi domain có focus riêng" />
                  <TipItem type="do" text="Đặt tên domain dễ hiểu" />
                  <TipItem type="dont" text="Tạo quá nhiều domains nhỏ" />
                  <TipItem type="dont" text="Trộn lẫn nhiều chủ đề trong 1 domain" />
                </div>
              </Section>
            </TabsContent>

            {/* Knowledge Tab */}
            <TabsContent value="knowledge" className="space-y-6">
              <Section title="Thêm Knowledge">
                <div className="space-y-3">
                  <Step number={1} title="Chọn domain">
                    Từ dropdown hoặc tab Domains
                  </Step>
                  <Step number={2} title="Nhập Title">
                    Tiêu đề ngắn gọn, mô tả rõ nội dung
                  </Step>
                  <Step number={3} title="Nhập Content">
                    Nội dung chi tiết, đầy đủ context
                  </Step>
                  <Step number={4} title="Thêm Tags (tùy chọn)">
                    Giúp phân loại và tìm kiếm dễ hơn
                  </Step>
                  <Step number={5} title="Click 'Save'">
                    AI sẽ tự động tạo embedding
                  </Step>
                </div>
              </Section>

              <Section title="Tìm Kiếm Knowledge">
                <p className="text-muted-foreground mb-3">
                  <strong>Semantic Search</strong> - Tìm kiếm theo ngữ nghĩa, không chỉ từ khóa:
                </p>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">Ví dụ queries:</p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• "Làm sao để tăng traffic website?"</li>
                    <li>• "Best practices cho SEO"</li>
                    <li>• "Cách viết content marketing hiệu quả"</li>
                  </ul>
                </div>
              </Section>

              <Section title="Tham số tìm kiếm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Param</th>
                        <th className="text-left py-2">Mô tả</th>
                        <th className="text-left py-2">Mặc định</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 font-mono">matchThreshold</td>
                        <td className="py-2">Ngưỡng similarity (0-1)</td>
                        <td className="py-2">0.7</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-mono">matchCount</td>
                        <td className="py-2">Số kết quả tối đa</td>
                        <td className="py-2">10</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="Best Practices">
                <div className="grid gap-3">
                  <TipItem type="do" text="Title ngắn gọn, mô tả rõ nội dung" />
                  <TipItem type="do" text="Content chi tiết, đầy đủ context" />
                  <TipItem type="do" text="Thêm tags để dễ phân loại" />
                  <TipItem type="dont" text="Copy-paste không chọn lọc" />
                  <TipItem type="dont" text="Thêm knowledge trùng lặp" />
                </div>
              </Section>
            </TabsContent>

            {/* Automation Tab */}
            <TabsContent value="automation" className="space-y-6">
              <Section title="Actions">
                <p className="text-muted-foreground mb-3">
                  Actions là các tác vụ đơn lẻ được queue và execute:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Mô tả</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 font-mono">send_notification</td>
                        <td className="py-2">Gửi thông báo</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-mono">create_task</td>
                        <td className="py-2">Tạo task mới</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-mono">trigger_workflow</td>
                        <td className="py-2">Kích hoạt workflow</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-mono">webhook</td>
                        <td className="py-2">Gọi external webhook</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="Workflows">
                <p className="text-muted-foreground mb-3">Workflows là chuỗi actions tự động:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Trigger Type</th>
                        <th className="text-left py-2">Mô tả</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 font-mono">manual</td>
                        <td className="py-2">Kích hoạt thủ công</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-mono">schedule</td>
                        <td className="py-2">Theo lịch (cron)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-mono">event</td>
                        <td className="py-2">Khi có event xảy ra</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="Tasks">
                <p className="text-muted-foreground mb-3">
                  Quản lý công việc với priorities và status:
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline">pending</Badge>
                  <Badge variant="outline">in_progress</Badge>
                  <Badge variant="outline">completed</Badge>
                  <Badge variant="outline">cancelled</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-gray-500">low</Badge>
                  <Badge className="bg-blue-500">medium</Badge>
                  <Badge className="bg-orange-500">high</Badge>
                  <Badge className="bg-red-500">urgent</Badge>
                </div>
              </Section>

              <Section title="Notifications">
                <p className="text-muted-foreground mb-3">Các loại notification:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">info</Badge>
                  <Badge className="bg-green-500">success</Badge>
                  <Badge className="bg-yellow-500">warning</Badge>
                  <Badge className="bg-red-500">error</Badge>
                </div>
              </Section>
            </TabsContent>

            {/* API Tab */}
            <TabsContent value="api" className="space-y-6">
              <Section title="Base URL">
                <code className="bg-muted px-2 py-1 rounded text-sm">
                  http://localhost:3001/api/brain
                </code>
              </Section>

              <Section title="Authentication">
                <p className="text-muted-foreground mb-2">Tất cả requests cần header:</p>
                <code className="bg-muted px-2 py-1 rounded text-sm block">
                  x-user-id: your-user-uuid
                </code>
              </Section>

              <Section title="Main Endpoints">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Method</th>
                        <th className="text-left py-2">Endpoint</th>
                        <th className="text-left py-2">Mô tả</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">
                          <Badge>GET</Badge>
                        </td>
                        <td className="py-2 font-mono">/domains</td>
                        <td className="py-2">Lấy tất cả domains</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">
                          <Badge>POST</Badge>
                        </td>
                        <td className="py-2 font-mono">/domains</td>
                        <td className="py-2">Tạo domain mới</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">
                          <Badge>GET</Badge>
                        </td>
                        <td className="py-2 font-mono">/knowledge/search</td>
                        <td className="py-2">Tìm kiếm knowledge</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">
                          <Badge>POST</Badge>
                        </td>
                        <td className="py-2 font-mono">/knowledge/ingest</td>
                        <td className="py-2">Thêm knowledge</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">
                          <Badge>POST</Badge>
                        </td>
                        <td className="py-2 font-mono">/query</td>
                        <td className="py-2">Multi-domain query</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">
                          <Badge>GET</Badge>
                        </td>
                        <td className="py-2 font-mono">/actions</td>
                        <td className="py-2">Lấy actions</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">
                          <Badge>GET</Badge>
                        </td>
                        <td className="py-2 font-mono">/workflows</td>
                        <td className="py-2">Lấy workflows</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">
                          <Badge>GET</Badge>
                        </td>
                        <td className="py-2 font-mono">/tasks</td>
                        <td className="py-2">Lấy tasks</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">
                          <Badge>GET</Badge>
                        </td>
                        <td className="py-2 font-mono">/notifications</td>
                        <td className="py-2">Lấy notifications</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="Troubleshooting">
                <div className="space-y-3">
                  <TroubleshootItem
                    error="User ID is required"
                    solution="Thêm header x-user-id vào request"
                  />
                  <TroubleshootItem
                    error="Embedding generation failed"
                    solution="Kiểm tra OPENAI_API_KEY trong .env"
                  />
                  <TroubleshootItem
                    error="Search returns 0 results"
                    solution="Giảm matchThreshold (VD: 0.5)"
                  />
                </div>
              </Section>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">Version 1.0.0 • Updated 29/11/2025</p>
          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://github.com/longsangsabo2025/ainewbie-vision"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Full Documentation
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper Components
interface SectionProps {
  readonly title: string;
  readonly children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}

interface FeatureItemProps {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly children: React.ReactNode;
}

function FeatureItem({ icon, title, children }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
      <div className="text-primary mt-0.5">{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

interface StepProps {
  readonly number: number;
  readonly title: string;
  readonly children: React.ReactNode;
}

function Step({ number, title, children }: StepProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

interface TipItemProps {
  readonly type: 'do' | 'dont';
  readonly text: string;
}

function TipItem({ type, text }: TipItemProps) {
  return (
    <div
      className={`flex items-center gap-2 p-2 rounded ${type === 'do' ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}
    >
      {type === 'do' ? (
        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
      )}
      <span className="text-sm">{text}</span>
    </div>
  );
}

interface TroubleshootItemProps {
  readonly error: string;
  readonly solution: string;
}

function TroubleshootItem({ error, solution }: TroubleshootItemProps) {
  return (
    <div className="p-3 bg-muted rounded-lg">
      <p className="text-sm font-mono text-red-500 mb-1">❌ {error}</p>
      <p className="text-sm text-muted-foreground">✅ {solution}</p>
    </div>
  );
}
