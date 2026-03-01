import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FolderOpen, 
  ImageIcon, 
  Rocket, 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ManagerOnboardingProps {
  readonly open: boolean;
  readonly onComplete: () => void;
}

const ONBOARDING_KEY = 'manager-onboarding-completed';

const steps = [
  {
    icon: Sparkles,
    title: 'Chào mừng đến Manager Portal! 🎉',
    description: 'Đây là nơi bạn quản lý các dự án được phân quyền. Giao diện được thiết kế đơn giản để bạn tập trung vào công việc.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: FolderOpen,
    title: 'Quản lý Dự án 📁',
    description: 'Xem danh sách các dự án bạn được phân quyền. Click vào dự án để xem chi tiết, chỉnh sửa nội dung, và theo dõi tiến độ.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: ImageIcon,
    title: 'Thư viện Media 📚',
    description: 'Quản lý hình ảnh, tài liệu và video. Upload file mới, tìm kiếm và sử dụng cho các dự án của bạn.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Rocket,
    title: 'Sẵn sàng bắt đầu! 🚀',
    description: 'Bạn đã sẵn sàng sử dụng Manager Portal. Nếu cần hỗ trợ hoặc thêm quyền truy cập dự án, hãy liên hệ Admin.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
];

export function ManagerOnboarding({ open, onComplete }: ManagerOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as completed
      localStorage.setItem(ONBOARDING_KEY, 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className={cn(
            'mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-4',
            step.bgColor
          )}>
            <StepIcon className={cn('h-8 w-8', step.color)} />
          </div>
          <DialogTitle className="text-xl">{step.title}</DialogTitle>
          <DialogDescription className="text-base pt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="py-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-center gap-2 mt-4">
            {steps.map((step, index) => (
              <button
                key={step.title}
                onClick={() => setCurrentStep(index)}
                title={`Bước ${index + 1}: ${step.title}`}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  index === currentStep && 'bg-primary w-6',
                  index < currentStep && 'bg-primary/50',
                  index > currentStep && 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Bỏ qua
          </Button>
          <Button onClick={handleNext} className="gap-2">
            {isLastStep ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Bắt đầu
              </>
            ) : (
              <>
                Tiếp theo
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if onboarding should be shown
export function useManagerOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Small delay for better UX
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
  };

  return { showOnboarding, completeOnboarding, resetOnboarding };
}

export default ManagerOnboarding;
