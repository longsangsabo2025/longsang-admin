import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { motion } from "framer-motion";

export const DashboardScreen = () => {
  return (
    <div className="h-full w-full p-4 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div>
        <h3 className="text-white text-sm font-semibold mb-1">Analytics Overview</h3>
        <p className="text-white/50 text-xs">Last 30 days performance</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-4 h-4 text-app-light-blue" />
            <div className="flex items-center gap-1 text-green-400">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs">12%</span>
            </div>
          </div>
          <p className="text-white/50 text-xs mb-1">Total Views</p>
          <p className="text-white text-lg font-bold">24.5K</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-4 h-4 text-mesh-purple" />
            <div className="flex items-center gap-1 text-green-400">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs">8%</span>
            </div>
          </div>
          <p className="text-white/50 text-xs mb-1">Engagement</p>
          <p className="text-white text-lg font-bold">18.2K</p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white text-xs font-medium">Weekly Trend</p>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-app-light-blue" />
            <div className="w-2 h-2 rounded-full bg-mesh-purple/50" />
          </div>
        </div>
        
        {/* Simple bar chart */}
        <div className="flex items-end justify-between h-20 gap-1">
          {[40, 65, 45, 80, 60, 85, 70].map((height, i) => (
            <motion.div
              key={i}
              className="flex-1 bg-gradient-to-t from-app-blue to-app-light-blue rounded-t"
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            />
          ))}
        </div>
        
        <div className="flex justify-between mt-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <p key={i} className="text-white/40 text-[9px]">{day}</p>
          ))}
        </div>
      </div>
      
      {/* Progress bars */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between mb-1">
            <p className="text-white/70 text-xs">Completion Rate</p>
            <p className="text-white text-xs font-medium">87%</p>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-app-blue to-app-light-blue rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '87%' }}
              transition={{ delay: 0.3, duration: 0.8 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
