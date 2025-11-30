import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface IconRowProps {
  icons: LucideIcon[];
  size?: number;
  spacing?: string;
}

export const IconRow = ({ icons, size = 24, spacing = "gap-6" }: IconRowProps) => {
  return (
    <div className={`flex ${spacing} justify-center`}>
      {icons.map((Icon, index) => (
        <motion.div
          key={index}
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <Icon size={size} />
        </motion.div>
      ))}
    </div>
  );
};
