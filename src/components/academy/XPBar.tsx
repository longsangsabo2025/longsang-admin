/**
 * XP Progress Bar Component
 * Shows current XP, level, and progress to next level
 */

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Trophy, Zap, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface UserXPData {
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  total_achievements: number;
  total_revenue_generated: number;
}

export function XPBar() {
  // Demo mode - sử dụng demo user ID
  const userId = 'demo-user-123';
  const [xpData, setXpData] = useState<UserXPData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadXPData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('user_xp_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_xp',
          filter: `user_id=eq.${userId}`
        },
        () => {
          loadXPData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadXPData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading XP data:', error);
        return;
      }

      if (data) {
        setXpData(data);
      } else {
        // Create initial XP record for demo user
        const { data: newData, error: insertError } = await supabase
          .from('user_xp')
          .insert({
            user_id: userId,
            total_xp: 0,
            current_level: 1,
            xp_to_next_level: 100
          })
          .select()
          .single();

        if (!insertError && newData) {
          setXpData(newData);
        }
      }
    } catch (error) {
      console.error('Error in loadXPData:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !xpData) {
    return (
      <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/20">
        <div className="animate-pulse">
          <div className="h-4 bg-purple-500/20 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-purple-500/20 rounded"></div>
        </div>
      </Card>
    );
  }

  const currentXP = xpData.total_xp % xpData.xp_to_next_level;
  const progressPercent = (currentXP / xpData.xp_to_next_level) * 100;

  return (
    <Card className="p-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/20 hover:border-purple-500/40 transition-all">
      {/* Level Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {xpData.current_level}
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Level {xpData.current_level}</h3>
            <p className="text-sm text-gray-400">
              {xpData.total_achievements} Achievements Unlocked
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-lg">
            <Zap className="w-5 h-5" />
            {xpData.total_xp.toLocaleString()} XP
          </div>
          <p className="text-xs text-gray-400">Total Experience</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">
            {currentXP} / {xpData.xp_to_next_level} XP
          </span>
          <span className="text-purple-400 font-semibold">
            {Math.round(progressPercent)}% to Level {xpData.current_level + 1}
          </span>
        </div>
        <Progress 
          value={progressPercent} 
          className="h-3 bg-gray-800"
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-purple-500/20">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-xs text-gray-400">Achievements</p>
            <p className="font-bold text-white">{xpData.total_achievements}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-xs text-gray-400">Revenue Generated</p>
            <p className="font-bold text-green-400">
              ${xpData.total_revenue_generated.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
