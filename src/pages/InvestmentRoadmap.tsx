import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { 
  Rocket, Target, TrendingUp, Users, Trophy,
  CheckCircle2, Clock, Zap, Award,
  BarChart3, Globe, Shield, Sparkles
} from "lucide-react";
import { projectsData } from "@/data/projects-data";
import { GlowCard } from "@/components/GlowCard";

const InvestmentRoadmap = () => {
  const { slug } = useParams();
  const project = projectsData.find(p => p.slug === slug) || projectsData[0];

  const roadmapPhases = [
    {
      year: "2024-2025",
      title: "Foundation Phase",
      subtitle: "Xây Dựng Nền Tảng",
      status: "completed" as const,
      icon: Rocket,
      color: "green",
      milestones: [
        "✓ MVP Launch - Thành công vượt mục tiêu",
        "✓ First 10,000 Users - Đạt trong 3 tháng",
        "✓ Product-Market Fit Validated",
        "✓ Key Partnerships Established"
      ],
      metrics: [
        { label: "Users", value: "10,000+", icon: Users },
        { label: "Revenue", value: "$500K", icon: BarChart3 },
        { label: "NPS Score", value: "72", icon: Award }
      ]
    },
    {
      year: "2025-2026",
      title: "Growth Phase",
      subtitle: "Tăng Trưởng & Mở Rộng",
      status: "in-progress" as const,
      icon: TrendingUp,
      color: "yellow",
      milestones: [
        "⚡ Series A Funding - $50B VNĐ",
        "⚡ Scale to 100,000 Users",
        "⚡ Expand to 3 New Markets",
        "⚡ Launch Premium Features"
      ],
      metrics: [
        { label: "Target Users", value: "100K", icon: Target },
        { label: "ARR Goal", value: "$5M", icon: BarChart3 },
        { label: "Team Size", value: "50+", icon: Users }
      ]
    },
    {
      year: "2026-2027",
      title: "Scale Phase",
      subtitle: "Chiếm Lĩnh Thị Trường",
      status: "planned" as const,
      icon: Globe,
      color: "cyan",
      milestones: [
        "→ Reach 500,000 Users",
        "→ Achieve Profitability",
        "→ Series B Funding Round",
        "→ International Expansion"
      ],
      metrics: [
        { label: "Users", value: "500K", icon: Users },
        { label: "ARR", value: "$20M", icon: BarChart3 },
        { label: "Markets", value: "5+", icon: Globe }
      ]
    },
    {
      year: "2027-2029",
      title: "Dominance Phase",
      subtitle: "Dẫn Đầu Ngành",
      status: "planned" as const,
      icon: Award,
      color: "blue",
      milestones: [
        "→ 1M+ Users Milestone",
        "→ Market Leadership Position",
        "→ IPO Preparation",
        "→ Strategic Acquisitions"
      ],
      metrics: [
        { label: "Users", value: "1M+", icon: Users },
        { label: "Valuation", value: "$1B", icon: TrendingUp },
        { label: "Market Share", value: "40%", icon: Trophy }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in-progress': return 'yellow';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'in-progress': return Clock;
      default: return Zap;
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mb-6"
        >
          <Sparkles className="w-4 h-4 text-cyan-500" />
          <span className="text-sm font-semibold text-cyan-500">3-5 Year Strategic Roadmap</span>
        </motion.div>

        <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Lộ Trình Phát Triển
          </span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Chi tiết từng giai đoạn phát triển của {project.name} từ Foundation đến Market Dominance
        </p>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 via-yellow-500 to-cyan-500 transform -translate-x-1/2 hidden lg:block" />

        {/* Roadmap Phases */}
        <div className="space-y-24">
          {roadmapPhases.map((phase, index) => {
            const PhaseIcon = phase.icon;
            const StatusIcon = getStatusIcon(phase.status);
            const isLeft = index % 2 === 0;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                <div className={`lg:grid lg:grid-cols-2 gap-12 items-center ${!isLeft && 'lg:grid-flow-dense'}`}>
                  {/* Content Card */}
                  <div className={`${!isLeft && 'lg:col-start-2'}`}>
                    <GlowCard className="p-8 hover:scale-105 transition-transform duration-300">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-xl bg-gradient-to-r from-${phase.color}-500/20 to-${phase.color}-600/20`}>
                            <PhaseIcon className={`w-8 h-8 text-${phase.color}-500`} />
                          </div>
                          <div>
                            <p className="text-sm font-mono text-muted-foreground mb-1">{phase.year}</p>
                            <h3 className="font-display text-2xl font-bold">{phase.title}</h3>
                            <p className="text-sm text-muted-foreground">{phase.subtitle}</p>
                          </div>
                        </div>
                        
                        <div className={`
                          px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold
                          ${phase.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                            phase.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-500 animate-pulse' :
                            'bg-gray-500/20 text-gray-400'}
                        `}>
                          <StatusIcon className="w-3 h-3" />
                          {phase.status === 'completed' ? 'Hoàn Thành' :
                           phase.status === 'in-progress' ? 'Đang Thực Hiện' :
                           'Kế Hoạch'}
                        </div>
                      </div>

                      {/* Milestones */}
                      <div className="mb-6">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Target className="w-4 h-4 text-yellow-500" />
                          Key Milestones
                        </h4>
                        <div className="space-y-2">
                          {phase.milestones.map((milestone, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1">{milestone}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/30">
                        {phase.metrics.map((metric, i) => {
                          const MetricIcon = metric.icon;
                          return (
                            <div key={i} className="text-center">
                              <MetricIcon className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                              <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                              <p className="font-bold text-lg">{metric.value}</p>
                            </div>
                          );
                        })}
                      </div>
                    </GlowCard>
                  </div>

                  {/* Timeline Node (Desktop only) */}
                  <div className="hidden lg:block">
                    <div className={`
                      w-16 h-16 mx-auto rounded-full flex items-center justify-center
                      ${phase.status === 'completed' ? 'bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)]' :
                        phase.status === 'in-progress' ? 'bg-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.5)] animate-pulse' :
                        'bg-gray-600 shadow-[0_0_20px_rgba(75,85,99,0.3)]'}
                    `}>
                      <StatusIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Success Metrics Summary */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-24"
      >
        <GlowCard className="p-12 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 text-center">
          <Shield className="w-16 h-16 mx-auto mb-6 text-cyan-500" />
          <h2 className="font-display text-3xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Cam Kết Minh Bạch
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Chúng tôi cập nhật tiến độ hàng quý với báo cáo chi tiết cho nhà đầu tư.
            Tất cả milestones đều được tracking công khai và minh bạch.
          </p>
        </GlowCard>
      </motion.div>
    </div>
  );
};

export default InvestmentRoadmap;
