import { cn } from "@/lib/utils";

interface ImageCardProps {
  image: string;
  alt: string;
  badges?: string[];
  className?: string;
}

export const ImageCard = ({ image, alt, badges, className }: ImageCardProps) => {
  return (
    <div className={cn("relative rounded-2xl overflow-hidden aspect-[4/3]", className)}>
      <img src={image} alt={alt} className="w-full h-full object-cover" />
      {badges && badges.length > 0 && (
        <div className="absolute top-3 left-3 flex gap-2">
          {badges.map((badge, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800"
            >
              {badge}
            </span>
          ))}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
};
