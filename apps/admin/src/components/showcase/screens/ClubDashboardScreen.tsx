import { Plus, Users, TrendingUp, Calendar, Table } from 'lucide-react';

export const ClubDashboardScreen = () => {
  return (
    <div className="h-full bg-gradient-to-b from-app-dark to-dark-bg p-4 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div>
        <h3 className="text-foreground text-sm font-bold font-display">📈 Club Dashboard</h3>
        <p className="text-muted-foreground text-xs">Billiard Club Sài Gòn</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="glass-panel rounded-lg p-2.5">
          <Users className="w-4 h-4 text-neon-cyan mb-1" />
          <p className="text-foreground text-lg font-bold">156</p>
          <p className="text-muted-foreground text-xs">Members</p>
        </div>
        <div className="glass-panel rounded-lg p-2.5">
          <TrendingUp className="w-4 h-4 text-neon-green mb-1" />
          <p className="text-neon-green text-lg font-bold">45M</p>
          <p className="text-muted-foreground text-xs">Revenue</p>
        </div>
        <div className="glass-panel rounded-lg p-2.5">
          <Calendar className="w-4 h-4 text-primary mb-1" />
          <p className="text-foreground text-lg font-bold">24</p>
          <p className="text-muted-foreground text-xs">Tournaments</p>
        </div>
        <div className="glass-panel rounded-lg p-2.5">
          <Table className="w-4 h-4 text-accent mb-1" />
          <p className="text-foreground text-lg font-bold">12</p>
          <p className="text-muted-foreground text-xs">Tables</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="glass-panel rounded-xl p-3 flex-1">
        <p className="text-foreground text-xs font-semibold mb-2">📊 Doanh thu tháng</p>
        <div className="h-20 flex items-end gap-1">
          {[45, 52, 48, 65, 70, 68, 85, 90].map((height, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-neon-green to-neon-cyan rounded-t"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-muted-foreground text-xs">T1</span>
          <span className="text-muted-foreground text-xs">T8</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button className="px-3 py-2 bg-gradient-to-r from-primary to-neon-cyan rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-2">
          <Plus className="w-3 h-3" />
          Create Tournament
        </button>
        <button className="px-3 py-2 glass-panel rounded-lg text-foreground text-xs font-semibold flex items-center justify-center gap-2 border border-neon-cyan/30">
          <Users className="w-3 h-3" />
          Manage Vouchers
        </button>
      </div>
    </div>
  );
};
