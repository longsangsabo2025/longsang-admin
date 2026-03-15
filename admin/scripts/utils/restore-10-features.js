// Add full 10 features to SABO Arena
import pkg from 'pg';
const { Client } = pkg;

const connectionConfig = {
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.diexsbzqwsbpilsymnfb',
  password: 'Acookingoil123',
  ssl: { rejectUnauthorized: false }
};

const fullFeatures = [
  {
    "id": "home-feed",
    "title": "🏠 Home Feed - Tournament Hub",
    "description": "Theo dõi tất cả giải đấu đang diễn ra và sắp tới. Countdown timer thời gian thực, quick stats hiển thị ELO, SPA Points và Rank badge của bạn ngay trên màn hình chính.",
    "icon": "TrophyIcon",
    "badge": { "text": "Core Feature", "color": "neon-cyan" },
    "stats": [
      { "label": "Real-time Updates", "value": "Cập nhật ngay lập tức", "icon": "BoltIcon" },
      { "label": "Quick Stats", "value": "ELO, SPA, Rank", "icon": "ChartBarIcon" }
    ]
  },
  {
    "id": "bracket-system",
    "title": "🏆 Bracket Visualization - Tournament Tree",
    "description": "Hệ thống bracket trực quan, dễ theo dõi. Xem toàn bộ cây giải đấu từ vòng 1 đến chung kết, cập nhật real-time kết quả và lịch thi đấu của bạn.",
    "icon": "TrophyIcon",
    "badge": { "text": "Tournament Core", "color": "neon-blue" }
  },
  {
    "id": "ranking-system",
    "title": "📊 Ranking & Leaderboard - ELO System",
    "description": "Hệ thống xếp hạng ELO chuyên nghiệp. Track progress của bạn qua từng trận, xem top players, so sánh stats với đối thủ. Thuật toán ELO được customize riêng cho Bi-a.",
    "icon": "ChartBarIcon",
    "badge": { "text": "Competitive", "color": "neon-green" },
    "highlights": [
      "ELO Rating System",
      "Real-time Leaderboard",
      "Player Stats Comparison"
    ]
  },
  {
    "id": "live-scoring",
    "title": "⚡ Live Scoring - Real-time Match Updates",
    "description": "Chấm điểm trực tiếp trong trận đấu. Referee có thể cập nhật score ngay lập tức, người chơi và khán giả theo dõi real-time. Tích hợp video replay và highlight moments.",
    "icon": "BoltIcon",
    "badge": { "text": "Live Feature", "color": "neon-yellow" },
    "stats": [
      { "label": "Response Time", "value": "< 100ms", "icon": "ClockIcon" },
      { "label": "Accuracy", "value": "99.9%", "icon": "CheckCircleIcon" }
    ]
  },
  {
    "id": "spa-points",
    "title": "💎 SPA Points - Reward System",
    "description": "Kiếm SPA Points qua mỗi trận đấu, tournament wins, và daily missions. Đổi points lấy vouchers thật từ đối tác (F&B, entertainment, shopping). Gamification với achievements và badges.",
    "icon": "SparklesIcon",
    "badge": { "text": "Rewards", "color": "neon-purple" },
    "highlights": [
      "Earn Points Every Match",
      "Đổi Vouchers Thật",
      "Daily Missions & Achievements"
    ]
  },
  {
    "id": "social-feed",
    "title": "👥 Social Feed - Community Hub",
    "description": "Kết nối với cộng đồng Bi-a. Share highlights, challenge bạn bè, comment trên các trận đấu. Follow top players, xem replays của pro matches.",
    "icon": "UserGroupIcon",
    "badge": { "text": "Community", "color": "neon-cyan" },
    "stats": [
      { "label": "Active Users", "value": "1,500+", "icon": "UsersIcon" },
      { "label": "Daily Posts", "value": "200+", "icon": "ChatBubbleLeftIcon" }
    ]
  },
  {
    "id": "notifications",
    "title": "🔔 Smart Notifications - Never Miss a Match",
    "description": "Nhận thông báo về lịch thi đấu, kết quả, SPA Points earned, và challenges từ bạn bè. Smart scheduling tránh spam, chỉ notify những gì quan trọng với bạn.",
    "icon": "BellAlertIcon",
    "badge": { "text": "Smart", "color": "neon-orange" },
    "highlights": [
      "Match Reminders",
      "SPA Points Alerts",
      "Friend Challenges"
    ]
  },
  {
    "id": "vip-system",
    "title": "👑 VIP Membership - Premium Benefits",
    "description": "VIP members có ưu tiên đăng ký giải, early access vào new features, exclusive tournaments với giải thưởng lớn. Tích lũy VIP Points để unlock premium rewards.",
    "icon": "Crown",
    "badge": { "text": "Premium", "color": "gold" },
    "stats": [
      { "label": "Priority Access", "value": "24/7 Support", "icon": "ShieldCheckIcon" },
      { "label": "Exclusive Rewards", "value": "50+ Items", "icon": "GiftIcon" }
    ]
  },
  {
    "id": "analytics",
    "title": "📈 Player Analytics - Performance Insights",
    "description": "Dashboard chi tiết về performance của bạn. Win rate, shot accuracy, favorite shots, playing patterns. AI-powered suggestions để improve gameplay dựa trên stats của bạn.",
    "icon": "ChartBarIcon",
    "badge": { "text": "AI-Powered", "color": "neon-blue" },
    "highlights": [
      "Win Rate Analysis",
      "Shot Accuracy Tracking",
      "AI Performance Tips",
      "Compare with Top Players"
    ]
  },
  {
    "id": "tournament-history",
    "title": "📜 Tournament History - Your Journey",
    "description": "Lưu trữ toàn bộ lịch sử thi đấu của bạn. Xem lại các trận đấu quan trọng, review highlights, track ELO progression over time. Export stats để share lên social media.",
    "icon": "ClockIcon",
    "badge": { "text": "Archive", "color": "neon-gray" },
    "stats": [
      { "label": "Matches Played", "value": "Track All", "icon": "CalendarIcon" },
      { "label": "Highlights Saved", "value": "Unlimited", "icon": "VideoCameraIcon" }
    ]
  }
];

async function updateFeatures() {
  const client = new Client(connectionConfig);
  try {
    console.log('🔄 Updating SABO Arena với 10 features đầy đủ...\n');
    
    await client.connect();
    
    await client.query(`
      UPDATE app_showcase 
      SET features = $1
      WHERE app_id = 'sabo-arena'
    `, [JSON.stringify(fullFeatures)]);
    
    console.log('✅ Updated successfully!');
    console.log(`📊 Total features: ${fullFeatures.length}`);
    console.log('\n📝 Features list:');
    fullFeatures.forEach((f, i) => {
      console.log(`${i + 1}. ${f.title} (Icon: ${f.icon})`);
    });
    
    console.log('\n🎨 Upgraded icons used:');
    console.log('- TrophyIcon (Hero Icons)');
    console.log('- BoltIcon (Hero Icons)');
    console.log('- ChartBarIcon (Hero Icons)');
    console.log('- SparklesIcon (Hero Icons)');
    console.log('- UserGroupIcon (Hero Icons)');
    console.log('- BellAlertIcon (Hero Icons)');
    console.log('- Crown (Phosphor Icons)');
    console.log('- ClockIcon (Hero Icons)');
    
    console.log('\n✨ Reload trang để xem 10 features!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updateFeatures();
