import { Plus, Minus, Trophy, Check } from 'lucide-react';

export const MatchScoringScreen = () => {
  return (
    <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-foreground text-sm font-bold font-display flex items-center justify-center gap-2">
          <Trophy className="w-4 h-4 text-neon-cyan" />
          Live Match Scoring
        </h3>
        <p className="text-muted-foreground text-xs mt-1">Semi-Final • DE16</p>
      </div>

      {/* Player A */}
      <div className="glass-panel rounded-xl p-4 border-2 border-neon-cyan">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-primary" />
            <div>
              <p className="text-foreground text-sm font-bold">Nguyễn Văn A</p>
              <p className="text-neon-cyan text-xs">1,850 ELO</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button className="w-12 h-12 rounded-full bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan flex items-center justify-center">
            <Minus className="w-5 h-5" />
          </button>
          <div className="text-center min-w-[60px]">
            <p className="text-neon-cyan text-4xl font-bold">9</p>
          </div>
          <button className="w-12 h-12 rounded-full bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* VS Divider */}
      <div className="text-center">
        <span className="text-muted-foreground text-lg font-bold">VS</span>
      </div>

      {/* Player B */}
      <div className="glass-panel rounded-xl p-4 border border-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-neon-blue" />
            <div>
              <p className="text-foreground text-sm font-bold">Trần Văn B</p>
              <p className="text-muted-foreground text-xs">1,720 ELO</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button className="w-12 h-12 rounded-full bg-muted/10 border-2 border-muted text-muted-foreground flex items-center justify-center">
            <Minus className="w-5 h-5" />
          </button>
          <div className="text-center min-w-[60px]">
            <p className="text-muted-foreground text-4xl font-bold">7</p>
          </div>
          <button className="w-12 h-12 rounded-full bg-muted/10 border-2 border-muted text-muted-foreground flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Confirm Button */}
      <button className="w-full py-4 bg-gradient-to-r from-neon-green to-neon-cyan rounded-xl text-white font-bold text-base shadow-[0_0_30px_rgba(0,217,255,0.5)] flex items-center justify-center gap-2">
        <Check className="w-5 h-5" />
        Confirm Winner
      </button>

      {/* Auto Advance Info */}
      <div className="text-center">
        <p className="text-muted-foreground text-xs">⚡ Bracket sẽ tự động cập nhật</p>
      </div>
    </div>
  );
};
