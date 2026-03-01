/**
 * Badge Display Components
 * Show user badges, achievements, and badge unlock celebrations
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as UIBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Award,
  Lock,
  CheckCircle,
  Star,
  Trophy,
  Flame,
  BookOpen,
  Target,
  Zap,
  Crown,
  Medal,
  Gift,
} from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { Badge as BadgeType } from '@/lib/academy/gamification.service';
import { cn } from '@/lib/utils';

// Badge icon mapping
const BADGE_ICONS: Record<string, React.ComponentType<any>> = {
  star: Star,
  trophy: Trophy,
  flame: Flame,
  book: BookOpen,
  target: Target,
  zap: Zap,
  crown: Crown,
  medal: Medal,
  award: Award,
  gift: Gift,
};

// Badge rarity colors
const RARITY_COLORS: Record<string, string> = {
  common: 'from-gray-500 to-gray-600 border-gray-400',
  uncommon: 'from-green-500 to-green-600 border-green-400',
  rare: 'from-blue-500 to-blue-600 border-blue-400',
  epic: 'from-purple-500 to-purple-600 border-purple-400',
  legendary: 'from-yellow-500 to-orange-500 border-yellow-400',
};

interface BadgeDisplayProps {
  showLocked?: boolean;
  maxVisible?: number;
  className?: string;
}

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  showLocked = false,
  maxVisible,
  className,
}) => {
  const { badges, badgesLoading } = useGamification();
  const [showAll, setShowAll] = useState(false);

  if (badgesLoading) {
    return (
      <div className={cn('grid grid-cols-4 gap-4', className)}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto" />
            <div className="h-3 bg-gray-700 rounded w-12 mx-auto mt-2" />
          </div>
        ))}
      </div>
    );
  }

  const earnedBadges = badges?.filter((b) => b.earned_at) || [];
  const displayBadges = maxVisible && !showAll ? earnedBadges.slice(0, maxVisible) : earnedBadges;

  return (
    <div className={className}>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
        {displayBadges.map((badge) => (
          <BadgeItem key={badge.id} badge={badge} earned />
        ))}

        {showLocked && !earnedBadges.length && (
          <div className="col-span-full text-center py-8 text-gray-400">
            <Lock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No badges earned yet</p>
            <p className="text-sm">Complete courses and challenges to earn badges!</p>
          </div>
        )}
      </div>

      {maxVisible && earnedBadges.length > maxVisible && (
        <div className="text-center mt-4">
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="text-gray-400 hover:text-white"
          >
            {showAll ? 'Show Less' : `View All ${earnedBadges.length} Badges`}
          </Button>
        </div>
      )}
    </div>
  );
};

// Single badge item
interface BadgeItemProps {
  badge: BadgeType & { earned_at?: string };
  earned?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const BadgeItem: React.FC<BadgeItemProps> = ({
  badge,
  earned = false,
  onClick,
  size = 'md',
}) => {
  const IconComponent = BADGE_ICONS[badge.icon || 'award'] || Award;
  const rarityClass = RARITY_COLORS[badge.rarity || 'common'] || RARITY_COLORS.common;

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={cn(
        'group relative cursor-pointer',
        onClick && 'hover:scale-105 transition-transform'
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'rounded-full mx-auto flex items-center justify-center border-2 transition-all',
          sizeClasses[size],
          earned ? `bg-gradient-to-br ${rarityClass}` : 'bg-gray-800 border-gray-600 opacity-50'
        )}
      >
        <IconComponent className={cn(iconSizes[size], earned ? 'text-white' : 'text-gray-500')} />
      </div>

      {/* Badge name */}
      <p
        className={cn('text-center mt-2 text-xs truncate', earned ? 'text-white' : 'text-gray-500')}
      >
        {badge.name}
      </p>

      {/* Lock icon for unearned */}
      {!earned && (
        <div className="absolute top-0 right-0 -mr-1 -mt-1">
          <Lock className="h-4 w-4 text-gray-500" />
        </div>
      )}

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-48 text-center">
        <p className="text-sm font-medium text-white">{badge.name}</p>
        <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
        {badge.xp_reward && <p className="text-xs text-yellow-500 mt-1">+{badge.xp_reward} XP</p>}
        <UIBadge
          variant="outline"
          className={cn(
            'mt-2 text-xs',
            badge.rarity === 'legendary' && 'border-yellow-500 text-yellow-500',
            badge.rarity === 'epic' && 'border-purple-500 text-purple-500',
            badge.rarity === 'rare' && 'border-blue-500 text-blue-500',
            badge.rarity === 'uncommon' && 'border-green-500 text-green-500'
          )}
        >
          {badge.rarity?.toUpperCase() || 'COMMON'}
        </UIBadge>
      </div>
    </div>
  );
};

// Full badge card with details
interface BadgeCardProps {
  badge: BadgeType & { earned_at?: string };
  className?: string;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge, className }) => {
  const IconComponent = BADGE_ICONS[badge.icon || 'award'] || Award;
  const rarityClass = RARITY_COLORS[badge.rarity || 'common'];
  const earned = !!badge.earned_at;

  return (
    <Card
      className={cn(
        'bg-gray-900/50 border-gray-800 overflow-hidden',
        !earned && 'opacity-60',
        className
      )}
    >
      <div
        className={cn('h-2 bg-gradient-to-r', earned ? rarityClass : 'from-gray-600 to-gray-700')}
      />
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center border-2 flex-shrink-0',
              earned ? `bg-gradient-to-br ${rarityClass}` : 'bg-gray-800 border-gray-600'
            )}
          >
            <IconComponent className={cn('h-8 w-8', earned ? 'text-white' : 'text-gray-500')} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-white">{badge.name}</h4>
              {earned && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
            </div>
            <p className="text-sm text-gray-400 mt-1">{badge.description}</p>

            <div className="flex items-center gap-3 mt-3">
              <UIBadge
                variant="outline"
                className={cn(
                  'text-xs',
                  badge.rarity === 'legendary' && 'border-yellow-500 text-yellow-500',
                  badge.rarity === 'epic' && 'border-purple-500 text-purple-500',
                  badge.rarity === 'rare' && 'border-blue-500 text-blue-500',
                  badge.rarity === 'uncommon' && 'border-green-500 text-green-500'
                )}
              >
                {badge.rarity?.toUpperCase() || 'COMMON'}
              </UIBadge>

              {badge.xp_reward && (
                <span className="text-xs text-yellow-500">+{badge.xp_reward} XP</span>
              )}

              {earned && badge.earned_at && (
                <span className="text-xs text-gray-500">
                  Earned {new Date(badge.earned_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Badges section with categories
export const BadgesSection: React.FC<{ className?: string }> = ({ className }) => {
  const { badges, badgesLoading } = useGamification();
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);

  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const earnedBadges = badges?.filter((b) => b.earned_at) || [];

  const filteredBadges = selectedRarity
    ? earnedBadges.filter((b) => b.rarity === selectedRarity)
    : earnedBadges;

  const badgesByRarity = rarities.reduce(
    (acc, rarity) => {
      acc[rarity] = earnedBadges.filter((b) => b.rarity === rarity).length;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Card className={cn('bg-gray-900/50 border-gray-800', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Award className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-white">Your Badges</CardTitle>
              <p className="text-sm text-gray-400">
                {earnedBadges.length} badge{earnedBadges.length !== 1 ? 's' : ''} earned
              </p>
            </div>
          </div>
        </div>

        {/* Rarity filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedRarity(null)}
            className={cn('text-xs', !selectedRarity && 'bg-gray-700')}
          >
            All ({earnedBadges.length})
          </Button>
          {rarities.map((rarity) => (
            <Button
              key={rarity}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRarity(rarity)}
              className={cn(
                'text-xs capitalize',
                selectedRarity === rarity && 'bg-gray-700',
                rarity === 'legendary' && 'text-yellow-500',
                rarity === 'epic' && 'text-purple-500',
                rarity === 'rare' && 'text-blue-500',
                rarity === 'uncommon' && 'text-green-500'
              )}
            >
              {rarity} ({badgesByRarity[rarity]})
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {badgesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-800 rounded-lg h-32" />
            ))}
          </div>
        ) : filteredBadges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No {selectedRarity ? `${selectedRarity} ` : ''}badges earned yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Badge unlock celebration modal
interface BadgeUnlockCelebrationProps {
  badge: BadgeType | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BadgeUnlockCelebration: React.FC<BadgeUnlockCelebrationProps> = ({
  badge,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !badge) return null;

  const IconComponent = BADGE_ICONS[badge.icon || 'award'] || Award;
  const rarityClass = RARITY_COLORS[badge.rarity || 'common'];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-sm w-full text-center animate-bounce-in border border-purple-500/30">
        <div className="relative mb-6">
          <div
            className={cn(
              'w-32 h-32 mx-auto rounded-full bg-gradient-to-br flex items-center justify-center animate-pulse border-4',
              rarityClass
            )}
          >
            <IconComponent className="h-16 w-16 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">🏆 Badge Unlocked!</h2>
        <p className="text-xl text-purple-400 font-bold mb-2">{badge.name}</p>
        <p className="text-gray-400 mb-4">{badge.description}</p>

        {badge.xp_reward && (
          <UIBadge className="bg-yellow-500/20 text-yellow-500 mb-4">
            +{badge.xp_reward} XP Bonus
          </UIBadge>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          Awesome! 🎉
        </button>
      </div>
    </div>
  );
};

export default BadgeDisplay;
