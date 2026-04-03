/**
 * 🎬 YouTube Studio Routes
 * Focused route group under /youtube — no admin sidebar.
 * Reuses existing page components entirely.
 */
import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';

const YouTubeChannels = lazy(() => import('../pages/video/YouTubeChannels'));
const YouTubeChannelWorkspace = lazy(() => import('../pages/video/YouTubeChannelWorkspace'));
const PipelineBuilder = lazy(() => import('../pages/video/PipelineBuilder'));
const PipelineSettings = lazy(() => import('../pages/video/PipelineSettings'));
const VideoFactoryDashboard = lazy(() => import('../pages/video/VideoFactoryDashboard'));

export const youtubeRoutes = (
  <>
    <Route index element={<Navigate to="channels" replace />} />
    <Route path="channels" element={<YouTubeChannels />} />
    <Route path="channels/:channelId" element={<YouTubeChannelWorkspace />} />
    <Route path="pipeline" element={<PipelineBuilder />} />
    <Route path="factory" element={<VideoFactoryDashboard />} />
    <Route path="settings" element={<PipelineSettings />} />
  </>
);
