import { Trophy, Zap } from 'lucide-react';

export const BracketScreen = () => {
  return (
    <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-sm font-bold font-display">🏆 Bracket DE16</h3>
        <Zap className="w-4 h-4 text-neon-cyan animate-pulse" />
      </div>

      {/* Simplified Bracket Visualization */}
      <div className="flex-1 flex flex-col justify-center gap-3">
        {/* Round of 8 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 glass-panel rounded-lg p-2 border-l-2 border-neon-cyan">
            <p className="text-foreground text-xs font-semibold">Player A</p>
            <p className="text-neon-cyan text-xs">9 - 7</p>
          </div>
          <div className="w-8 h-0.5 bg-gradient-to-r from-neon-cyan to-transparent" />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 glass-panel rounded-lg p-2 border-l-2 border-muted">
            <p className="text-muted-foreground text-xs">Player B</p>
            <p className="text-muted-foreground text-xs">7 - 9</p>
          </div>
          <div className="w-8 h-0.5 bg-muted/30" />
        </div>

        {/* Finals */}
        <div className="flex items-center justify-center gap-2 my-2">
          <div className="flex-1 glass-panel rounded-lg p-3 border-2 border-neon-cyan shadow-[0_0_20px_rgba(0,217,255,0.3)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-xs font-bold">Player A</p>
                <p className="text-neon-cyan text-xs">Winner Path</p>
              </div>
              <Trophy className="w-5 h-5 text-neon-cyan" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 glass-panel rounded-lg p-2 border-l-2 border-primary">
            <p className="text-foreground text-xs font-semibold">Player C</p>
            <p className="text-primary text-xs">8 - 6</p>
          </div>
          <div className="w-8 h-0.5 bg-gradient-to-r from-primary to-transparent" />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 glass-panel rounded-lg p-2 border-l-2 border-muted">
            <p className="text-muted-foreground text-xs">Player D</p>
            <p className="text-muted-foreground text-xs">6 - 8</p>
          </div>
          <div className="w-8 h-0.5 bg-muted/30" />
        </div>
      </div>

      {/* Pinch to Zoom Hint */}
      <div className="text-center">
        <p className="text-muted-foreground text-xs">👆 Pinch to zoom</p>
      </div>
    </div>
  );
};
