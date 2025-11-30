import React from 'react';

interface TechIconProps {
  type: string;
  className?: string;
}

export const TechIcon: React.FC<TechIconProps> = ({ type, className = "w-12 h-12" }) => {
  const icons: Record<string, JSX.Element> = {
    flutter: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="flutter-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D9FF" />
            <stop offset="100%" stopColor="#0066FF" />
          </linearGradient>
        </defs>
        <path d="M50 10 L90 50 L70 70 L50 50 L30 70 L10 50 Z" fill="url(#flutter-grad)" opacity="0.9" />
        <path d="M50 50 L70 70 L50 90 L30 70 Z" fill="url(#flutter-grad)" opacity="0.6" />
      </svg>
    ),
    firebase: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="firebase-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9500" />
            <stop offset="50%" stopColor="#FF5733" />
            <stop offset="100%" stopColor="#FFC300" />
          </linearGradient>
        </defs>
        <path d="M50 10 L70 35 L50 50 L30 35 Z" fill="url(#firebase-grad)" opacity="0.9" />
        <path d="M30 35 L50 50 L50 90 L20 70 Z" fill="url(#firebase-grad)" opacity="0.7" />
        <path d="M70 35 L50 50 L50 90 L80 70 Z" fill="url(#firebase-grad)" opacity="0.8" />
      </svg>
    ),
    supabase: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="supabase-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3ECF8E" />
            <stop offset="100%" stopColor="#00D4AA" />
          </linearGradient>
        </defs>
        <rect x="20" y="20" width="60" height="60" rx="8" fill="url(#supabase-grad)" opacity="0.3" />
        <path d="M40 30 L60 30 L60 50 L70 50 L50 70 L30 50 L40 50 Z" fill="url(#supabase-grad)" />
      </svg>
    ),
    postgresql: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="postgres-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#336791" />
            <stop offset="100%" stopColor="#5AB9FF" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="50" rx="30" ry="40" fill="url(#postgres-grad)" opacity="0.3" />
        <path d="M35 35 Q50 25 65 35 L65 65 Q50 75 35 65 Z" fill="url(#postgres-grad)" />
        <circle cx="50" cy="50" r="8" fill="#00D9FF" opacity="0.8" />
      </svg>
    ),
    cloud: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="cloud-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4285F4" />
            <stop offset="50%" stopColor="#34A853" />
            <stop offset="100%" stopColor="#FBBC04" />
          </linearGradient>
        </defs>
        <path d="M30 50 Q30 35 45 35 Q45 25 55 25 Q65 25 65 35 Q80 35 80 50 Q80 65 65 65 L35 65 Q30 65 30 50 Z" 
              fill="url(#cloud-grad)" opacity="0.8" />
      </svg>
    ),
    oauth: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="oauth-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D9FF" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="30" fill="none" stroke="url(#oauth-grad)" strokeWidth="4" opacity="0.6" />
        <circle cx="50" cy="50" r="20" fill="none" stroke="url(#oauth-grad)" strokeWidth="3" />
        <circle cx="50" cy="50" r="8" fill="url(#oauth-grad)" />
      </svg>
    ),
    react: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="react-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D9FF" />
            <stop offset="100%" stopColor="#61DAFB" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="url(#react-grad)" strokeWidth="3" />
        <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="url(#react-grad)" strokeWidth="3" transform="rotate(60 50 50)" />
        <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="url(#react-grad)" strokeWidth="3" transform="rotate(120 50 50)" />
        <circle cx="50" cy="50" r="6" fill="url(#react-grad)" />
      </svg>
    ),
    nodejs: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="node-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3ECF8E" />
            <stop offset="100%" stopColor="#68A063" />
          </linearGradient>
        </defs>
        <path d="M50 10 L80 30 L80 70 L50 90 L20 70 L20 30 Z" fill="url(#node-grad)" opacity="0.8" />
        <path d="M50 35 L65 43 L65 57 L50 65 L35 57 L35 43 Z" fill="#00FF88" opacity="0.6" />
      </svg>
    ),
    pinecone: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="pinecone-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>
        </defs>
        <path d="M50 15 L35 30 L35 50 L50 65 L65 50 L65 30 Z" fill="url(#pinecone-grad)" opacity="0.7" />
        <circle cx="50" cy="35" r="5" fill="#FF6B6B" />
        <circle cx="50" cy="50" r="5" fill="#9333EA" />
      </svg>
    ),
    openai: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="openai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10A37F" />
            <stop offset="50%" stopColor="#00D9FF" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="35" fill="none" stroke="url(#openai-grad)" strokeWidth="4" />
        <path d="M50 20 L50 80 M20 50 L80 50 M30 30 L70 70 M70 30 L30 70" 
              stroke="url(#openai-grad)" strokeWidth="2" opacity="0.6" />
      </svg>
    ),
    langchain: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="langchain-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9500" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
        </defs>
        <path d="M20 50 L35 35 L50 50 L65 35 L80 50" fill="none" stroke="url(#langchain-grad)" strokeWidth="4" />
        <circle cx="20" cy="50" r="6" fill="url(#langchain-grad)" />
        <circle cx="50" cy="50" r="6" fill="url(#langchain-grad)" />
        <circle cx="80" cy="50" r="6" fill="url(#langchain-grad)" />
      </svg>
    ),
    redis: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="redis-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC382D" />
            <stop offset="100%" stopColor="#FF6B6B" />
          </linearGradient>
        </defs>
        <rect x="25" y="35" width="50" height="30" rx="5" fill="url(#redis-grad)" opacity="0.8" />
        <path d="M30 45 L50 35 L70 45" stroke="#FFD700" strokeWidth="2" fill="none" />
        <path d="M30 55 L50 45 L70 55" stroke="#FFD700" strokeWidth="2" fill="none" />
      </svg>
    ),
    docker: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="docker-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0DB7ED" />
            <stop offset="100%" stopColor="#2496ED" />
          </linearGradient>
        </defs>
        <rect x="20" y="40" width="12" height="12" fill="url(#docker-grad)" />
        <rect x="35" y="40" width="12" height="12" fill="url(#docker-grad)" />
        <rect x="50" y="40" width="12" height="12" fill="url(#docker-grad)" />
        <rect x="65" y="40" width="12" height="12" fill="url(#docker-grad)" />
        <rect x="35" y="25" width="12" height="12" fill="url(#docker-grad)" opacity="0.7" />
        <rect x="50" y="25" width="12" height="12" fill="url(#docker-grad)" opacity="0.7" />
      </svg>
    ),
    vscode: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="vscode-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#007ACC" />
            <stop offset="100%" stopColor="#00D9FF" />
          </linearGradient>
        </defs>
        <path d="M70 15 L70 85 L50 70 L30 85 L30 50 L50 40 L30 30 L30 15 Z" fill="url(#vscode-grad)" />
      </svg>
    ),
    androidstudio: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="android-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3DDC84" />
            <stop offset="100%" stopColor="#A4C639" />
          </linearGradient>
        </defs>
        <path d="M50 20 Q70 20 70 40 L70 70 Q70 80 60 80 L40 80 Q30 80 30 70 L30 40 Q30 20 50 20 Z" 
              fill="url(#android-grad)" opacity="0.8" />
        <circle cx="40" cy="40" r="4" fill="#fff" />
        <circle cx="60" cy="40" r="4" fill="#fff" />
        <line x1="35" y1="15" x2="40" y2="25" stroke="url(#android-grad)" strokeWidth="3" />
        <line x1="65" y1="15" x2="60" y2="25" stroke="url(#android-grad)" strokeWidth="3" />
      </svg>
    ),
    xcode: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="xcode-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#147EFB" />
            <stop offset="100%" stopColor="#00D9FF" />
          </linearGradient>
        </defs>
        <path d="M30 30 L70 30 L70 70 L30 70 Z" fill="url(#xcode-grad)" opacity="0.3" />
        <path d="M35 40 L50 55 L35 70" stroke="url(#xcode-grad)" strokeWidth="4" fill="none" />
        <line x1="55" y1="65" x2="65" y2="65" stroke="url(#xcode-grad)" strokeWidth="4" />
      </svg>
    ),
    figma: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="figma-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F24E1E" />
            <stop offset="25%" stopColor="#FF7262" />
            <stop offset="50%" stopColor="#A259FF" />
            <stop offset="75%" stopColor="#1ABCFE" />
            <stop offset="100%" stopColor="#0ACF83" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="30" r="12" fill="url(#figma-grad)" opacity="0.8" />
        <circle cx="60" cy="30" r="12" fill="url(#figma-grad)" opacity="0.6" />
        <circle cx="40" cy="50" r="12" fill="url(#figma-grad)" opacity="0.7" />
        <circle cx="60" cy="50" r="12" fill="url(#figma-grad)" opacity="0.9" />
        <circle cx="40" cy="70" r="12" fill="url(#figma-grad)" />
      </svg>
    ),
    postman: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="postman-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6C37" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="30" fill="url(#postman-grad)" opacity="0.3" />
        <path d="M35 50 L50 35 L65 50 L50 65 Z" fill="url(#postman-grad)" />
      </svg>
    ),
    github: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="github-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6E40C9" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>
        </defs>
        <path d="M50 15 Q70 20 75 40 Q75 60 65 70 Q55 75 50 85 Q45 75 35 70 Q25 60 25 40 Q30 20 50 15 Z" 
              fill="url(#github-grad)" opacity="0.8" />
        <circle cx="40" cy="45" r="5" fill="#fff" />
        <circle cx="60" cy="45" r="5" fill="#fff" />
      </svg>
    ),
    vercel: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="vercel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000" />
            <stop offset="100%" stopColor="#333" />
          </linearGradient>
        </defs>
        <path d="M50 20 L80 80 L20 80 Z" fill="url(#vercel-grad)" />
        <path d="M50 20 L80 80 L20 80 Z" fill="none" stroke="#00D9FF" strokeWidth="2" opacity="0.5" />
      </svg>
    ),
    datadog: (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="datadog-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#632CA6" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>
        </defs>
        <rect x="25" y="40" width="10" height="35" rx="2" fill="url(#datadog-grad)" />
        <rect x="40" y="30" width="10" height="45" rx="2" fill="url(#datadog-grad)" />
        <rect x="55" y="35" width="10" height="40" rx="2" fill="url(#datadog-grad)" />
        <rect x="70" y="25" width="10" height="50" rx="2" fill="url(#datadog-grad)" />
      </svg>
    ),
  };

  const normalizedType = type.toLowerCase().replace(/\s+/g, '').replace(/&/g, '');
  
  return icons[normalizedType] || icons.cloud;
};
