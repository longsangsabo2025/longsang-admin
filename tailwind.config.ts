import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'display': ['Space Grotesk', 'Be Vietnam Pro', 'sans-serif'],
        'sans': ['Be Vietnam Pro', 'Inter', 'sans-serif'],
      },
      colors: {
        'neon-cyan': 'hsl(var(--neon-cyan))',
        'neon-blue': 'hsl(var(--neon-blue))',
        'neon-green': 'hsl(var(--neon-green))',
        'dark-bg': 'hsl(var(--dark-bg))',
        'dark-surface': 'hsl(var(--dark-surface))',
        'glass-bg': 'hsl(var(--glass-bg))',
        'app-dark': 'hsl(var(--app-dark))',
        'app-navy': 'hsl(var(--app-navy))',
        'app-blue': 'hsl(var(--app-blue))',
        'app-light-blue': 'hsl(var(--app-light-blue))',
        'mesh-purple': 'hsl(var(--mesh-purple))',
        'mesh-pink': 'hsl(var(--mesh-pink))',
        'mesh-cyan': 'hsl(var(--mesh-cyan))',
        gaming: {
          purple: 'hsl(var(--gaming-purple))',
          cyan: 'hsl(var(--gaming-cyan))',
          success: 'hsl(var(--gaming-success))',
          warning: 'hsl(var(--gaming-warning))',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backdropBlur: {
        'glass': '20px',
      },
      boxShadow: {
        'phone': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        'phone-lg': '0 30px 60px -15px rgba(0, 0, 0, 0.6), 0 0 40px rgba(59, 130, 246, 0.2)',
        'phone-3d': '0 40px 80px -20px rgba(0, 0, 0, 0.7), 0 0 60px rgba(59, 130, 246, 0.3)',
        'glow': '0 0 30px rgba(59, 130, 246, 0.3)',
        'glow-purple': '0 0 40px rgba(139, 92, 246, 0.4)',
        'glow-cyan': '0 0 35px rgba(6, 182, 212, 0.35)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "slide-in": {
          "0%": {
            transform: "translateX(100%)"
          },
          "100%": {
            transform: "translateX(0)"
          }
        },
        "slide-out": {
          "0%": {
            transform: "translateX(0)"
          },
          "100%": {
            transform: "translateX(100%)"
          }
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0)"
          },
          "50%": {
            transform: "translateY(-10px)"
          }
        },
        "glow-pulse": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)"
          },
          "50%": {
            opacity: "0.8",
            boxShadow: "0 0 40px rgba(139, 92, 246, 0.8)"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-out": "slide-out 0.3s ease-out",
        "float": "float 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
