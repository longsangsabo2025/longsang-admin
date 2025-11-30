import { Play, ShoppingCart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GamingHeroSectionProps {
  image: string;
  badgeText?: string;
  title: string;
  subtitle: string;
  instructor: string;
  rating: number;
  reviews: number;
  students: string;
  completionRate: number;
  modules: number;
  lessons: number;
  duration: string;
  projects: number;
  price: number;
}

export const GamingHeroSection = ({
  image,
  badgeText = "🔥 TRENDING THIS WEEK",
  title,
  subtitle,
  instructor,
  rating,
  reviews,
  students,
  completionRate,
  modules,
  lessons,
  duration,
  projects,
  price,
}: GamingHeroSectionProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl h-[500px] glass-card group">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-8 md:p-12">
        {/* Badge */}
        <Badge className="w-fit mb-4 bg-gaming-warning text-black font-semibold animate-pulse">
          {badgeText}
        </Badge>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 max-w-3xl">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-gray-200 mb-6 max-w-2xl">
          {subtitle}
        </p>

        {/* Instructor Info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gaming-purple to-gaming-cyan flex items-center justify-center">
              <span className="text-white font-bold">AI</span>
            </div>
            <div>
              <p className="text-sm text-white font-medium">{instructor} ✓</p>
              <div className="flex items-center gap-3 text-xs text-gray-300">
                <span>⭐ {rating} ({reviews.toLocaleString()})</span>
                <span>👥 {students} students</span>
                <span>🎓 {completionRate}% completion</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6 max-w-2xl">
          {[
            { label: "Modules", value: modules.toString() },
            { label: "Lessons", value: lessons.toString() },
            { label: "Duration", value: duration },
            { label: "Projects", value: projects.toString() },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 rounded-lg glass-card">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-300">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4">
          <Button 
            className="bg-gradient-to-r from-gaming-purple to-gaming-cyan hover:shadow-[0_0_30px_hsl(260,60%,60%/0.6)] text-white font-bold" 
            size="lg"
          >
            Enroll Now - ${price}
            <ShoppingCart className="h-5 w-5 ml-2" />
          </Button>
          <Button 
            className="glass-card hover:bg-white/20 text-white border-white/20" 
            variant="outline"
            size="lg"
          >
            <Play className="h-5 w-5 mr-2" />
            Watch Trailer
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
