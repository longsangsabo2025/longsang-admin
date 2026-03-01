import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Coffee,
  DollarSign,
  Focus,
  Pause,
  Play,
  SkipForward,
} from 'lucide-react';
import { TASK_CATEGORIES, type SurvivalTask } from '@/types/survival.types';

// =====================================================
// PROPS
// =====================================================

export interface FocusModeViewProps {
  task: SurvivalTask;
  onComplete: () => void;
  onExit: () => void;
  onSkip: () => void;
}

// =====================================================
// COMPONENT
// =====================================================

export function FocusModeView({
  task,
  onComplete,
  onExit,
  onSkip,
}: FocusModeViewProps) {
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const category = TASK_CATEGORIES.find(c => c.id === task.category);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8 text-center">
        {/* Exit Button */}
        <Button
          variant="ghost"
          className="absolute top-4 left-4"
          onClick={onExit}
        >
          ← Thoát Focus Mode
        </Button>

        {/* Focus Icon */}
        <div className="flex justify-center">
          <div className="p-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full">
            <Focus className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Timer */}
        <div className="text-6xl font-mono font-bold">
          {formatTime(seconds)}
        </div>

        {/* Task Info */}
        <Card className="text-left">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              {category && <span className="text-2xl">{category.icon}</span>}
              <Badge variant="outline">{category?.nameVi}</Badge>
              {task.potential_revenue && (
                <Badge className="gap-1 bg-green-500">
                  <DollarSign className="h-3 w-3" />
                  {task.potential_revenue}
                </Badge>
              )}
            </div>
            <h2 className="text-2xl font-bold">{task.title}</h2>
            {task.description && (
              <p className="text-muted-foreground mt-2">{task.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={onSkip}
          >
            <SkipForward className="h-5 w-5 mr-2" />
            Bỏ qua
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? (
              <>
                <Play className="h-5 w-5 mr-2" />
                Tiếp tục
              </>
            ) : (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Tạm dừng
              </>
            )}
          </Button>
          
          <Button
            size="lg"
            className="bg-green-500 hover:bg-green-600"
            onClick={onComplete}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Hoàn thành!
          </Button>
        </div>

        {/* Break reminder */}
        {seconds > 25 * 60 && (
          <div className="flex items-center justify-center gap-2 text-yellow-500">
            <Coffee className="h-5 w-5" />
            <span>Đã 25 phút rồi, nghỉ 5 phút nhé!</span>
          </div>
        )}
      </div>
    </div>
  );
}
