/**
 * 🎬 SABO AI Studio
 * 
 * Central hub for AI-powered content creation
 * - Channel Builder: Main hub to manage channels, ideas, calendar
 * - Creation Tools: Generate raw materials (video, image, audio, etc.)
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Crown,
  Video,
  Music,
  Image as ImageIcon,
  Sparkles,
  Wand2,
  Mic,
  Film,
  Box,
  Lock,
  Loader2,
  Tv,
  Wrench,
} from 'lucide-react';

// Import Studio modules - lazy loaded for performance
const AvatarStudioContent = lazy(() => import('./studio/AvatarStudioContent'));
const ChannelBuilderContent = lazy(() => import('./studio/ChannelBuilderContent'));
const ImageGenerator = lazy(() => import('./ImageGenerator'));
const VideoGenerator = lazy(() => import('./VideoGenerator'));

// =============================================================================
// TYPES
// =============================================================================

interface StudioModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'coming-soon' | 'beta';
  category: 'main' | 'tool';
  component?: React.ComponentType;
}

// =============================================================================
// STUDIO MODULES
// =============================================================================

const STUDIO_MODULES: StudioModule[] = [
  // === MAIN HUB ===
  {
    id: 'channel',
    name: 'Channel Builder',
    description: 'Quản lý kênh, series, lịch đăng',
    icon: <Tv className="h-5 w-5" />,
    status: 'active',
    category: 'main',
    component: ChannelBuilderContent,
  },
  // === CREATION TOOLS ===
  {
    id: 'avatar',
    name: 'Avatar Studio',
    description: 'Tạo AI Digital Twin',
    icon: <Crown className="h-5 w-5" />,
    status: 'active',
    category: 'tool',
    component: AvatarStudioContent,
  },
  {
    id: 'video',
    name: 'Video Studio',
    description: 'Tạo video AI với Veo3, Kling',
    icon: <Video className="h-5 w-5" />,
    status: 'active',
    category: 'tool',
    component: VideoGenerator,
  },
  {
    id: 'image',
    name: 'Image Studio',
    description: 'Tạo ảnh AI với DALL-E, Flux',
    icon: <ImageIcon className="h-5 w-5" />,
    status: 'active',
    category: 'tool',
    component: ImageGenerator,
  },
  {
    id: 'audio',
    name: 'Audio Studio',
    description: 'Text-to-Speech, Voice Clone',
    icon: <Mic className="h-5 w-5" />,
    status: 'coming-soon',
    category: 'tool',
  },
  {
    id: 'music',
    name: 'Music Studio',
    description: 'AI Music Generation với Suno',
    icon: <Music className="h-5 w-5" />,
    status: 'coming-soon',
    category: 'tool',
  },
  {
    id: '3d',
    name: '3D Studio',
    description: 'Tạo 3D models với AI',
    icon: <Box className="h-5 w-5" />,
    status: 'coming-soon',
    category: 'tool',
  },
];

// Group modules by category
const mainModules = STUDIO_MODULES.filter(m => m.category === 'main');
const toolModules = STUDIO_MODULES.filter(m => m.category === 'tool');

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function Studio() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeModuleId = searchParams.get('tab') || 'channel';
  
  const activeModule = STUDIO_MODULES.find(m => m.id === activeModuleId) || STUDIO_MODULES[0];
  const ActiveComponent = activeModule?.component;

  const handleModuleChange = (moduleId: string) => {
    const module = STUDIO_MODULES.find(m => m.id === moduleId);
    if (module?.status === 'active') {
      setSearchParams({ tab: moduleId });
    }
  };

  // Render module button
  const renderModuleButton = (module: StudioModule) => {
    const isActive = module.id === activeModuleId;
    const isDisabled = module.status !== 'active';
    const isMain = module.category === 'main';
    
    // Determine button style based on state
    const getButtonStyle = () => {
      if (isActive && isMain) {
        return 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg';
      }
      if (isActive) {
        return 'bg-primary text-primary-foreground';
      }
      if (isDisabled) {
        return 'opacity-50 cursor-not-allowed';
      }
      return 'hover:bg-muted';
    };
    
    return (
      <button
        key={module.id}
        onClick={() => handleModuleChange(module.id)}
        disabled={isDisabled}
        className={cn(
          'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all',
          getButtonStyle()
        )}
      >
        <div className={cn(
          'p-2 rounded-lg',
          isActive ? 'bg-white/20' : 'bg-muted'
        )}>
          {module.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{module.name}</span>
            {module.status === 'coming-soon' && (
              <Lock className="h-3 w-3" />
            )}
            {module.status === 'beta' && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                BETA
              </Badge>
            )}
          </div>
          <p className={cn(
            'text-xs mt-0.5 line-clamp-1',
            isActive ? 'text-white/70' : 'text-muted-foreground'
          )}>
            {module.description}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-purple-500" />
            AI Studio
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Trung tâm sáng tạo nội dung AI
          </p>
        </div>

        {/* Module List */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-4">
            {/* Main Hub Section */}
            <div className="space-y-1">
              {mainModules.map(renderModuleButton)}
            </div>

            {/* Tools Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Creation Tools
                </span>
              </div>
              <div className="space-y-1">
                {toolModules.map(renderModuleButton)}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Powered by AI</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {ActiveComponent ? (
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <ActiveComponent />
          </Suspense>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Film className="h-16 w-16 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
            <p className="text-sm">{activeModule?.name} đang được phát triển</p>
            <Badge variant="outline" className="mt-4">
              <Lock className="h-3 w-3 mr-1" />
              Sẽ có trong phiên bản tiếp theo
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
