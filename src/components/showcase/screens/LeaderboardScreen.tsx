import { Crown, Medal, TrendingUp } from "lucide-react";

export const LeaderboardScreen = () => {
  const players = [
    { rank: 1, name: "Trần Minh", elo: 2150, badge: "🥇", color: "text-yellow-400" },
    { rank: 2, name: "Lê Hoàng", elo: 2080, badge: "🥈", color: "text-gray-300" },
    { rank: 3, name: "Phạm Tuấn", elo: 1990, badge: "🥉", color: "text-orange-400" },
    { rank: 4, name: "Ngô Khoa", elo: 1920, badge: "", color: "text-foreground" },
    { rank: 5, name: "Đặng Việt", elo: 1875, badge: "", color: "text-foreground" },
  ];

  return (
    <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-sm font-bold font-display flex items-center gap-2">
          <Crown className="w-4 h-4 text-neon-cyan" />
          Bảng Xếp Hạng
        </h3>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button className="px-3 py-1.5 bg-neon-cyan/20 rounded-full text-neon-cyan text-xs font-semibold">
          All Time
        </button>
        <button className="px-3 py-1.5 glass-panel rounded-full text-muted-foreground text-xs">
          This Month
        </button>
        <button className="px-3 py-1.5 glass-panel rounded-full text-muted-foreground text-xs">
          This Week
        </button>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-2 mb-3">
        {/* 2nd Place */}
        <div className="flex-1 glass-panel rounded-t-xl p-2 text-center h-16 flex flex-col justify-end">
          <p className="text-gray-300 text-xl">🥈</p>
          <p className="text-foreground text-xs font-bold truncate">Lê Hoàng</p>
        </div>
        
        {/* 1st Place */}
        <div className="flex-1 glass-panel rounded-t-xl p-2 text-center h-20 flex flex-col justify-end border-2 border-neon-cyan shadow-[0_0_20px_rgba(0,217,255,0.3)]">
          <Crown className="w-5 h-5 text-neon-cyan mx-auto mb-1" />
          <p className="text-foreground text-xs font-bold truncate">Trần Minh</p>
        </div>
        
        {/* 3rd Place */}
        <div className="flex-1 glass-panel rounded-t-xl p-2 text-center h-14 flex flex-col justify-end">
          <p className="text-orange-400 text-xl">🥉</p>
          <p className="text-foreground text-xs font-bold truncate">Phạm Tuấn</p>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
        {players.map((player) => (
          <div
            key={player.rank}
            className={`glass-panel rounded-lg p-2.5 flex items-center gap-3 ${
              player.rank <= 3 ? 'border border-neon-cyan/20' : ''
            }`}
          >
            <div className="w-6 text-center">
              {player.badge ? (
                <span className="text-lg">{player.badge}</span>
              ) : (
                <span className={`text-xs font-bold ${player.color}`}>#{player.rank}</span>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-neon-cyan" />
            <div className="flex-1">
              <p className="text-foreground text-xs font-semibold">{player.name}</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-neon-green" />
                <span className="text-neon-cyan text-xs font-bold">{player.elo} ELO</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Your Rank Highlight */}
      <div className="glass-panel rounded-xl p-3 border-2 border-primary">
        <p className="text-center text-foreground text-xs">
          <Medal className="w-4 h-4 inline mr-1 text-primary" />
          You are ranked <span className="text-primary font-bold">#42</span>
        </p>
      </div>
    </div>
  );
};
