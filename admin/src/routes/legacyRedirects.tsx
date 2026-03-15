import { Navigate, Route } from 'react-router-dom';

export const legacyRedirects = (
  <>
    {/* Redirect root to mission control */}
    <Route path="/" element={<Navigate to="/admin/mission-control" replace />} />

    {/* Legacy brain redirects */}
    <Route path="/brain" element={<Navigate to="/admin/brain" replace />} />
    <Route path="/brain/*" element={<Navigate to="/admin/brain" replace />} />

    {/* Legacy showcase redirect */}
    <Route path="/legacy-showcase" element={<Navigate to="/project-showcase" replace />} />

    {/* Dev/Debug redirects - moved under admin */}
    <Route path="/dev-setup" element={<Navigate to="/admin/dev-setup" replace />} />
    <Route path="/supabase-test" element={<Navigate to="/admin/supabase-test" replace />} />
    <Route path="/google-drive-test" element={<Navigate to="/admin/google-drive-test" replace />} />

    {/* Automation & Agent Center - moved under /admin */}
    <Route path="/automation" element={<Navigate to="/admin/automation" replace />} />
    <Route path="/automation/*" element={<Navigate to="/admin/automation" replace />} />
    <Route path="/agent-center" element={<Navigate to="/admin/agent-center" replace />} />
    <Route path="/agent-test" element={<Navigate to="/admin/agent-test" replace />} />
    <Route path="/analytics" element={<Navigate to="/admin/unified-analytics" replace />} />

    {/* Shortcuts - Redirect to admin routes */}
    <Route path="/ai-workspace" element={<Navigate to="/admin/ai-workspace" replace />} />
  </>
);
