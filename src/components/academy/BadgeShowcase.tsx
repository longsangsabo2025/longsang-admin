/**
 * Badge Showcase Component
 * Displays earned achievements and locked badges
 */

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Award, DollarSign, Lock, Rocket, Star, Target, Trophy, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  xp_awarded: number;
  earned_at: string;
  metadata: Record<string, any>;
}

const ACHIEVEMENT_CONFIG = {
  first_lesson: {
    name: 'First Lesson Complete',
    icon: Star,
    color: 'from-blue-500 to-cyan-500',
    xp: 50,
  },
  first_agent_deployed: {
    name: 'Agent Deployed',
    icon: Rocket,
    color: 'from-purple-500 to-pink-500',
    xp: 100,
  },
  first_dollar: {
    name: 'First Dollar Earned',
    icon: DollarSign,
    color: 'from-green-500 to-emerald-500',
    xp: 200,
  },
  first_client: {
    name: 'First Client',
    icon: Users,
    color: 'from-orange-500 to-red-500',
    xp: 300,
  },
  ten_clients: {
    name: '10 Clients Milestone',
    icon: Target,
    color: 'from-yellow-500 to-orange-500',
    xp: 1000,
  },
  saas_launched: {
    name: 'SaaS Launched',
    icon: Trophy,
    color: 'from-indigo-500 to-purple-500',
    xp: 2000,
  },
};

export function BadgeShowcase({ userId }: { userId?: string }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    loadAchievements();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('achievement_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadAchievements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadAchievements = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) {
        console.error('Error loading achievements:', error);
        return;
      }

      setAchievements(data || []);
    } catch (error) {
      console.error('Error in loadAchievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">🏆 Achievements</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-800 rounded-lg"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const earnedTypes = new Set(achievements.map((a) => a.achievement_type));

  return (
    <Card className="p-6 bg-gray-900/50 border-purple-500/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-xl text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Achievements
        </h3>
        <Badge variant="outline" className="text-purple-400 border-purple-500">
          {achievements.length} / {Object.keys(ACHIEVEMENT_CONFIG).length} Unlocked
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(ACHIEVEMENT_CONFIG).map(([type, config]) => {
          const isUnlocked = earnedTypes.has(type);
          const achievement = achievements.find((a) => a.achievement_type === type);
          const IconComponent = config.icon;

          return (
            <div
              key={type}
              className={`
                relative p-4 rounded-lg border-2 transition-all cursor-pointer
                ${
                  isUnlocked
                    ? `bg-gradient-to-br ${config.color} border-transparent shadow-lg hover:scale-105`
                    : 'bg-gray-800/50 border-gray-700 opacity-50'
                }
              `}
            >
              {/* Lock Overlay */}
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-lg">
                  <Lock className="w-8 h-8 text-gray-500" />
                </div>
              )}

              <div className="text-center space-y-2">
                <IconComponent
                  className={`w-12 h-12 mx-auto ${isUnlocked ? 'text-white' : 'text-gray-600'}`}
                />
                <h4 className={`font-bold text-sm ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                  {config.name}
                </h4>
                <div className="flex items-center justify-center gap-1 text-xs">
                  <Award className="w-3 h-3" />
                  <span className={isUnlocked ? 'text-yellow-300' : 'text-gray-600'}>
                    +{config.xp} XP
                  </span>
                </div>
                {isUnlocked && achievement && (
                  <p className="text-xs text-white/70">
                    {new Date(achievement.earned_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Achievement Toast */}
      {achievements.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">🎉 Latest Achievement:</p>
          <p className="font-bold text-white">
            {ACHIEVEMENT_CONFIG[achievements[0].achievement_type as keyof typeof ACHIEVEMENT_CONFIG]
              ?.name || achievements[0].achievement_name}
          </p>
          <p className="text-xs text-cyan-400">+{achievements[0].xp_awarded} XP earned</p>
        </div>
      )}
    </Card>
  );
}
