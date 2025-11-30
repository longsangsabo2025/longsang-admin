/**
 * AI Cost Dashboard Page
 * Wrapper for AICostDashboard component with Layout
 */

import { Layout } from '@/components/Layout';
import { AICostDashboard } from '@/components/ai/AICostDashboard';

export default function AICostDashboardPage() {
  return (
    <Layout>
      <div className="container py-6">
        <AICostDashboard />
      </div>
    </Layout>
  );
}
