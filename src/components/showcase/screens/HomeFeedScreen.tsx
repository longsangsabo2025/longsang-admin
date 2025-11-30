import { Trophy, Clock, TrendingUp } from 'lucide-react';

export const HomeFeedScreen = () => {
  return (
    <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg p-4 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-sm font-bold font-display">🏠 Home Feed</h3>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-neon-cyan/10 rounded-full">
          <TrendingUp className="w-3 h-3 text-neon-cyan" />
          <span className="text-neon-cyan text-xs font-semibold">1,850 ELO</span>
        </div>
      </div>

      {/* Tournament Cards */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
        {/* Card 1 */}
        <div className="glass-panel rounded-xl p-3 border border-neon-cyan/20">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-neon-cyan" />
            <span className="text-foreground text-xs font-semibold">Grand Championship DE32</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">Còn 2h 15p</span>
            </div>
            <span className="text-neon-green text-xs font-bold">+150 SPA</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel rounded-xl p-3 border border-neon-blue/20">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-neon-blue" />
            <span className="text-foreground text-xs font-semibold">Weekly Pool 9-Ball</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">Hôm nay 18:00</span>
            </div>
            <span className="text-neon-green text-xs font-bold">+80 SPA</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel rounded-xl p-3 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-foreground text-xs font-semibold">8-Ball Tournament</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">Ngày mai 15:00</span>
            </div>
            <span className="text-neon-green text-xs font-bold">+100 SPA</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-panel rounded-lg p-2 text-center">
          <p className="text-neon-cyan text-sm font-bold">1,850</p>
          <p className="text-muted-foreground text-xs">ELO</p>
        </div>
        <div className="glass-panel rounded-lg p-2 text-center">
          <p className="text-neon-green text-sm font-bold">500</p>
          <p className="text-muted-foreground text-xs">SPA</p>
        </div>
        <div className="glass-panel rounded-lg p-2 text-center">
          <p className="text-primary text-sm font-bold">#42</p>
          <p className="text-muted-foreground text-xs">Rank</p>
        </div>
      </div>
    </div>
  );
};
