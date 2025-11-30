import { LucideIcon } from "lucide-react";

export interface InvestmentFoundation {
  vision: string;
  mission: string;
  problemStatement: string;
  marketOpportunity: string;
  competitiveAdvantages: string[];
}

export interface InvestmentOverview {
  totalFundRaising: number;
  valuation: number;
  minimumInvestment: number;
  expectedROI: string;
  investmentRound: string;
  equityOffered: string;
  useOfFunds: string;
}

export interface RoadmapPhase {
  year: string;
  quarter?: string;
  title: string;
  description: string;
  milestones: string[];
  keyMetrics: {
    label: string;
    value: string;
    trend?: string;
  }[];
  status: "completed" | "in-progress" | "planned";
}

export interface FinancialProjection {
  year: number;
  revenue: number;
  profit: number;
  users: number;
  marketShare: number;
}

export interface UseOfFunds {
  category: string;
  percentage: number;
  amount: number;
  description: string;
  color: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  linkedin?: string;
}

export interface RiskItem {
  category: string;
  description: string;
  impact: "low" | "medium" | "high";
  mitigation: string;
}

export interface InvestorBenefit {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface InvestmentData {
  projectId: number;
  projectName: string;
  projectSlug: string;
  
  foundation: InvestmentFoundation;
  overview: InvestmentOverview;
  roadmap: RoadmapPhase[];
  financials: FinancialProjection[];
  useOfFunds: UseOfFunds[];
  team: TeamMember[];
  risks: RiskItem[];
  investorBenefits: InvestorBenefit[];
  
  legalInfo: {
    companyName: string;
    registrationNumber: string;
    taxCode: string;
    legalRepresentative: string;
    registeredAddress: string;
    businessLicense: string;
    intellectualProperty?: string;
  };
}

// Investment Data for Each Project
export const investmentData: InvestmentData[] = [
  // SABO Arena - Billiards Competition App
  {
    projectId: 1,
    projectName: "SABO Arena",
    projectSlug: "sabo-arena",
    
    foundation: {
      vision: "Trở thành nền tảng thi đấu bi-a số 1 Việt Nam, kết nối 100,000+ người chơi và 1,000+ câu lạc bộ trong hệ sinh thái thể thao điện tử.",
      mission: "Số hóa và chuyên nghiệp hóa môn thể thao bi-a thông qua công nghệ AI, tạo ra trải nghiệm thi đấu công bằng, minh bạch và hấp dẫn cho mọi người.",
      problemStatement: "Thị trường bi-a Việt Nam trị giá $200M/năm nhưng vẫn thiếu một nền tảng số để quản lý giải đấu, xếp hạng cầu thủ và kết nối cộng đồng. 80% giải đấu vẫn dùng giấy tờ, dẫn đến tranh chấp kết quả và thiếu minh bạch.",
      marketOpportunity: "Vietnam có 50,000+ câu lạc bộ bi-a với 5M+ người chơi thường xuyên. Thị trường esports đang bùng nổ với CAGR 25%. SABO Arena là cầu nối giữa bi-a truyền thống và thể thao điện tử, TAM ước tính $500M trong 5 năm.",
      competitiveAdvantages: [
        "AI-powered scoring system với độ chính xác 99.8% (patent pending)",
        "Mạng lưới 200+ câu lạc bộ đối tác sẵn có",
        "Database 50,000+ cầu thủ với ELO rating đã verify",
        "Tích hợp live streaming + betting platform (licensed)",
        "Team có 10+ năm kinh nghiệm trong billiards industry"
      ]
    },

    overview: {
      totalFundRaising: 50000000000, // 50 tỷ VNĐ
      valuation: 200000000000, // 200 tỷ VNĐ
      minimumInvestment: 100000000, // 100M VNĐ
      expectedROI: "3-5x trong 3-5 năm",
      investmentRound: "Series A",
      equityOffered: "15-20%",
      useOfFunds: "Product 40%, Marketing 30%, Partnership 20%, Operations 10%"
    },

    roadmap: [
      {
        year: "2024-2025",
        quarter: "Q4 2024 - Q2 2025",
        title: "Foundation & MVP",
        description: "Xây dựng nền tảng core và validate product-market fit",
        milestones: [
          "✓ Launch MVP với AI scoring engine",
          "✓ Onboard 50 câu lạc bộ pilot",
          "✓ Đạt 10,000 active users",
          "✓ Tổ chức 100+ tournaments",
          "✓ Validated PMF với NPS 72"
        ],
        keyMetrics: [
          { label: "Active Users", value: "10,000+", trend: "up" },
          { label: "Monthly Revenue", value: "$500K", trend: "up" },
          { label: "Club Partners", value: "50", trend: "up" }
        ],
        status: "completed"
      },
      {
        year: "2025-2026",
        quarter: "Q3 2025 - Q2 2026",
        title: "Growth & Scale",
        description: "Mở rộng thị trường và tăng trưởng user base mạnh mẽ",
        milestones: [
          "⚡ Series A funding $50B VNĐ",
          "⚡ Mở rộng 3 thành phố lớn (HCM, HN, ĐN)",
          "⚡ Đạt 100,000 active users",
          "⚡ Launch premium features & monetization",
          "⚡ Partnership với 200+ clubs"
        ],
        keyMetrics: [
          { label: "Target Users", value: "100K", trend: "up" },
          { label: "ARR", value: "$5M", trend: "up" },
          { label: "Team Size", value: "50+", trend: "up" }
        ],
        status: "in-progress"
      },
      {
        year: "2026-2027",
        quarter: "Q3 2026 - Q2 2027",
        title: "Market Leadership",
        description: "Trở thành #1 platform và đạt profitability",
        milestones: [
          "→ Đạt 500,000 active users",
          "→ Profitability achieved",
          "→ Series B funding round",
          "→ Expand to SEA markets (Thailand, Philippines)",
          "→ Launch SABO Pro League với $1M prize pool"
        ],
        keyMetrics: [
          { label: "Users", value: "500K", trend: "up" },
          { label: "ARR", value: "$20M", trend: "up" },
          { label: "Markets", value: "5+", trend: "up" }
        ],
        status: "planned"
      },
      {
        year: "2027-2029",
        quarter: "2027-2029",
        title: "Dominance & IPO",
        description: "Thống lĩnh thị trường và chuẩn bị IPO",
        milestones: [
          "→ 1M+ active users across SEA",
          "→ Market leader với 40% market share",
          "→ IPO preparation",
          "→ M&A smaller competitors",
          "→ International tournaments với ESPN broadcast"
        ],
        keyMetrics: [
          { label: "Users", value: "1M+", trend: "up" },
          { label: "Valuation", value: "$1B", trend: "up" },
          { label: "Market Share", value: "40%", trend: "up" }
        ],
        status: "planned"
      }
    ],

    financials: [
      {
        year: 2024,
        revenue: 500000,
        profit: -200000,
        users: 10000,
        marketShare: 2
      },
      {
        year: 2025,
        revenue: 5000000,
        profit: 500000,
        users: 100000,
        marketShare: 8
      },
      {
        year: 2026,
        revenue: 20000000,
        profit: 4000000,
        users: 500000,
        marketShare: 20
      },
      {
        year: 2027,
        revenue: 50000000,
        profit: 12000000,
        users: 1000000,
        marketShare: 35
      },
      {
        year: 2028,
        revenue: 100000000,
        profit: 30000000,
        users: 2000000,
        marketShare: 45
      }
    ],

    useOfFunds: [
      {
        category: "Product Development",
        percentage: 40,
        amount: 20000000000,
        description: "AI engine upgrade, mobile app v2, live streaming platform",
        color: "from-blue-500 to-cyan-500"
      },
      {
        category: "Marketing & User Acquisition",
        percentage: 30,
        amount: 15000000000,
        description: "Brand campaigns, influencer partnerships, tournament sponsorships",
        color: "from-purple-500 to-pink-500"
      },
      {
        category: "Club Partnerships & Network",
        percentage: 20,
        amount: 10000000000,
        description: "Onboard 500+ clubs, equipment subsidies, training programs",
        color: "from-yellow-500 to-orange-500"
      },
      {
        category: "Operations & Infrastructure",
        percentage: 10,
        amount: 5000000000,
        description: "Team expansion, cloud infrastructure, legal & compliance",
        color: "from-green-500 to-emerald-500"
      }
    ],

    team: [
      {
        name: "Nguyễn Văn A",
        role: "CEO & Co-founder",
        bio: "10+ years in billiards industry, former national champion. Ex-Grab Vietnam GM.",
        avatar: "/team/ceo-sabo.jpg",
        linkedin: "https://linkedin.com/in/nguyenvana"
      },
      {
        name: "Trần Thị B",
        role: "CTO & Co-founder",
        bio: "AI/ML expert from Google Brain. Built computer vision systems for sports analytics.",
        avatar: "/team/cto-sabo.jpg",
        linkedin: "https://linkedin.com/in/tranthib"
      },
      {
        name: "Lê Văn C",
        role: "COO",
        bio: "Ex-McKinsey consultant. Scaled multiple Series A startups to profitability.",
        avatar: "/team/coo-sabo.jpg",
        linkedin: "https://linkedin.com/in/levanc"
      },
      {
        name: "Phạm Thị D",
        role: "Head of Product",
        bio: "Former Product Lead at Tiki. 8 years building consumer apps with 10M+ users.",
        avatar: "/team/product-sabo.jpg",
        linkedin: "https://linkedin.com/in/phamthid"
      }
    ],

    risks: [
      {
        category: "Market Risk",
        description: "Adoption rate có thể chậm hơn dự kiến do cộng đồng bi-a truyền thống chưa quen công nghệ",
        impact: "medium",
        mitigation: "Education programs, free tier generous, offline events để build trust"
      },
      {
        category: "Technology Risk",
        description: "AI scoring system có thể gặp edge cases trong môi trường thực tế phức tạp",
        impact: "low",
        mitigation: "99.8% accuracy đã proven qua 100K+ matches. Continuous training với real data."
      },
      {
        category: "Competition Risk",
        description: "Competitors lớn (VNG, SEA) có thể copy model với resource lớn hơn",
        impact: "medium",
        mitigation: "Network effects mạnh, patent protection, 1st mover advantage với 50K+ users"
      },
      {
        category: "Regulatory Risk",
        description: "Betting/gambling regulations có thể thay đổi, ảnh hưởng revenue stream",
        impact: "high",
        mitigation: "Revenue diversification, licensed platform, proactive compliance team"
      }
    ],

    investorBenefits: [
      {
        title: "High Growth Market",
        description: "Esports & digital sports TAM $500M, CAGR 25% trong 5 năm tới",
        icon: "TrendingUp" as any
      },
      {
        title: "Proven Traction",
        description: "10K users, $500K revenue, NPS 72 trong 6 tháng MVP",
        icon: "Award" as any
      },
      {
        title: "Strong Team",
        description: "Founders từ Google, Grab, McKinsey với 10+ years domain expertise",
        icon: "Users" as any
      },
      {
        title: "Unique Technology",
        description: "AI scoring patent pending, 99.8% accuracy, competitive moat",
        icon: "Shield" as any
      },
      {
        title: "Clear Exit Strategy",
        description: "IPO target 2028 hoặc M&A từ VNG, SEA, Garena",
        icon: "Target" as any
      },
      {
        title: "Investor-Friendly Terms",
        description: "Standard Series A terms, pro-rata rights, board seat available",
        icon: "Handshake" as any
      }
    ],

    legalInfo: {
      companyName: "SABO Arena Technology JSC",
      registrationNumber: "0123456789",
      taxCode: "0123456789-001",
      legalRepresentative: "Nguyễn Văn A",
      registeredAddress: "123 Nguyễn Văn Linh, Q7, TP.HCM",
      businessLicense: "Issued by HCMC Department of Planning and Investment",
      intellectualProperty: "AI Scoring System - Patent Pending (Application #VN2024-12345)"
    }
  }
];
