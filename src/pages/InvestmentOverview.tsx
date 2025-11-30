import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { 
  TrendingUp, Users, Target, Sparkles, 
  Shield, Award, Zap, ChevronRight,
  DollarSign, BarChart3, Trophy, Rocket
} from "lucide-react";
import { projectsData } from "@/data/projects-data";
import { GlowCard } from "@/components/GlowCard";

const InvestmentOverview = () => {
  const { slug } = useParams();
  const project = projectsData.find(p => p.slug === slug) || projectsData[0];

  // Mock data - sẽ được thay thế bằng real data từ investment-data.ts
  const investmentMetrics = [
    {
      icon: DollarSign,
      label: "Vốn Huy Động",
      value: "50 tỷ VNĐ",
      subtext: "Series A Round",
      color: "yellow"
    },
    {
      icon: TrendingUp,
      label: "Định Giá",
      value: "200 tỷ VNĐ",
      subtext: "Pre-money valuation",
      color: "orange"
    },
    {
      icon: Users,
      label: "Nhà Đầu Tư",
      value: "50+",
      subtext: "Đã cam kết",
      color: "green"
    },
    {
      icon: Trophy,
      label: "ROI Dự Kiến",
      value: "3-5x",
      subtext: "Trong 3-5 năm",
      color: "cyan"
    }
  ];

  const highlights = [
    {
      icon: Rocket,
      title: "Tăng Trưởng Vượt Trội",
      description: "200% YoY trong 2 năm qua với 50K+ người dùng active",
      stats: "200% YoY"
    },
    {
      icon: Target,
      title: "Thị Trường Khổng Lồ",
      description: "TAM $500M tại Việt Nam, đang nắm giữ 15% market share",
      stats: "$500M TAM"
    },
    {
      icon: Shield,
      title: "Công Nghệ Độc Quyền",
      description: "AI engine được cấp bằng sáng chế, competitive moat vững chắc",
      stats: "Patent Pending"
    },
    {
      icon: Sparkles,
      title: "Đội Ngũ Xuất Sắc",
      description: "20+ experts từ Google, Meta, với track record proven",
      stats: "20+ Experts"
    }
  ];

  const timeline = [
    { quarter: "Q1 2025", milestone: "Product Launch", status: "completed" },
    { quarter: "Q2 2025", milestone: "10K Users", status: "completed" },
    { quarter: "Q3 2025", milestone: "Series A Funding", status: "in-progress" },
    { quarter: "Q4 2025", milestone: "50K Users", status: "planned" },
    { quarter: "Q1 2026", milestone: "Breakeven", status: "planned" },
    { quarter: "Q2 2026", milestone: "Market Leadership", status: "planned" }
  ];

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 mb-6"
        >
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-semibold text-yellow-500">Series A Investment Opportunity</span>
        </motion.div>

        <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent">
            Đầu Tư Vào Tương Lai
          </span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Tham gia cùng {project.name} trong hành trình chinh phục thị trường với công nghệ tiên tiến và mô hình kinh doanh đã được chứng minh
        </p>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {investmentMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <GlowCard className="p-6 text-center hover:scale-105 transition-transform duration-300">
                  <div className="inline-flex p-3 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 mb-4">
                    <Icon className="w-6 h-6 text-yellow-500" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
                  <p className="font-display text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-1">
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{metric.subtext}</p>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Investment Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16"
      >
        <h2 className="font-display text-3xl font-bold text-center mb-12">
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Tại Sao Đầu Tư Ngay?
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {highlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlowCard className="p-8 h-full group hover:border-yellow-500/50 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-xl text-yellow-500">{highlight.title}</h3>
                        <span className="text-xs font-mono px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500">
                          {highlight.stats}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{highlight.description}</p>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16"
      >
        <h2 className="font-display text-3xl font-bold text-center mb-12">
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Lộ Trình Phát Triển
          </span>
        </h2>

        <GlowCard className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`
                  w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center
                  ${item.status === 'completed' ? 'bg-green-500/20 border-2 border-green-500' : 
                    item.status === 'in-progress' ? 'bg-yellow-500/20 border-2 border-yellow-500 animate-pulse' :
                    'bg-gray-500/10 border-2 border-gray-500/30'}
                `}>
                  {item.status === 'completed' && <Zap className="w-6 h-6 text-green-500" />}
                  {item.status === 'in-progress' && <BarChart3 className="w-6 h-6 text-yellow-500" />}
                  {item.status === 'planned' && <Target className="w-6 h-6 text-gray-500" />}
                </div>
                <p className="text-xs font-mono text-yellow-500 mb-1">{item.quarter}</p>
                <p className="text-sm font-semibold">{item.milestone}</p>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <GlowCard className="p-12 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
          <h2 className="font-display text-3xl font-bold mb-4">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Sẵn Sàng Tham Gia?
            </span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Khám phá chi tiết lộ trình, tài chính dự báo và đăng ký tư vấn đầu tư ngay hôm nay
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all inline-flex items-center justify-center gap-2"
            >
              Xem Lộ Trình Chi Tiết
              <ChevronRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-neon-cyan/20 to-neon-blue/20 hover:from-neon-cyan/30 hover:to-neon-blue/30 text-white font-bold text-lg rounded-xl border-2 border-neon-cyan/50 hover:border-neon-cyan transition-all inline-flex items-center justify-center gap-2"
            >
              Tải Pitch Deck
              <Award className="w-5 h-5" />
            </motion.button>
          </div>
        </GlowCard>
      </motion.div>
    </div>
  );
};

export default InvestmentOverview;
