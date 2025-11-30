import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { TrendingUp, ArrowLeft, Mail, User, Phone, DollarSign, Building2, CheckCircle2, Shield, Award, BarChart3 } from "lucide-react";
import { projectsData } from "@/data/projects-data";
import { GlowCard } from "@/components/GlowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const ProjectInvestment = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  
  const project = projectsData.find(p => p.slug === slug) || projectsData[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      navigate(`/project-showcase/${slug}`);
    }, 3000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 mb-6"
          >
            <CheckCircle2 className="w-12 h-12 text-yellow-500" />
          </motion.div>
          <h2 className="font-display text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4">
            Cảm Ơn Sự Quan Tâm Của Bạn!
          </h2>
          <p className="text-muted-foreground text-lg">
            Đội ngũ tư vấn đầu tư sẽ liên hệ với bạn trong vòng 24h.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/30 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/30 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-5xl">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(`/project-showcase/${slug}`)}
          className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại dự án</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20">
              <TrendingUp className="w-12 h-12 text-yellow-500" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Đầu Tư Vào Dự Án
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tham gia đầu tư vào <span className="text-yellow-500 font-semibold">{project.name}</span> và trở thành một phần của hành trình thành công
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Investment Highlights - Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="font-display text-2xl font-bold text-yellow-500 mb-4">
              Lợi Ích Đầu Tư
            </h2>
            
            {[
              {
                icon: Award,
                title: "Lợi Nhuận Hấp Dẫn",
                description: "ROI dự kiến 15-25%/năm"
              },
              {
                icon: Shield,
                title: "Bảo Mật & Minh Bạch",
                description: "Hợp đồng pháp lý rõ ràng"
              },
              {
                icon: BarChart3,
                title: "Tăng Trưởng Bền Vững",
                description: "Mô hình kinh doanh đã được chứng minh"
              }
            ].map((item, index) => (
              <GlowCard key={index} glowColor="yellow" className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <item.icon className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-yellow-500 mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </GlowCard>
            ))}
          </motion.div>

          {/* Investment Form - Right Column (2 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <GlowCard glowColor="yellow" className="p-8 md:p-12">
              <h2 className="font-display text-2xl font-bold text-yellow-500 mb-6">
                Đăng Ký Tư Vấn Đầu Tư
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                      <User className="w-4 h-4 text-yellow-500" />
                      Họ và Tên
                    </label>
                    <Input
                      required
                      placeholder="Nguyễn Văn A"
                      className="bg-dark-surface border-yellow-500/30 focus:border-yellow-500 focus:glow-border"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                      <Mail className="w-4 h-4 text-yellow-500" />
                      Email
                    </label>
                    <Input
                      required
                      type="email"
                      placeholder="email@example.com"
                      className="bg-dark-surface border-yellow-500/30 focus:border-yellow-500 focus:glow-border"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                      <Phone className="w-4 h-4 text-yellow-500" />
                      Số Điện Thoại
                    </label>
                    <Input
                      required
                      type="tel"
                      placeholder="0123456789"
                      className="bg-dark-surface border-yellow-500/30 focus:border-yellow-500 focus:glow-border"
                    />
                  </div>

                  {/* Investment Amount */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                      <DollarSign className="w-4 h-4 text-yellow-500" />
                      Số Vốn Dự Kiến (VNĐ)
                    </label>
                    <Input
                      required
                      type="text"
                      placeholder="100.000.000"
                      className="bg-dark-surface border-yellow-500/30 focus:border-yellow-500 focus:glow-border"
                    />
                  </div>

                  {/* Company (Optional) */}
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                      <Building2 className="w-4 h-4 text-yellow-500" />
                      Công Ty (Nếu có)
                    </label>
                    <Input
                      placeholder="Tên công ty của bạn"
                      className="bg-dark-surface border-yellow-500/30 focus:border-yellow-500 focus:glow-border"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                    <TrendingUp className="w-4 h-4 text-yellow-500" />
                    Mục Đích Đầu Tư
                  </label>
                  <Textarea
                    placeholder="Chia sẻ về mục đích và kỳ vọng của bạn khi đầu tư vào dự án..."
                    rows={4}
                    className="bg-dark-surface border-yellow-500/30 focus:border-yellow-500 focus:glow-border resize-none"
                  />
                </div>

                {/* Submit Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse-glow"></div>
                  <Button
                    type="submit"
                    className="relative w-full py-6 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 shadow-xl"
                  >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    ĐĂNG KÝ Tư VẤN ĐẦU TƯ
                  </Button>
                </motion.div>

                <p className="text-xs text-muted-foreground text-center">
                  Thông tin của bạn sẽ được bảo mật tuyệt đối theo chính sách bảo mật của chúng tôi
                </p>
              </form>
            </GlowCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProjectInvestment;
