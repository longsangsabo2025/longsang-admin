import { Star, Users, Clock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface GamingCourseCardProps {
  image: string;
  title: string;
  instructor: string;
  rating: number;
  reviews: number;
  students: string;
  duration: string;
  price?: number;
  enrolled?: boolean;
  progress?: number;
  badge?: {
    text: string;
    variant: 'bestseller' | 'new' | 'trending' | 'premium';
  };
  level?: string;
}

const badgeStyles = {
  bestseller: 'bg-gaming-warning text-black',
  new: 'bg-gaming-cyan text-black',
  trending: 'bg-primary text-primary-foreground',
  premium: 'bg-gaming-purple text-white',
};

const badgeIcons = {
  bestseller: '🔥',
  new: '🆕',
  trending: '⚡',
  premium: '💎',
};

export const GamingCourseCard = ({
  image,
  title,
  instructor,
  rating,
  reviews,
  students,
  duration,
  price,
  enrolled = false,
  progress = 0,
  badge,
  level = 'Intermediate',
}: GamingCourseCardProps) => {
  return (
    <Card className="glass-card overflow-hidden hover-lift group cursor-pointer border border-border/50 hover:border-primary/50">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {badge && (
          <Badge className={`absolute top-3 left-3 ${badgeStyles[badge.variant]} font-bold`}>
            {badgeIcons[badge.variant]} {badge.text}
          </Badge>
        )}
        {enrolled && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm p-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-gaming-cyan">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            className="bg-gaming-cyan hover:bg-gaming-cyan/80 text-black shadow-[0_0_20px_hsl(180,100%,50%/0.5)]"
            size="lg"
          >
            {enrolled ? 'Continue Lesson' : 'Preview Course'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <span>👤</span>
          <span>{instructor}</span>
          <span className="text-gaming-cyan">✓</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-gaming-warning fill-gaming-warning" />
            <span className="font-semibold text-foreground">{rating}</span>
            <span>({reviews.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{duration}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Users className="h-3 w-3" />
          <span>{students} students</span>
          <TrendingUp className="h-3 w-3 ml-auto" />
          <span>{level}</span>
        </div>

        {/* Price / Enrolled Status */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          {enrolled ? (
            <Badge variant="outline" className="border-gaming-cyan text-gaming-cyan">
              📚 ENROLLED
            </Badge>
          ) : (
            <p className="text-xl font-bold text-foreground">${price}</p>
          )}
          <Button
            className={enrolled ? 'bg-gaming-purple hover:bg-gaming-purple/80 text-white' : ''}
            variant={enrolled ? 'default' : 'outline'}
            size="sm"
          >
            {enrolled ? 'Continue' : 'Enroll'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
