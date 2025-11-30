import {
  Zap,
  Cpu,
  Database,
  Cloud,
  Trophy,
  Target,
  Coins,
  BarChart3,
  Users,
  Smartphone,
  MessageSquare,
  CheckCircle2,
  ShoppingCart,
  Utensils,
  Clock,
  CreditCard,
  Calendar,
  MapPin,
  Shield,
  LucideIcon,
} from 'lucide-react';

export interface ProjectFeature {
  icon: LucideIcon;
  title: string;
  points: string[];
  color: 'cyan' | 'blue' | 'green';
}

export interface ProjectNode {
  id: number;
  icon: LucideIcon;
  label: string;
  x: number;
  y: number;
  color: 'neon-cyan' | 'neon-blue' | 'neon-green';
}

export interface ProjectMetric {
  label: string;
  value: string;
  unit: string;
  trend: string;
}

export interface TechStackItem {
  name: string;
  category: string;
  icon: LucideIcon;
  iconifyIcon?: string; // Iconify icon name (e.g., "logos:flutter", "vscode-icons:file-type-firebase")
}

export interface TechnicalDetails {
  performance?: {
    label: string;
    value: string;
  }[];
  tools?: {
    name: string;
    iconifyIcon?: string;
  }[];
  infrastructure?: {
    label: string;
    value: string;
  }[];
}

export interface ProjectData {
  id: number;
  name: string;
  slug?: string; // URL slug for routing (e.g., "ainewbievn", "sabohub")
  description: string;
  progress: number;
  category: string;
  icon: LucideIcon;
  productionUrl?: string; // URL của trang web production

  // Hero Section
  heroTitle: string;
  heroDescription: string;
  heroStats: {
    icon: LucideIcon;
    label: string;
    value: string;
    color: string;
  }[];

  // Overview
  overviewTitle: string;
  overviewDescription: string;
  objectives: string[];
  impacts: string[];

  // Tech Architecture
  techNodes: ProjectNode[];
  techConnections: { from: number; to: number }[];
  techStack?: TechStackItem[];
  technicalDetails?: TechnicalDetails;

  // Features
  features: ProjectFeature[];

  // Stats & Metrics
  metrics: ProjectMetric[];
  barData: { name: string; value: number; target: number }[];
  lineData: { month: string; users: number; performance: number }[];
}

export const projectsData: ProjectData[] = [
  // SABO Arena Project
  {
    id: 1,
    name: 'SABO Arena',
    slug: 'sabo-arena',
    description: 'Nền tảng thi đấu bi-a #1 VN',
    progress: 95,
    category: 'Mobile App',
    icon: Zap,
    productionUrl: 'https://saboarena.com',

    heroTitle: 'SABO ARENA',
    heroDescription:
      'Nền tảng thi đấu bi-a chuyên nghiệp #1 Việt Nam - 8 định dạng giải đấu, ELO ranking minh bạch, kiếm SPA Points đổi voucher thật',
    heroStats: [
      { icon: Users, label: 'Người Chơi', value: '1,500+', color: 'neon-green' },
      { icon: Trophy, label: 'Giải Đấu', value: '120+', color: 'neon-cyan' },
      { icon: Cloud, label: 'Câu Lạc Bộ', value: '15+', color: 'neon-blue' },
    ],

    overviewTitle: 'TỔNG QUAN DỰ ÁN',
    overviewDescription:
      'SABO Arena là nền tảng thi đấu bi-a chuyên nghiệp đầu tiên tại Việt Nam, tích hợp hệ thống ELO ranking minh bạch, 8 định dạng giải đấu quốc tế, và chương trình SPA Points độc quyền cho phép người chơi kiếm điểm và đổi voucher thật.',
    objectives: [
      'Chuyên nghiệp hóa giải đấu bi-a tại Việt Nam với hệ thống ELO quốc tế',
      'Kết nối cộng đồng người chơi bi-a qua mạng xã hội tích hợp',
      'Hỗ trợ chủ câu lạc bộ quản lý giải đấu tự động, tiết kiệm 90% thời gian',
    ],
    impacts: [
      '1,500+ người chơi active, tăng trưởng 200% trong Q4/2025',
      '120+ giải đấu đã tổ chức thành công tại 15+ câu lạc bộ',
      "Đánh giá 4.8/5.0 sao từ người dùng, được chọn là 'Best Sports App 2025'",
    ],

    techNodes: [
      { id: 1, icon: Smartphone, label: 'Flutter App', x: 50, y: 20, color: 'neon-cyan' },
      { id: 2, icon: Cloud, label: 'Firebase', x: 20, y: 50, color: 'neon-blue' },
      { id: 3, icon: Database, label: 'Supabase', x: 80, y: 50, color: 'neon-green' },
      { id: 4, icon: Users, label: 'Auth System', x: 35, y: 80, color: 'neon-cyan' },
      { id: 5, icon: Trophy, label: 'Tournament Engine', x: 65, y: 80, color: 'neon-blue' },
      { id: 6, icon: MessageSquare, label: 'Chat & Social', x: 50, y: 95, color: 'neon-green' },
    ],
    techConnections: [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 6 },
      { from: 5, to: 6 },
    ],

    techStack: [
      { name: 'Flutter', category: 'Framework', icon: Smartphone, iconifyIcon: 'logos:flutter' },
      { name: 'Firebase', category: 'Backend', icon: Cloud, iconifyIcon: 'logos:firebase' },
      {
        name: 'Supabase',
        category: 'Database',
        icon: Database,
        iconifyIcon: 'logos:supabase-icon',
      },
      { name: 'PostgreSQL', category: 'Database', icon: Database, iconifyIcon: 'logos:postgresql' },
      {
        name: 'Cloud Storage',
        category: 'Storage',
        icon: Cloud,
        iconifyIcon: 'logos:google-cloud',
      },
      {
        name: 'Push Notifications',
        category: 'Service',
        icon: MessageSquare,
        iconifyIcon: 'vscode-icons:file-type-firebase',
      },
      {
        name: 'Analytics',
        category: 'Monitoring',
        icon: BarChart3,
        iconifyIcon: 'logos:google-analytics',
      },
      { name: 'OAuth 2.0', category: 'Security', icon: Users, iconifyIcon: 'mdi:shield-lock' },
    ],

    technicalDetails: {
      performance: [
        { label: 'App Launch Time', value: '1.8s' },
        { label: 'Image Load Speed', value: '200ms' },
        { label: 'Frame Rate', value: '60 FPS' },
        { label: 'Bundle Size', value: '45 MB' },
      ],
      tools: [
        { name: 'VS Code', iconifyIcon: 'logos:visual-studio-code' },
        { name: 'Android Studio', iconifyIcon: 'devicon:androidstudio' },
        { name: 'Xcode', iconifyIcon: 'devicon:xcode' },
        { name: 'Figma', iconifyIcon: 'logos:figma' },
        { name: 'Postman', iconifyIcon: 'logos:postman-icon' },
        { name: 'Git & GitHub', iconifyIcon: 'logos:github-icon' },
        { name: 'Firebase Console', iconifyIcon: 'logos:firebase' },
        { name: 'Supabase Studio', iconifyIcon: 'logos:supabase-icon' },
      ],
      infrastructure: [
        { label: 'Hosting', value: 'Firebase Hosting + Cloud Functions' },
        { label: 'CDN', value: 'Cloudflare Global CDN' },
        { label: 'Database', value: 'Supabase PostgreSQL (US-West)' },
        { label: 'Storage', value: 'Firebase Cloud Storage (Multi-region)' },
        { label: 'CI/CD', value: 'GitHub Actions + Fastlane' },
        { label: 'Monitoring', value: 'Firebase Crashlytics + Analytics' },
      ],
    },

    features: [
      {
        icon: Trophy,
        title: '8 Định Dạng Giải Đấu',
        points: [
          'Single Elimination (SE8, SE16, SE32)',
          'Double Elimination (DE8, DE16, DE32)',
          'Round Robin và Swiss System',
          'Tự động tạo bracket và ghép cặp',
        ],
        color: 'cyan',
      },
      {
        icon: Target,
        title: 'ELO Rating Minh Bạch',
        points: [
          'Hệ thống xếp hạng quốc tế chuẩn FIDE',
          'Mọi người bắt đầu từ 1000 điểm',
          'Công thức toán học công bằng, không can thiệp',
          'Leaderboard real-time cập nhật liên tục',
        ],
        color: 'blue',
      },
      {
        icon: Coins,
        title: 'SPA Points - Đổi Voucher Thật',
        points: [
          'Kiếm SPA từ giải đấu và nhiệm vụ',
          'Đổi voucher giảm 10-50% phí bàn',
          '15+ câu lạc bộ đối tác chấp nhận',
          'Mỗi chiến thắng đều có giá trị thực',
        ],
        color: 'green',
      },
      {
        icon: BarChart3,
        title: 'Dashboard Quản Lý CLB',
        points: [
          'Tạo giải đấu trong 3 phút với wizard',
          'Analytics chi tiết về thành viên, doanh thu',
          'Tự động tính điểm, xếp hạng, phát thưởng',
          'Duyệt voucher redemption 1 click',
        ],
        color: 'cyan',
      },
      {
        icon: Users,
        title: 'Mạng Xã Hội Tích Hợp',
        points: [
          'Chat 1-on-1 và group real-time',
          'Đăng ảnh/video chiến thắng lên feed',
          'Follow người chơi giỏi để học hỏi',
          'Thông báo push cho giải mới, kết quả',
        ],
        color: 'blue',
      },
      {
        icon: Zap,
        title: 'Hiệu Năng Vượt Trội',
        points: [
          'Tốc độ tải ảnh nhanh hơn 60% (200ms)',
          'Cuộn list mượt 60 FPS với Flutter',
          'Khởi động app chỉ 1.8 giây',
          'Hỗ trợ iOS, Android và iPad Pro',
        ],
        color: 'green',
      },
    ],

    metrics: [
      { label: 'Người Chơi Active', value: '1,500+', unit: 'Players', trend: '+200%' },
      { label: 'Giải Đấu', value: '120+', unit: 'Tournaments', trend: '+150%' },
      { label: 'Câu Lạc Bộ', value: '15+', unit: 'Clubs', trend: '+300%' },
      { label: 'Đánh Giá', value: '4.8/5.0', unit: 'Rating', trend: '+12%' },
    ],
    barData: [
      { name: 'Q1', value: 400, target: 500 },
      { name: 'Q2', value: 750, target: 800 },
      { name: 'Q3', value: 1100, target: 1000 },
      { name: 'Q4', value: 1500, target: 1400 },
    ],
    lineData: [
      { month: 'T7', users: 250, performance: 75 },
      { month: 'T8', users: 450, performance: 80 },
      { month: 'T9', users: 750, performance: 85 },
      { month: 'T10', users: 1100, performance: 90 },
      { month: 'T11', users: 1350, performance: 93 },
      { month: 'T12', users: 1500, performance: 95 },
    ],
  },

  // AI Agent Platform (Example second project)
  {
    id: 2,
    name: 'AI Agent Platform',
    slug: 'ai-agent-platform',
    description: 'Nền tảng AI Agent tự động hóa',
    progress: 88,
    category: 'AI Platform',
    icon: Cpu,

    heroTitle: 'AI AGENT PLATFORM',
    heroDescription:
      'Nền tảng AI Agent thông minh cho tự động hóa quy trình kinh doanh, tích hợp đa kênh, xử lý ngôn ngữ tự nhiên và machine learning',
    heroStats: [
      { icon: Cpu, label: 'AI Models', value: '25+', color: 'neon-green' },
      { icon: Zap, label: 'Requests/Day', value: '50K+', color: 'neon-cyan' },
      { icon: Users, label: 'Active Users', value: '800+', color: 'neon-blue' },
    ],

    overviewTitle: 'TỔNG QUAN DỰ ÁN',
    overviewDescription:
      'Nền tảng AI Agent Platform cung cấp giải pháp tự động hóa toàn diện với khả năng xử lý ngôn ngữ tự nhiên, machine learning và tích hợp đa kênh cho doanh nghiệp.',
    objectives: [
      'Phát triển hệ thống AI Agent có khả năng học và cải thiện liên tục',
      'Tích hợp đa kênh: Email, SMS, Social Media, Website',
      'Cung cấp analytics và insights về hiệu suất tự động hóa',
    ],
    impacts: [
      'Giảm 70% thời gian xử lý customer support',
      'Tăng 150% productivity cho các quy trình automation',
      '800+ doanh nghiệp tin dùng, rating 4.7/5.0',
    ],

    techNodes: [
      { id: 1, icon: Cpu, label: 'AI Engine', x: 50, y: 20, color: 'neon-cyan' },
      { id: 2, icon: Cloud, label: 'Cloud Services', x: 20, y: 50, color: 'neon-blue' },
      { id: 3, icon: Database, label: 'Vector DB', x: 80, y: 50, color: 'neon-green' },
      { id: 4, icon: Zap, label: 'API Gateway', x: 35, y: 80, color: 'neon-cyan' },
      { id: 5, icon: MessageSquare, label: 'NLP Engine', x: 65, y: 80, color: 'neon-blue' },
      { id: 6, icon: Users, label: 'User Interface', x: 50, y: 95, color: 'neon-green' },
    ],
    techConnections: [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 6 },
      { from: 5, to: 6 },
    ],

    techStack: [
      { name: 'React & TypeScript', category: 'Frontend', icon: Cpu, iconifyIcon: 'logos:react' },
      {
        name: 'Node.js & Express',
        category: 'Backend',
        icon: Cloud,
        iconifyIcon: 'logos:nodejs-icon',
      },
      { name: 'PostgreSQL', category: 'Database', icon: Database, iconifyIcon: 'logos:postgresql' },
      {
        name: 'Pinecone',
        category: 'Vector DB',
        icon: Database,
        iconifyIcon: 'simple-icons:pinecone',
      },
      { name: 'OpenAI GPT-4', category: 'AI/ML', icon: Cpu, iconifyIcon: 'simple-icons:openai' },
      {
        name: 'LangChain',
        category: 'AI Framework',
        icon: Zap,
        iconifyIcon: 'simple-icons:langchain',
      },
      { name: 'Redis', category: 'Cache', icon: Cloud, iconifyIcon: 'logos:redis' },
      {
        name: 'Docker & K8s',
        category: 'Infrastructure',
        icon: Cloud,
        iconifyIcon: 'logos:docker-icon',
      },
    ],

    technicalDetails: {
      performance: [
        { label: 'API Response Time', value: '120ms' },
        { label: 'AI Processing', value: '2.5s' },
        { label: 'Uptime', value: '99.9%' },
        { label: 'Concurrent Users', value: '5,000' },
      ],
      tools: [
        { name: 'VS Code', iconifyIcon: 'logos:visual-studio-code' },
        { name: 'Docker Desktop', iconifyIcon: 'logos:docker-icon' },
        { name: 'Postman', iconifyIcon: 'logos:postman-icon' },
        { name: 'GitHub', iconifyIcon: 'logos:github-icon' },
        { name: 'Vercel', iconifyIcon: 'logos:vercel-icon' },
        { name: 'OpenAI', iconifyIcon: 'simple-icons:openai' },
        { name: 'Pinecone', iconifyIcon: 'simple-icons:pinecone' },
        { name: 'DataDog', iconifyIcon: 'logos:datadog' },
      ],
      infrastructure: [
        { label: 'Frontend', value: 'Vercel Edge Network' },
        { label: 'Backend', value: 'AWS ECS + Fargate' },
        { label: 'Database', value: 'AWS RDS PostgreSQL (Multi-AZ)' },
        { label: 'Vector DB', value: 'Pinecone (US-East)' },
        { label: 'Cache', value: 'Redis Cloud' },
        { label: 'CI/CD', value: 'GitHub Actions + Vercel' },
      ],
    },

    features: [
      {
        icon: Cpu,
        title: 'Advanced AI Models',
        points: [
          'GPT-4 integration cho conversation',
          'Custom ML models cho specific tasks',
          'Real-time learning và adaptation',
          'Multi-language support (30+ ngôn ngữ)',
        ],
        color: 'cyan',
      },
      {
        icon: Zap,
        title: 'Automation Workflows',
        points: [
          'Drag-and-drop workflow builder',
          'Pre-built templates cho common tasks',
          'Conditional logic và branching',
          'Scheduled và trigger-based execution',
        ],
        color: 'blue',
      },
      {
        icon: Database,
        title: 'Data Management',
        points: [
          'Vector database cho AI embeddings',
          'Real-time data synchronization',
          'Advanced search và filtering',
          'Data encryption và security',
        ],
        color: 'green',
      },
      {
        icon: MessageSquare,
        title: 'Multi-Channel Integration',
        points: [
          'Email, SMS, WhatsApp, Telegram',
          'Social media platforms',
          'Website chat widget',
          'API cho custom integrations',
        ],
        color: 'cyan',
      },
      {
        icon: BarChart3,
        title: 'Analytics & Insights',
        points: [
          'Real-time performance dashboard',
          'AI accuracy metrics',
          'User behavior analysis',
          'Custom reports và exports',
        ],
        color: 'blue',
      },
      {
        icon: Users,
        title: 'Team Collaboration',
        points: [
          'Multi-user workspace',
          'Role-based access control',
          'Audit logs và version history',
          'Shared templates và workflows',
        ],
        color: 'green',
      },
    ],

    metrics: [
      { label: 'AI Requests', value: '50K+', unit: 'Per Day', trend: '+180%' },
      { label: 'Active Agents', value: '2,500+', unit: 'Agents', trend: '+220%' },
      { label: 'Businesses', value: '800+', unit: 'Customers', trend: '+150%' },
      { label: 'Accuracy', value: '94.5%', unit: 'AI Score', trend: '+8%' },
    ],
    barData: [
      { name: 'Q1', value: 12000, target: 10000 },
      { name: 'Q2', value: 25000, target: 20000 },
      { name: 'Q3', value: 38000, target: 35000 },
      { name: 'Q4', value: 50000, target: 45000 },
    ],
    lineData: [
      { month: 'T7', users: 300, performance: 85 },
      { month: 'T8', users: 450, performance: 88 },
      { month: 'T9', users: 550, performance: 90 },
      { month: 'T10', users: 650, performance: 92 },
      { month: 'T11', users: 750, performance: 94 },
      { month: 'T12', users: 800, performance: 95 },
    ],
  },

  // SaboHub Project
  {
    id: 3,
    name: 'SaboHub',
    slug: 'sabohub',
    description: 'Giải pháp quản lý toàn diện cho doanh nghiệp',
    progress: 90,
    category: 'Business Management Platform',
    icon: Database,
    productionUrl: 'https://sabohub.vercel.app',

    heroTitle: 'SABOHUB',
    heroDescription:
      'Nền tảng quản lý kinh doanh thông minh được thiết kế đặc biệt cho các doanh nghiệp dịch vụ. 8 hệ thống tích hợp: CRM, HRM, POS, Kho, Lịch hẹn, Marketing, Báo cáo & Phân tích - Quản Lý Thông Minh, Kinh Doanh Hiệu Quả',
    heroStats: [
      { icon: Database, label: 'Hệ Thống', value: '8+', color: 'neon-cyan' },
      { icon: Users, label: 'Doanh Nghiệp', value: '500+', color: 'neon-blue' },
      { icon: Zap, label: 'Đồng Bộ Realtime', value: '100%', color: 'neon-green' },
    ],

    overviewTitle: 'TỔNG QUAN DỰ ÁN',
    overviewDescription:
      'SABOHUB là nền tảng quản lý kinh doanh thông minh được thiết kế đặc biệt cho các doanh nghiệp dịch vụ, đặc biệt là hệ thống câu lạc bộ bi-a và các ngành dịch vụ tương tự. Với giao diện thân thiện và công nghệ tiên tiến, SABOHUB giúp chủ doanh nghiệp và quản lý vận hành mọi hoạt động kinh doanh một cách hiệu quả từ một ứng dụng duy nhất.',
    objectives: [
      'Tích hợp 8 hệ thống quản lý trong 1 ứng dụng duy nhất',
      'Đồng bộ dữ liệu theo thời gian thực trên mọi thiết bị',
      'Hệ thống phân quyền theo vai trò (RBAC) bảo mật cao',
      'Hỗ trợ đa nền tảng: iOS, Android, Web Browser',
    ],
    impacts: [
      'Giảm 70% thời gian quản lý hành chính',
      'Tăng hiệu quả vận hành và phục vụ khách hàng',
      'Tiết kiệm chi phí với giải pháp all-in-one',
      'Báo cáo thông minh hỗ trợ ra quyết định',
    ],

    techNodes: [
      { id: 1, icon: Smartphone, label: 'Flutter', x: 50, y: 20, color: 'neon-cyan' },
      { id: 2, icon: Database, label: 'Supabase', x: 25, y: 50, color: 'neon-green' },
      { id: 3, icon: Cloud, label: 'PostgreSQL', x: 75, y: 50, color: 'neon-blue' },
      { id: 4, icon: Zap, label: 'Realtime', x: 50, y: 80, color: 'neon-cyan' },
    ],
    techConnections: [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
    ],

    techStack: [
      {
        name: 'Flutter/Dart',
        category: 'Framework',
        icon: Smartphone,
        iconifyIcon: 'logos:flutter',
      },
      {
        name: 'Material Design',
        category: 'UI/UX',
        icon: Smartphone,
        iconifyIcon: 'logos:material-ui',
      },
      { name: 'Supabase', category: 'Backend', icon: Database, iconifyIcon: 'logos:supabase-icon' },
      { name: 'PostgreSQL', category: 'Database', icon: Database, iconifyIcon: 'logos:postgresql' },
      {
        name: 'Realtime Sync',
        category: 'Backend',
        icon: Zap,
        iconifyIcon: 'vscode-icons:file-type-firebase',
      },
      { name: 'Riverpod', category: 'State Management', icon: Cpu, iconifyIcon: 'logos:flutter' },
      {
        name: 'Clean Architecture',
        category: 'Architecture',
        icon: Target,
        iconifyIcon: 'mdi:folder-cog',
      },
      { name: 'GPS Location', category: 'Service', icon: Target, iconifyIcon: 'mdi:map-marker' },
    ],

    technicalDetails: {
      performance: [
        { label: 'App Launch Time', value: '1.5s' },
        { label: 'Sync Speed', value: 'Real-time' },
        { label: 'Frame Rate', value: '60 FPS' },
        { label: 'Bundle Size', value: '38 MB' },
      ],
      tools: [
        { name: 'VS Code', iconifyIcon: 'logos:visual-studio-code' },
        { name: 'Android Studio', iconifyIcon: 'devicon:androidstudio' },
        { name: 'Xcode', iconifyIcon: 'devicon:xcode' },
        { name: 'Figma', iconifyIcon: 'logos:figma' },
        { name: 'Supabase Studio', iconifyIcon: 'logos:supabase-icon' },
        { name: 'Git & GitHub', iconifyIcon: 'logos:github-icon' },
        { name: 'Postman', iconifyIcon: 'logos:postman-icon' },
      ],
      infrastructure: [
        { label: 'Database', value: 'Supabase PostgreSQL (Cloud)' },
        { label: 'Authentication', value: 'Supabase Auth + RBAC' },
        { label: 'Storage', value: 'Supabase Storage (Images, Files)' },
        { label: 'Realtime', value: 'WebSocket + PostgreSQL CDC' },
        { label: 'CI/CD', value: 'GitHub Actions + Fastlane' },
        { label: 'Monitoring', value: 'Supabase Dashboard + Sentry' },
      ],
    },

    features: [
      {
        icon: CheckCircle2,
        title: 'Quản Lý Công Việc Thông Minh',
        color: 'cyan' as const,
        points: [
          'Phân công rõ ràng - Mỗi người nhận việc ngay trên app',
          'Theo dõi thời gian thực - Biết ai đang làm gì, việc nào tồn đọng',
          'Tự động nhắc nhở - Hệ thống thông báo cho nhân viên',
          'Giảm 80% thời gian nhắc nhở, tăng 60% hiệu suất hoàn thành',
        ],
      },
      {
        icon: ShoppingCart,
        title: 'Quản Lý Đơn Hàng',
        color: 'blue' as const,
        points: [
          'Order bằng app - Rõ ràng, chính xác, gửi ngay cho bếp',
          'Tính tiền tự động - Không sai, không thiếu',
          'Gán bàn cho mỗi order - Phục vụ đúng bàn, không nhầm lẫn',
          'Giảm 90% sai sót, tăng 50% tốc độ phục vụ',
        ],
      },
      {
        icon: Utensils,
        title: 'Quản Lý Thực Đơn',
        color: 'green' as const,
        points: [
          'Cập nhật giá ngay trên app - Tất cả nhân viên thấy cùng lúc',
          'Đánh dấu món hết - Không nhận order món không có',
          'Thống kê món bán chạy - Nhập hàng thông minh',
          'Tiết kiệm 100% chi phí in menu, linh hoạt thay đổi giá',
        ],
      },
      {
        icon: Users,
        title: 'Quản Lý Bàn',
        color: 'cyan' as const,
        points: [
          'Sơ đồ bàn trực quan - Nhìn là biết bàn nào trống',
          'Đặt bàn qua app - Lưu thông tin, không quên, không trùng',
          'Gán order cho từng bàn - Biết bàn nào chi tiêu bao nhiêu',
          'Tăng 30% hiệu suất sử dụng bàn, không còn đặt trùng',
        ],
      },
      {
        icon: Clock,
        title: 'Quản Lý Phiên Làm Việc',
        color: 'blue' as const,
        points: [
          'Check-in/Check-out tự động - Ghi nhận chính xác từng phút',
          'Tính toán tự động - Số giờ làm chính xác, không tranh cãi',
          'Báo cáo tổng hợp - Dễ dàng tính lương cuối tháng',
          'Tiết kiệm 15% chi phí lương, minh bạch 100%',
        ],
      },
      {
        icon: CreditCard,
        title: 'Quản Lý Thanh Toán',
        color: 'green' as const,
        points: [
          'Ghi nhận mọi khoản thu - Tiền mặt, chuyển khoản, thẻ, ví điện tử',
          'Đối chiếu tự động - Tổng order vs tổng thu',
          'Thống kê thời gian thực - Biết doanh thu ngay lập tức',
          'Giảm 95% thất thoát, biết doanh thu mọi lúc',
        ],
      },
      {
        icon: Calendar,
        title: 'Quản Lý Lịch Làm Việc',
        color: 'cyan' as const,
        points: [
          'Xếp lịch trực quan - Kéo thả đơn giản, tự động cảnh báo trùng',
          'Nhân viên xem lịch ngay trên app - Không cần hỏi',
          'Đăng ký nghỉ phép qua app - Có lưu, có phê duyệt',
          'Giảm 70% thời gian xếp lịch, không còn thiếu người',
        ],
      },
      {
        icon: MapPin,
        title: 'Chấm Công GPS',
        color: 'blue' as const,
        points: [
          'Chấm công với GPS - Phải ở cơ sở mới chấm được',
          'Ghi nhận vị trí chính xác - Biết nhân viên ở đâu khi chấm',
          'Tính công tự động - Đúng giờ, muộn, sớm, nghỉ đều ghi nhận',
          'Chặn 100% chấm công hộ, tiết kiệm 10 giờ/tháng tính công',
        ],
      },
      {
        icon: BarChart3,
        title: 'Bảng Điều Khiển CEO',
        color: 'blue' as const,
        points: [
          'Dashboard tổng hợp - Doanh thu, nhân sự, order trên 1 màn hình',
          'Dữ liệu thời gian thực - Biết ngay khi có thay đổi',
          'Truy cập 8 hệ thống từ 1 nơi - Không cần mở nhiều app',
          'Tiết kiệm 90% thời gian họp, ra quyết định nhanh hơn 5 lần',
        ],
      },
      {
        icon: Shield,
        title: 'Phân Quyền Thông Minh',
        color: 'green' as const,
        points: [
          'Phân quyền 4 cấp - CEO, Manager, Shift Leader, Staff',
          'Mỗi người chỉ thấy dữ liệu phù hợp với vai trò',
          'Bảo mật theo chi nhánh - Không xem dữ liệu chi nhánh khác',
          'An toàn dữ liệu 100%, không lo bị lộ thông tin kinh doanh',
        ],
      },
    ],

    metrics: [
      { label: 'Doanh Nghiệp', value: '500+', unit: 'Customers', trend: '+120%' },
      { label: 'Người Dùng', value: '5K+', unit: 'Active Users', trend: '+150%' },
      { label: 'Giao Dịch', value: '100K+', unit: 'Per Month', trend: '+200%' },
      { label: 'Uptime', value: '99.9%', unit: 'Reliability', trend: '+0.2%' },
    ],
    barData: [
      { name: 'Q1', value: 8000, target: 7000 },
      { name: 'Q2', value: 15000, target: 12000 },
      { name: 'Q3', value: 22000, target: 18000 },
      { name: 'Q4', value: 28000, target: 25000 },
    ],
    lineData: [
      { month: 'T7', users: 200, performance: 80 },
      { month: 'T8', users: 300, performance: 85 },
      { month: 'T9', users: 400, performance: 88 },
      { month: 'T10', users: 500, performance: 92 },
      { month: 'T11', users: 600, performance: 95 },
      { month: 'T12', users: 700, performance: 98 },
    ],
  },

  // AINewbieVN - AI Community Platform
  {
    id: 4,
    name: 'AINewbieVN',
    slug: 'ainewbievn',
    description: 'Cộng đồng AI & Workflow tự động hóa',
    progress: 95,
    category: 'AI Platform',
    icon: Cpu,
    productionUrl: 'https://www.ainewbievn.shop',

    heroTitle: 'AINEWBIEVN',
    heroDescription:
      'Nền tảng hàng đầu về sản phẩm số AI, workflow tự động hóa, và kết nối nhân tài công nghệ tại Việt Nam',
    heroStats: [
      { icon: Users, label: 'Thành Viên', value: '5,000+', color: 'cyan' },
      { icon: Zap, label: 'Workflows', value: '1,200+', color: 'blue' },
      { icon: Trophy, label: 'Dự Án', value: '300+', color: 'green' },
    ],

    overviewTitle: 'Cộng Đồng AI Hàng Đầu Việt Nam',
    overviewDescription:
      'AINewbieVN là nền tảng kết nối và phát triển cộng đồng AI lớn nhất tại Việt Nam, cung cấp workflow tự động hóa, sản phẩm AI, và networking cho 5000+ chuyên gia công nghệ.',

    objectives: [
      'Xây dựng cộng đồng AI lớn nhất Việt Nam với 5000+ thành viên',
      'Cung cấp 1200+ workflows tự động hóa cho doanh nghiệp',
      'Kết nối 300+ dự án AI và nhân tài công nghệ',
      'Đào tạo và phát triển kỹ năng AI cho cộng đồng',
    ],

    impacts: [
      '5000+ chuyên gia AI và developer tham gia cộng đồng',
      '1200+ workflows giúp doanh nghiệp tiết kiệm 40% thời gian',
      '300+ dự án AI được triển khai thành công',
      'Tăng 200% nhận thức về AI trong cộng đồng công nghệ VN',
    ],

    techNodes: [
      { id: 1, icon: Cpu, label: 'React', x: 30, y: 30, color: 'neon-cyan' },
      { id: 2, icon: Zap, label: 'TypeScript', x: 70, y: 30, color: 'neon-blue' },
      { id: 3, icon: Cloud, label: 'shadcn/ui', x: 30, y: 70, color: 'neon-green' },
      { id: 4, icon: Database, label: 'Tailwind', x: 70, y: 70, color: 'neon-cyan' },
    ],
    techConnections: [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
    ],

    techStack: [
      { name: 'React 18', category: 'Frontend', icon: Cpu, iconifyIcon: 'logos:react' },
      { name: 'TypeScript', category: 'Language', icon: Cpu, iconifyIcon: 'logos:typescript-icon' },
      { name: 'Vite', category: 'Build Tool', icon: Zap, iconifyIcon: 'logos:vitejs' },
      {
        name: 'Tailwind CSS',
        category: 'Styling',
        icon: Smartphone,
        iconifyIcon: 'logos:tailwindcss-icon',
      },
      {
        name: 'shadcn/ui',
        category: 'UI Library',
        icon: Smartphone,
        iconifyIcon: 'simple-icons:shadcnui',
      },
      {
        name: 'Framer Motion',
        category: 'Animation',
        icon: Zap,
        iconifyIcon: 'tabler:brand-framer-motion',
      },
      { name: 'Lucide Icons', category: 'Icons', icon: Target, iconifyIcon: 'simple-icons:lucide' },
      {
        name: 'React Router',
        category: 'Routing',
        icon: Target,
        iconifyIcon: 'logos:react-router',
      },
    ],

    technicalDetails: {
      performance: [
        { label: 'Page Load', value: '0.8s' },
        { label: 'First Paint', value: '1.2s' },
        { label: 'Interactive', value: '1.5s' },
        { label: 'Bundle Size', value: '245 KB' },
      ],
      tools: [
        { name: 'VS Code', iconifyIcon: 'logos:visual-studio-code' },
        { name: 'Vite', iconifyIcon: 'logos:vitejs' },
        { name: 'ESLint', iconifyIcon: 'logos:eslint' },
        { name: 'Prettier', iconifyIcon: 'logos:prettier' },
        { name: 'Figma', iconifyIcon: 'logos:figma' },
        { name: 'Git & GitHub', iconifyIcon: 'logos:github-icon' },
        { name: 'Vercel', iconifyIcon: 'logos:vercel-icon' },
      ],
      infrastructure: [
        { label: 'Hosting', value: 'Vercel Edge Network' },
        { label: 'CDN', value: 'Vercel CDN (Global)' },
        { label: 'SSL', value: 'Auto SSL/TLS' },
        { label: 'Deploy', value: 'Auto Deploy on Push' },
        { label: 'Analytics', value: 'Vercel Analytics' },
        { label: 'Monitoring', value: 'Real-time Performance' },
      ],
    },

    features: [
      {
        icon: Cpu,
        title: 'AI Technology Platform',
        color: 'cyan' as const,
        points: [
          'Workflow automation với AI - Tự động hóa quy trình',
          'AI product marketplace - Kết nối sản phẩm AI',
          'Community-driven learning - Học tập cộng đồng',
          '5000+ thành viên, 1200+ workflows, 300+ dự án',
        ],
      },
      {
        icon: Users,
        title: 'Talent Network',
        color: 'blue' as const,
        points: [
          'Kết nối chuyên gia AI & developers',
          'Job board cho AI positions',
          'Mentorship programs - Chương trình mentor',
          'Networking events - Sự kiện kết nối',
        ],
      },
      {
        icon: Zap,
        title: 'Workflow Library',
        color: 'green' as const,
        points: [
          '1200+ ready-to-use workflows',
          'Templates for business automation',
          'Integration với popular tools',
          'Tiết kiệm 40% thời gian cho doanh nghiệp',
        ],
      },
      {
        icon: Database,
        title: 'Knowledge Hub',
        color: 'cyan' as const,
        points: [
          'Tutorials & documentation đầy đủ',
          'Best practices for AI implementation',
          'Case studies from real projects',
          'Resource library cho developers',
        ],
      },
      {
        icon: Target,
        title: 'Project Showcase',
        color: 'blue' as const,
        points: [
          '300+ AI projects featured',
          'Demo & code samples',
          'Collaboration opportunities',
          'Feedback từ cộng đồng chuyên gia',
        ],
      },
    ],

    metrics: [
      { label: 'Thành Viên', value: '5,000+', unit: 'Members', trend: '+250%' },
      { label: 'Workflows', value: '1,200+', unit: 'Templates', trend: '+180%' },
      { label: 'Dự Án', value: '300+', unit: 'Projects', trend: '+150%' },
      { label: 'Engagement', value: '85%', unit: 'Active Rate', trend: '+20%' },
    ],
    barData: [
      { name: 'Q1', value: 1200, target: 1000 },
      { name: 'Q2', value: 2500, target: 2000 },
      { name: 'Q3', value: 3800, target: 3500 },
      { name: 'Q4', value: 5000, target: 4500 },
    ],
    lineData: [
      { month: 'T7', users: 800, performance: 70 },
      { month: 'T8', users: 1500, performance: 75 },
      { month: 'T9', users: 2500, performance: 78 },
      { month: 'T10', users: 3500, performance: 82 },
      { month: 'T11', users: 4200, performance: 85 },
      { month: 'T12', users: 5000, performance: 88 },
    ],
  },

  // Long Sang Portfolio - Main Portfolio Website
  {
    id: 5,
    name: 'Long Sang Portfolio',
    slug: 'long-sang-portfolio',
    description: 'Portfolio & AI Platform với Marketplace, Academy và Investment Portal',
    progress: 95,
    category: 'Portfolio Platform',
    icon: Target,
    productionUrl: 'https://longsang.org',

    heroTitle: 'LONG SANG PORTFOLIO',
    heroDescription:
      'Portfolio Website chuyên nghiệp với AI Marketplace, Academy đào tạo AI và Investment Portal cho các dự án công nghệ',
    heroStats: [
      { icon: Zap, label: 'AI Agents', value: '50+', color: 'neon-cyan' },
      { icon: Users, label: 'Khóa Học', value: '20+', color: 'neon-blue' },
      { icon: Trophy, label: 'Dự Án', value: '10+', color: 'neon-green' },
    ],

    overviewTitle: 'TỔNG QUAN DỰ ÁN',
    overviewDescription:
      'Long Sang Portfolio là nền tảng portfolio đa năng, tích hợp AI Marketplace để khám phá và kích hoạt các AI Agents, Academy cho các khóa học AI, và Investment Portal để thu hút đầu tư cho các dự án công nghệ.',
    objectives: [
      'Xây dựng portfolio chuyên nghiệp với giao diện hiện đại',
      'Cung cấp nền tảng AI Marketplace với các AI Agents đa dạng',
      'Tạo Academy đào tạo AI với các khóa học chất lượng',
      'Phát triển Investment Portal để kết nối nhà đầu tư',
    ],
    impacts: [
      '50+ AI Agents sẵn sàng kích hoạt cho người dùng',
      '20+ khóa học AI từ cơ bản đến nâng cao',
      '10+ dự án showcase với chi tiết đầy đủ',
      'Hệ thống đặt lịch tư vấn và liên hệ tích hợp',
    ],

    techNodes: [
      { id: 1, icon: Cpu, label: 'React 18', x: 50, y: 20, color: 'neon-cyan' },
      { id: 2, icon: Zap, label: 'TypeScript', x: 20, y: 50, color: 'neon-blue' },
      { id: 3, icon: Database, label: 'Supabase', x: 80, y: 50, color: 'neon-green' },
      { id: 4, icon: Cloud, label: 'Vercel', x: 35, y: 80, color: 'neon-cyan' },
      { id: 5, icon: MessageSquare, label: 'Express API', x: 65, y: 80, color: 'neon-blue' },
    ],
    techConnections: [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 5 },
    ],

    techStack: [
      { name: 'React 18', category: 'Frontend', icon: Cpu, iconifyIcon: 'logos:react' },
      { name: 'TypeScript', category: 'Language', icon: Cpu, iconifyIcon: 'logos:typescript-icon' },
      { name: 'Vite', category: 'Build Tool', icon: Zap, iconifyIcon: 'logos:vitejs' },
      {
        name: 'Tailwind CSS',
        category: 'Styling',
        icon: Smartphone,
        iconifyIcon: 'logos:tailwindcss-icon',
      },
      {
        name: 'shadcn/ui',
        category: 'UI Library',
        icon: Smartphone,
        iconifyIcon: 'simple-icons:shadcnui',
      },
      { name: 'Supabase', category: 'Backend', icon: Database, iconifyIcon: 'logos:supabase-icon' },
      { name: 'Express.js', category: 'API Server', icon: Cloud, iconifyIcon: 'logos:express' },
      {
        name: 'TanStack Query',
        category: 'State',
        icon: Zap,
        iconifyIcon: 'logos:react-query-icon',
      },
      {
        name: 'Framer Motion',
        category: 'Animation',
        icon: Zap,
        iconifyIcon: 'tabler:brand-framer-motion',
      },
      { name: 'i18next', category: 'i18n', icon: Target, iconifyIcon: 'simple-icons:i18next' },
    ],

    technicalDetails: {
      performance: [
        { label: 'Page Load', value: '0.8s' },
        { label: 'First Paint', value: '1.2s' },
        { label: 'Lighthouse Score', value: '95+' },
        { label: 'Bundle Size', value: '250 KB' },
      ],
      tools: [
        { name: 'VS Code', iconifyIcon: 'logos:visual-studio-code' },
        { name: 'Vite', iconifyIcon: 'logos:vitejs' },
        { name: 'Vitest', iconifyIcon: 'logos:vitest' },
        { name: 'ESLint', iconifyIcon: 'logos:eslint' },
        { name: 'Figma', iconifyIcon: 'logos:figma' },
        { name: 'Git & GitHub', iconifyIcon: 'logos:github-icon' },
        { name: 'Vercel', iconifyIcon: 'logos:vercel-icon' },
        { name: 'Supabase Studio', iconifyIcon: 'logos:supabase-icon' },
      ],
      infrastructure: [
        { label: 'Frontend', value: 'Vercel Edge Network' },
        { label: 'API Server', value: 'Express.js (Port 3001)' },
        { label: 'Database', value: 'Supabase PostgreSQL' },
        { label: 'Auth', value: 'Supabase Auth (Magic Link)' },
        { label: 'CDN', value: 'Vercel CDN (Global)' },
        { label: 'CI/CD', value: 'GitHub Actions + Vercel' },
      ],
    },

    features: [
      {
        icon: Target,
        title: 'Portfolio Showcase',
        points: [
          'Giới thiệu bản thân và dịch vụ chuyên nghiệp',
          'Timeline các dự án đã thực hiện',
          'Tech Stack hiển thị trực quan',
          'CV tương tác với thiết kế hiện đại',
        ],
        color: 'cyan',
      },
      {
        icon: Cpu,
        title: 'AI Marketplace',
        points: [
          '50+ AI Agents đa lĩnh vực',
          'Xem chi tiết và giá từng agent',
          'Kích hoạt agent dễ dàng',
          'Quản lý agent trong dashboard',
        ],
        color: 'blue',
      },
      {
        icon: Users,
        title: 'Academy - Đào Tạo AI',
        points: [
          '20+ khóa học từ cơ bản đến nâng cao',
          'Nội dung cập nhật liên tục',
          'Hệ thống học tập tương tác',
          'Chứng chỉ hoàn thành khóa học',
        ],
        color: 'green',
      },
      {
        icon: Coins,
        title: 'Investment Portal',
        points: [
          'Showcase các dự án cần đầu tư',
          'Chi tiết tài chính và lộ trình',
          'Form đăng ký quan tâm đầu tư',
          'Theo dõi tiến độ dự án',
        ],
        color: 'cyan',
      },
      {
        icon: Calendar,
        title: 'Consultation Booking',
        points: [
          'Đặt lịch tư vấn trực tuyến',
          'Chọn thời gian phù hợp',
          'Tích hợp với Google Calendar',
          'Nhận nhắc nhở tự động',
        ],
        color: 'blue',
      },
      {
        icon: MessageSquare,
        title: 'AI Chat Support',
        points: [
          'Chat với AI assistant 24/7',
          'Trả lời câu hỏi về dịch vụ',
          'Hỗ trợ đa ngôn ngữ',
          'Sticky chat widget tiện lợi',
        ],
        color: 'green',
      },
    ],

    metrics: [
      { label: 'AI Agents', value: '50+', unit: 'Agents', trend: '+150%' },
      { label: 'Khóa Học', value: '20+', unit: 'Courses', trend: '+100%' },
      { label: 'Dự Án', value: '10+', unit: 'Projects', trend: '+200%' },
      { label: 'Performance', value: '95+', unit: 'Lighthouse', trend: '+10%' },
    ],
    barData: [
      { name: 'Q1', value: 20, target: 15 },
      { name: 'Q2', value: 35, target: 30 },
      { name: 'Q3', value: 45, target: 40 },
      { name: 'Q4', value: 50, target: 50 },
    ],
    lineData: [
      { month: 'T7', users: 100, performance: 85 },
      { month: 'T8', users: 200, performance: 88 },
      { month: 'T9', users: 350, performance: 90 },
      { month: 'T10', users: 500, performance: 92 },
      { month: 'T11', users: 700, performance: 94 },
      { month: 'T12', users: 1000, performance: 95 },
    ],
  },
];
