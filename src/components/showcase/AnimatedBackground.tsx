import { motion } from "framer-motion";

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg" />
      
      {/* Animated mesh gradient */}
      <div className="absolute inset-0 mesh-bg opacity-60" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-40" />
      
      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 rounded-full bg-neon-blue/20 blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-1/3 right-20 w-96 h-96 rounded-full bg-primary/15 blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
          scale: [1, 0.8, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full bg-accent/20 blur-3xl"
        animate={{
          x: [0, 60, 0],
          y: [0, -80, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Smaller floating shapes */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-32 h-32 rounded-full bg-neon-cyan/10 blur-2xl"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
      
      {/* Geometric shapes */}
      <motion.div
        className="absolute top-40 right-40 w-20 h-20 border-2 border-neon-cyan/30 rotate-45"
        animate={{
          rotate: [45, 225, 45],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
        }}
      />
      
      <motion.div
        className="absolute bottom-40 left-20 w-16 h-16 border-2 border-neon-blue/40 rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
        }}
      />
    </div>
  );
};
