/**
 * YouTube Harvester — Step Indicator Component
 */

import { CheckCircle2 } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-6 px-2">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index < currentStep ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
            </div>
            <span className={`mt-1 text-xs ${index === currentStep ? 'font-medium' : 'text-muted-foreground'}`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 md:w-12 h-0.5 mx-1 md:mx-2 ${index < currentStep ? 'bg-green-500' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
