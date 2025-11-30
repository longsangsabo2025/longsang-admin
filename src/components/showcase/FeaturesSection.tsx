import { motion } from "framer-motion";
import { PhoneMockup } from "./PhoneMockup";
// Lucide React Icons - Clean professional icons
import { 
  Trophy, 
  Users,
  Zap,
  BarChart3,
  MessageCircle,
  Bell,
  Sparkles,
  Flame
} from "lucide-react";
import { 
  RiVipCrownLine,
  RiDashboardLine,
  RiGamepadLine
} from "react-icons/ri";
import { 
  TbTournament,
  TbTarget
} from "react-icons/tb";
import { 
  BiTrendingUp,
  BiTimer
} from "react-icons/bi";
import { 
  GiDiamondTrophy,
  GiLaurelsTrophy
} from "react-icons/gi";

export const FeaturesSection = () => {
  return (
    <section className="relative py-20 px-6">
      <div className="container mx-auto max-w-[1400px]">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold gradient-text mb-4 font-display"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Tính Năng Nổi Bật
          </motion.h2>
          <motion.p 
            className="text-muted-foreground text-lg"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            8 định dạng giải đấu, ELO ranking, SPA Points - Tất cả trong một ứng dụng
          </motion.p>
        </div>

        {/* Feature Grid */}
        <div className="space-y-20">
          
          {/* Feature 1: Home Feed - Large Hero */}
          <motion.div 
            className="grid lg:grid-cols-2 gap-8 items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 mb-4">
                <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-neon-cyan/20">
                  <Trophy className="w-4 h-4 text-neon-cyan" strokeWidth={2.5} />
                </div>
                <span className="text-neon-cyan text-sm font-semibold">Core Feature</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
                🏠 Home Feed<br />
                <span className="gradient-text">Tournament Hub</span>
              </h3>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                Theo dõi tất cả giải đấu đang diễn ra và sắp tới. Countdown timer thời gian thực, 
                quick stats hiển thị ELO, SPA Points và Rank badge của bạn ngay trên màn hình chính.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <motion.div 
                  className="glass-panel rounded-xl p-4"
                  whileHover={{ scale: 1.05, borderColor: "hsl(var(--neon-cyan))" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-neon-cyan/20 mb-2">
                    <Zap className="w-5 h-5 text-neon-cyan" strokeWidth={2.5} />
                  </div>
                  <p className="text-foreground font-semibold text-sm">Real-time Updates</p>
                  <p className="text-muted-foreground text-xs">Cập nhật ngay lập tức</p>
                </motion.div>
                <motion.div 
                  className="glass-panel rounded-xl p-4"
                  whileHover={{ scale: 1.05, borderColor: "hsl(var(--neon-green))" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-neon-green/20 mb-2">
                    <TbTarget className="w-5 h-5 text-neon-green" strokeWidth={2.5} />
                  </div>
                  <p className="text-foreground font-semibold text-sm">Quick Stats</p>
                  <p className="text-muted-foreground text-xs">ELO, SPA, Rank</p>
                </motion.div>
              </div>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <PhoneMockup size="hero" delay={0.1}>
                <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg" />
              </PhoneMockup>
            </div>
          </motion.div>

          {/* Feature 2 & 3: Bracket + Profile - Side by Side */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Bracket Visualization */}
            <motion.div 
              className="glass-panel rounded-2xl p-8 border border-neon-cyan/20"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ borderColor: "hsl(var(--neon-cyan))" }}
            >
              <div className="text-center mb-6">
                <PhoneMockup size="medium" delay={0.2}>
                  <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg" />
                </PhoneMockup>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 mb-3">
                <div className="w-5 h-5 flex items-center justify-center rounded-lg bg-neon-blue/20">
                  <TbTournament className="w-3.5 h-3.5 text-neon-blue" strokeWidth={2.5} />
                </div>
                <span className="text-neon-blue text-xs font-semibold">Tournament System</span>
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2 font-display">
                🏆 Bracket Visualization
              </h4>
              <p className="text-muted-foreground text-sm mb-4">
                Sơ đồ giải đấu đẹp mắt với 8 định dạng (DE16, DE32, Swiss...). 
                Winner path được highlight tự động, hỗ trợ pinch-to-zoom.
              </p>
              <div className="flex items-center gap-2 text-xs">
                <motion.div 
                  className="px-3 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan"
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(0, 217, 255, 0.2)" }}
                >
                  DE16
                </motion.div>
                <motion.div 
                  className="px-3 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan"
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(0, 217, 255, 0.2)" }}
                >
                  DE32
                </motion.div>
                <motion.div 
                  className="px-3 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan"
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(0, 217, 255, 0.2)" }}
                >
                  Swiss
                </motion.div>
              </div>
            </motion.div>

            {/* User Profile */}
            <motion.div 
              className="glass-panel rounded-2xl p-8 border border-primary/20"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ borderColor: "hsl(var(--primary))" }}
            >
              <div className="text-center mb-6">
                <PhoneMockup size="medium" delay={0.3}>
                  <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg" />
                </PhoneMockup>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/30 mb-3">
                <div className="w-5 h-5 flex items-center justify-center rounded-lg bg-neon-green/20">
                  <BiTrendingUp className="w-3.5 h-3.5 text-neon-green" strokeWidth={2.5} />
                </div>
                <span className="text-neon-green text-xs font-semibold">Personal Growth</span>
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2 font-display">
                📊 User Profile & ELO Chart
              </h4>
              <p className="text-muted-foreground text-sm mb-4">
                Theo dõi tiến trình của bạn với ELO history chart 30 ngày. 
                Badge system (Gold/Silver/Bronze), achievement tracking đầy đủ.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <motion.div 
                  className="text-center p-2 rounded-lg bg-neon-cyan/5"
                  whileHover={{ backgroundColor: "rgba(0, 217, 255, 0.1)", scale: 1.05 }}
                >
                  <p className="text-neon-cyan font-bold text-lg">1,850</p>
                  <p className="text-muted-foreground text-xs">ELO Rating</p>
                </motion.div>
                <motion.div 
                  className="text-center p-2 rounded-lg bg-neon-green/5"
                  whileHover={{ backgroundColor: "rgba(62, 207, 142, 0.1)", scale: 1.05 }}
                >
                  <p className="text-neon-green font-bold text-lg">66.7%</p>
                  <p className="text-muted-foreground text-xs">Win Rate</p>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Feature 4: Leaderboard - Full Width */}
          <motion.div 
            className="grid lg:grid-cols-2 gap-8 items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center">
              <PhoneMockup size="large" delay={0.4}>
                <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg" />
              </PhoneMockup>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-4">
                <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-yellow-500/20">
                  <RiVipCrownLine className="w-4 h-4 text-yellow-500" strokeWidth={2.5} />
                </div>
                <span className="text-yellow-500 text-sm font-semibold">Competition</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
                🏅 Leaderboard<br />
                <span className="gradient-text">Bảng Xếp Hạng</span>
              </h3>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                Top 3 podium với animation đặc biệt. Filter theo All Time, This Month, This Week. 
                Smooth scroll 60 FPS với "You are ranked #42" highlight.
              </p>
              <div className="space-y-3">
                <motion.div 
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-transparent border-l-2 border-yellow-500"
                  whileHover={{ x: 5, borderColor: "rgb(234, 179, 8)" }}
                >
                  <GiLaurelsTrophy className="text-4xl text-yellow-500" />
                  <div>
                    <p className="text-foreground font-semibold text-sm">Top 1 Podium</p>
                    <p className="text-muted-foreground text-xs">Special animation & crown</p>
                  </div>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-neon-cyan/10 to-transparent border-l-2 border-neon-cyan"
                  whileHover={{ x: 5, borderColor: "rgb(0, 217, 255)" }}
                >
                  <Users className="text-2xl text-neon-cyan" />
                  <div>
                    <p className="text-foreground font-semibold text-sm">Real-time Ranking</p>
                    <p className="text-muted-foreground text-xs">Cập nhật sau mỗi trận đấu</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Feature 5 & 6: Voucher Shop + Club Dashboard */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Voucher Shop */}
            <motion.div 
              className="glass-panel rounded-2xl p-8 border border-neon-green/20"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ borderColor: "hsl(var(--neon-green))" }}
            >
              <div className="text-center mb-6">
                <PhoneMockup size="medium" delay={0.5}>
                  <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg" />
                </PhoneMockup>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/30 mb-3">
                <div className="w-5 h-5 flex items-center justify-center rounded-lg bg-neon-green/20">
                  <GiDiamondTrophy className="w-3.5 h-3.5 text-neon-green" />
                </div>
                <span className="text-neon-green text-xs font-semibold">Monetization</span>
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2 font-display">
                💎 Voucher Redemption Shop
              </h4>
              <p className="text-muted-foreground text-sm mb-4">
                Đổi SPA Points lấy voucher thật tại 15+ CLB. Bronze (100 SPA - 10% OFF), 
                Silver (200 SPA - 20% OFF), Gold (500 SPA - 35% OFF).
              </p>
              <div className="flex flex-wrap gap-2">
                <motion.div 
                  className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30"
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(249, 115, 22, 0.2)" }}
                >
                  <span className="text-orange-500 text-xs font-bold">Bronze 10%</span>
                </motion.div>
                <motion.div 
                  className="px-3 py-1.5 rounded-lg bg-gray-400/10 border border-gray-400/30"
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(156, 163, 175, 0.2)" }}
                >
                  <span className="text-gray-400 text-xs font-bold">Silver 20%</span>
                </motion.div>
                <motion.div 
                  className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(234, 179, 8, 0.2)" }}
                >
                  <span className="text-yellow-500 text-xs font-bold">Gold 35%</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Club Dashboard */}
            <motion.div 
              className="glass-panel rounded-2xl p-8 border border-primary/20"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ borderColor: "hsl(var(--primary))" }}
            >
              <div className="text-center mb-6">
                <PhoneMockup size="medium" delay={0.6}>
                  <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg" />
                </PhoneMockup>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-3">
                <div className="w-5 h-5 flex items-center justify-center rounded-lg bg-primary/20">
                  <RiDashboardLine className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-primary text-xs font-semibold">For CLB Owners</span>
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2 font-display">
                📈 Club Dashboard Analytics
              </h4>
              <p className="text-muted-foreground text-sm mb-4">
                Quản lý CLB dễ dàng với 4 metric cards, revenue chart, top players leaderboard. 
                Peak hours heatmap và quick actions.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <motion.div 
                  className="p-2 rounded bg-neon-cyan/5 text-center"
                  whileHover={{ backgroundColor: "rgba(0, 217, 255, 0.1)", scale: 1.05 }}
                >
                  <p className="text-neon-cyan font-bold">156</p>
                  <p className="text-muted-foreground">Members</p>
                </motion.div>
                <motion.div 
                  className="p-2 rounded bg-neon-green/5 text-center"
                  whileHover={{ backgroundColor: "rgba(62, 207, 142, 0.1)", scale: 1.05 }}
                >
                  <p className="text-neon-green font-bold">45M</p>
                  <p className="text-muted-foreground">Revenue</p>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Feature 7 & 8: Tournament Creation + Match Scoring */}
          <motion.div 
            className="grid lg:grid-cols-2 gap-8 items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 mb-4">
                <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-neon-cyan/20">
                  <Zap className="w-4 h-4 text-neon-cyan" strokeWidth={2.5} />
                </div>
                <span className="text-neon-cyan text-sm font-semibold">Easy Setup</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
                ⚡ Tournament Creation<br />
                <span className="gradient-text">Tạo giải trong 3 phút</span>
              </h3>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                Wizard interface với 5 steps. Chọn từ 8 formats, preview bracket trước khi tạo. 
                Form đơn giản với dropdown, date picker, step indicator.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <motion.div 
                  className="text-center p-3 rounded-xl glass-panel"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center mx-auto mb-2">
                    <span className="text-neon-cyan font-bold text-sm">1</span>
                  </div>
                  <p className="text-foreground text-xs font-semibold">Basic Info</p>
                </motion.div>
                <motion.div 
                  className="text-center p-3 rounded-xl glass-panel"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-8 h-8 rounded-full bg-neon-cyan flex items-center justify-center mx-auto mb-2">
                    <span className="text-dark-bg font-bold text-sm">2</span>
                  </div>
                  <p className="text-neon-cyan text-xs font-semibold">Format</p>
                </motion.div>
                <motion.div 
                  className="text-center p-3 rounded-xl glass-panel"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-2">
                    <span className="text-muted-foreground font-bold text-sm">3</span>
                  </div>
                  <p className="text-muted-foreground text-xs font-semibold">Preview</p>
                </motion.div>
              </div>
              <motion.div 
                className="glass-panel rounded-xl p-4 border border-neon-green/20"
                whileHover={{ borderColor: "hsl(var(--neon-green))" }}
              >
                <div className="flex items-center gap-2">
                  <BiTimer className="w-5 h-5 text-neon-green" />
                  <p className="text-foreground text-sm font-semibold">8 Tournament Formats</p>
                </div>
                <p className="text-muted-foreground text-xs mt-1">
                  Single/Double Elimination, Round Robin, Swiss, Group Stage...
                </p>
              </motion.div>
            </div>
            <div className="flex justify-center">
              <PhoneMockup size="large" delay={0.7}>
                <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg" />
              </PhoneMockup>
            </div>
          </motion.div>

          {/* Feature 9 & 10: Chat + Notifications - Side by Side */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Chat */}
            <motion.div 
              className="glass-panel rounded-2xl p-8 border border-neon-blue/20"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ borderColor: "hsl(var(--neon-blue))" }}
            >
              <div className="text-center mb-6">
                <PhoneMockup size="medium" delay={0.8}>
                  <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg" />
                </PhoneMockup>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 mb-3">
                <div className="w-5 h-5 flex items-center justify-center rounded-lg bg-neon-blue/20">
                  <MessageCircle className="w-3.5 h-3.5 text-neon-blue" strokeWidth={2.5} />
                </div>
                <span className="text-neon-blue text-xs font-semibold">Social</span>
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2 font-display">
                💬 Chat & Messaging
              </h4>
              <p className="text-muted-foreground text-sm mb-4">
                Real-time chat với typing indicator, image/video sharing, emoji reactions. 
                Online status và WhatsApp-style bubble design.
              </p>
              <div className="space-y-2">
                <motion.div 
                  className="flex items-center gap-2 text-xs"
                  whileHover={{ x: 5 }}
                >
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-neon-green"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-muted-foreground">Real-time typing indicator</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 text-xs"
                  whileHover={{ x: 5 }}
                >
                  <div className="w-2 h-2 rounded-full bg-neon-cyan" />
                  <span className="text-muted-foreground">Emoji reactions & stickers</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div 
              className="glass-panel rounded-2xl p-8 border border-accent/20"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ borderColor: "hsl(var(--accent))" }}
            >
              <div className="text-center mb-6">
                <PhoneMockup size="medium" delay={0.9}>
                  <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg" />
                </PhoneMockup>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 mb-3">
                <div className="w-5 h-5 flex items-center justify-center rounded-lg bg-accent/20">
                  <Bell className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
                </div>
                <span className="text-accent text-xs font-semibold">Engagement</span>
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2 font-display">
                🔔 Notification Center
              </h4>
              <p className="text-muted-foreground text-sm mb-4">
                Grouped notifications (Today, Yesterday, This Week). 
                4 loại: 🏆 tournament, 💬 message, 💎 reward, 👥 follow. Swipe-to-delete.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <motion.div 
                  className="p-2 rounded bg-neon-cyan/5 flex items-center gap-2"
                  whileHover={{ backgroundColor: "rgba(0, 217, 255, 0.1)", scale: 1.05 }}
                >
                  <Trophy className="w-4 h-4 text-neon-cyan" />
                  <span className="text-foreground">Tournament</span>
                </motion.div>
                <motion.div 
                  className="p-2 rounded bg-neon-green/5 flex items-center gap-2"
                  whileHover={{ backgroundColor: "rgba(62, 207, 142, 0.1)", scale: 1.05 }}
                >
                  <Sparkles className="w-4 h-4 text-neon-green" />
                  <span className="text-foreground">Reward</span>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Final Feature: Match Scoring - Centered */}
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <PhoneMockup size="large" delay={1}>
                <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg" />
              </PhoneMockup>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-green/10 border border-neon-green/30 mb-4">
              <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-neon-green/20">
                <RiGamepadLine className="w-4 h-4 text-neon-green" />
              </div>
              <span className="text-neon-green text-sm font-semibold">Core Functionality</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
              🎮 <span className="gradient-text">Live Match Scoring</span>
            </h3>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed max-w-2xl mx-auto">
              Score input UI với +/- buttons lớn, dễ nhấn. "Confirm Winner" button nổi bật, 
              real-time update animation. Bracket tự động advance sau khi confirm.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
              <motion.div 
                className="glass-panel rounded-xl p-4"
                whileHover={{ scale: 1.05, borderColor: "hsl(var(--neon-cyan))" }}
              >
                <div className="w-10 h-10 rounded-full bg-neon-cyan/20 border-2 border-neon-cyan flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="text-neon-cyan text-xl" />
                </div>
                <p className="text-foreground text-sm font-semibold">Easy Input</p>
                <p className="text-muted-foreground text-xs">Large buttons</p>
              </motion.div>
              <motion.div 
                className="glass-panel rounded-xl p-4"
                whileHover={{ scale: 1.05, borderColor: "hsl(var(--neon-green))" }}
              >
                <Flame className="w-10 h-10 text-neon-green mx-auto mb-2" />
                <p className="text-foreground text-sm font-semibold">Real-time</p>
                <p className="text-muted-foreground text-xs">Instant update</p>
              </motion.div>
              <motion.div 
                className="glass-panel rounded-xl p-4"
                whileHover={{ scale: 1.05, borderColor: "hsl(var(--neon-cyan))" }}
              >
                <Trophy className="w-10 h-10 text-neon-cyan mx-auto mb-2" />
                <p className="text-foreground text-sm font-semibold">Auto Advance</p>
                <p className="text-muted-foreground text-xs">Bracket updates</p>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
