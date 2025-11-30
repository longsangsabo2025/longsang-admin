import { Search } from "lucide-react";
import { motion } from "framer-motion";

interface SearchBarProps {
  placeholder?: string;
}

export const SearchBar = ({ placeholder = "Search destinations..." }: SearchBarProps) => {
  return (
    <div className="relative flex items-center bg-white rounded-full h-14 px-1 shadow-lg">
      <input
        type="text"
        placeholder={placeholder}
        className="flex-1 px-4 bg-transparent text-gray-800 placeholder:text-gray-400 outline-none"
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="h-12 w-12 rounded-full bg-gradient-to-r from-app-blue to-app-light-blue flex items-center justify-center text-white shadow-glow"
      >
        <Search size={20} />
      </motion.button>
    </div>
  );
};
