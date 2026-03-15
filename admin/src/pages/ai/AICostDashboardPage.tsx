/**
 * AI Cost Dashboard Page
 * Wrapper for AICostDashboard component with Layout
 */

import { AICostDashboard } from '@/components/ai/AICostDashboard';

export default function AICostDashboardPage() {
  return (
    <div className="container py-6">
      <AICostDashboard />
    </div>
  );
}
