import { TrendingUp, Trophy, Target, Award } from "lucide-react";

export const ProfileScreen = () => {
  return (
    <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg flex flex-col">
      {/* Cover & Avatar */}
      <div className="relative h-20 bg-gradient-to-r from-neon-cyan/20 via-neon-blue/20 to-primary/20">
        <div className="absolute -bottom-8 left-4 w-16 h-16 rounded-full bg-gradient-to-br from-neon-cyan to-primary border-4 border-dark-bg" />
      </div>

      {/* Profile Info */}
      <div className="p-4 pt-10 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="text-foreground text-sm font-bold font-display">Nguyễn Văn A</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="px-2 py-0.5 bg-neon-cyan/20 rounded-full">
              <span className="text-neon-cyan text-xs font-bold">Gold Badge</span>
            </div>
          </div>
        </div>

        {/* ELO Chart */}
        <div className="glass-panel rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-foreground text-xs font-semibold">📊 ELO History</span>
            <TrendingUp className="w-3 h-3 text-neon-green" />
          </div>
          {/* Simple Line Chart Visualization */}
          <div className="h-12 flex items-end gap-1">
            {[40, 45, 42, 50, 55, 52, 60, 65, 68, 70].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-neon-cyan to-neon-blue rounded-t"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <p className="text-neon-cyan text-xs text-center mt-2 font-bold">1,850 ELO ↑ +120</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="glass-panel rounded-lg p-2.5 text-center">
            <Trophy className="w-4 h-4 text-neon-cyan mx-auto mb-1" />
            <p className="text-foreground text-sm font-bold">24</p>
            <p className="text-muted-foreground text-xs">Wins</p>
          </div>
          <div className="glass-panel rounded-lg p-2.5 text-center">
            <Target className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-foreground text-sm font-bold">12</p>
            <p className="text-muted-foreground text-xs">Losses</p>
          </div>
          <div className="glass-panel rounded-lg p-2.5 text-center">
            <Award className="w-4 h-4 text-neon-green mx-auto mb-1" />
            <p className="text-neon-green text-sm font-bold">66.7%</p>
            <p className="text-muted-foreground text-xs">Win Rate</p>
          </div>
          <div className="glass-panel rounded-lg p-2.5 text-center">
            <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-foreground text-sm font-bold">8</p>
            <p className="text-muted-foreground text-xs">Tournaments</p>
          </div>
        </div>
      </div>
    </div>
  );
};
