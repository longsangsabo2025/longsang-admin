import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, ArrowLeft, Mail, User, Phone, MessageSquare, CheckCircle2 } from "lucide-react";
import { projectsData } from "@/data/projects-data";
import { GlowCard } from "@/components/GlowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const ProjectInterest = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  
  const project = projectsData.find(p => p.slug === slug) || projectsData[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const projectData = project || { id: 0, name: "Unknown Project" };
      
      const response = await fetch('http://localhost:3001/api/project/interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectData.id,
          projectSlug: slug,
          projectName: projectData.name,
          fullName: name,
          email,
          phone,
          message: message || undefined
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit interest');
      }

      setSubmitted(true);
      setTimeout(() => {
        navigate(`/project-showcase/${slug}`);
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting interest:', error);
      alert('Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại.');
    }
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
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-neon-green/20 mb-6"
          >
            <CheckCircle2 className="w-12 h-12 text-neon-green" />
          </motion.div>
          <h2 className="font-display text-3xl font-bold gradient-text mb-4">
            Cảm Ơn Bạn Đã Quan Tâm!
          </h2>
          <p className="text-muted-foreground text-lg">
            Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/30 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/30 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-4xl">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(`/project-showcase/${slug}`)}
          className="inline-flex items-center gap-2 text-neon-cyan hover:text-white transition-colors mb-8 group"
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
            <Heart className="w-12 h-12 text-neon-cyan" />
            <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text">
              Quan Tâm Dự Án
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Để lại thông tin của bạn để nhận được thông báo cập nhật mới nhất về <span className="text-neon-cyan font-semibold">{project.name}</span>
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlowCard glowColor="cyan" className="p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <User className="w-4 h-4 text-neon-cyan" />
                  Họ và Tên
                </label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="bg-dark-surface border-neon-cyan/30 focus:border-neon-cyan focus:glow-border"
                />
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Mail className="w-4 h-4 text-neon-cyan" />
                  Email
                </label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="bg-dark-surface border-neon-cyan/30 focus:border-neon-cyan focus:glow-border"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Phone className="w-4 h-4 text-neon-cyan" />
                  Số Điện Thoại
                </label>
                <Input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0123456789"
                  className="bg-dark-surface border-neon-cyan/30 focus:border-neon-cyan focus:glow-border"
                />
              </div>

              {/* Message */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <MessageSquare className="w-4 h-4 text-neon-cyan" />
                  Lý Do Quan Tâm (Tùy chọn)
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Cho chúng tôi biết lý do bạn quan tâm đến dự án này..."
                  rows={4}
                  className="bg-dark-surface border-neon-cyan/30 focus:border-neon-cyan focus:glow-border resize-none"
                />
              </div>

              {/* Submit Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-cyan rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse-glow"></div>
                <Button
                  type="submit"
                  className="relative w-full py-6 text-lg font-bold bg-gradient-to-r from-neon-cyan/20 to-neon-blue/20 hover:from-neon-cyan/30 hover:to-neon-blue/30 border-2 border-neon-cyan/50 hover:border-neon-cyan shadow-lg"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  GỬI THÔNG TIN QUAN TÂM
                </Button>
              </motion.div>
            </form>
          </GlowCard>
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              title: "Cập Nhật Định Kỳ",
              description: "Nhận tin tức mới nhất về tiến độ dự án"
            },
            {
              title: "Ưu Đãi Đặc Biệt",
              description: "Được ưu tiên tham gia các chương trình"
            },
            {
              title: "Kết Nối Cộng Đồng",
              description: "Tham gia nhóm người quan tâm dự án"
            }
          ].map((benefit, index) => (
            <GlowCard key={index} glowColor="blue" className="p-6 text-center">
              <h3 className="font-bold text-neon-cyan mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </GlowCard>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectInterest;
