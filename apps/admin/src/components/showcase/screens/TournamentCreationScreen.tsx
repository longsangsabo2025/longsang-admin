import { CheckCircle2, Zap, Target, Trophy, Users, MessageCircle } from 'lucide-react';

export const TournamentCreationScreen = () => {
  const formats = [
    { name: 'Single Elimination', icon: Target, selected: false },
    { name: 'Double Elimination', icon: Trophy, selected: true },
    { name: 'Round Robin', icon: Users, selected: false },
    { name: 'Swiss System', icon: Zap, selected: false },
  ];

  return (
    <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg p-4 flex flex-col gap-3">
      {/* Header with Steps */}
      <div className="text-center mb-2">
        <h3 className="text-foreground text-sm font-bold font-display">⚡ Tournament Wizard</h3>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="w-8 h-8 rounded-full bg-neon-cyan flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-dark-bg" />
          </div>
          <div className="w-12 h-0.5 bg-neon-cyan" />
          <div className="w-8 h-8 rounded-full bg-neon-cyan border-4 border-neon-cyan/30 flex items-center justify-center">
            <span className="text-dark-bg text-xs font-bold">2</span>
          </div>
          <div className="w-12 h-0.5 bg-muted/30" />
          <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center">
            <span className="text-muted-foreground text-xs font-bold">3</span>
          </div>
        </div>
        <p className="text-muted-foreground text-xs mt-2">Step 2/5: Chọn định dạng</p>
      </div>

      {/* Format Selection Grid */}
      <div className="flex-1">
        <p className="text-foreground text-xs font-semibold mb-3">🎯 8 Tournament Formats</p>
        <div className="grid grid-cols-2 gap-2">
          {formats.map((format, index) => (
            <button
              key={index}
              className={`glass-panel rounded-xl p-3 text-left transition-all ${
                format.selected
                  ? 'border-2 border-neon-cyan shadow-[0_0_20px_rgba(0,217,255,0.3)]'
                  : 'border border-muted/20'
              }`}
            >
              <format.icon
                className={`w-5 h-5 mb-2 ${
                  format.selected ? 'text-neon-cyan' : 'text-muted-foreground'
                }`}
              />
              <p
                className={`text-xs font-semibold ${
                  format.selected ? 'text-neon-cyan' : 'text-foreground'
                }`}
              >
                {format.name}
              </p>
            </button>
          ))}
        </div>

        {/* Preview Section */}
        <div className="mt-4 glass-panel rounded-xl p-3 border border-neon-cyan/30">
          <p className="text-foreground text-xs font-semibold mb-2">👁️ Bracket Preview</p>
          <div className="h-16 flex items-center justify-center gap-2">
            <div className="w-12 h-8 rounded bg-neon-cyan/20 border border-neon-cyan/50" />
            <div className="w-6 h-0.5 bg-neon-cyan/50" />
            <div className="w-12 h-8 rounded bg-neon-cyan/20 border border-neon-cyan/50" />
          </div>
          <p className="text-center text-muted-foreground text-xs mt-2">DE16 • 16 players</p>
        </div>
      </div>

      {/* Timer & Next Button */}
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-neon-green" />
          <p className="text-neon-green text-xs font-semibold">Tạo giải trong 3 phút ⏱️</p>
        </div>
        <button className="w-full py-3 bg-gradient-to-r from-primary to-neon-cyan rounded-xl text-white font-bold text-sm">
          Tiếp Theo →
        </button>
      </div>
    </div>
  );
};
