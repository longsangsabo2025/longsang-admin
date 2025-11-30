import { ReactNode, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface PhoneMockupProps {
  children: ReactNode;
  size?: "small" | "medium" | "large" | "hero";
  orientation?: "portrait" | "landscape";
  className?: string;
  delay?: number;
  enable3D?: boolean;
}

const sizeClasses = {
  small: "h-[280px] w-[140px]",
  medium: "h-[360px] w-[180px]",
  large: "h-[420px] w-[210px]",
  hero: "h-[500px] w-[250px]",
};

const landscapeSizeClasses = {
  small: "h-[140px] w-[280px]",
  medium: "h-[180px] w-[360px]",
  large: "h-[210px] w-[420px]",
  hero: "h-[250px] w-[500px]",
};

export const PhoneMockup = ({ 
  children, 
  size = "medium", 
  orientation = "portrait",
  className, 
  delay = 0,
  enable3D = true 
}: PhoneMockupProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-7, 7]);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enable3D || !ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={enable3D ? {
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: "preserve-3d",
      } : {}}
      className={cn(
        "relative rounded-[32px] bg-gradient-to-b from-dark-surface to-dark-bg p-2 transition-all duration-300",
        isHovered ? "shadow-phone-3d" : "shadow-phone-lg",
        orientation === "portrait" ? sizeClasses[size] : landscapeSizeClasses[size],
        className
      )}
    >
      {/* Notch (only for portrait) */}
      {orientation === "portrait" && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-dark-bg rounded-b-3xl z-10" />
      )}
      
      {/* Screen */}
      <div className="relative h-full w-full rounded-[24px] bg-gradient-to-br from-dark-surface to-primary/20 overflow-hidden">
        <motion.div 
          className="h-full w-full"
          animate={isHovered ? { scale: 1.02 } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
        
        {/* Home Indicator */}
        <div className={cn(
          "absolute bg-foreground/30 rounded-full",
          orientation === "portrait" 
            ? "bottom-2 left-1/2 -translate-x-1/2 w-20 h-1" 
            : "right-2 top-1/2 -translate-y-1/2 h-20 w-1"
        )} />
      </div>
      
      {/* Reflection overlay */}
      <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
};
