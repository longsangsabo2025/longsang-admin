import { lazy } from 'react';
import { Route } from 'react-router-dom';

const ManagerDashboard = lazy(() => import('../pages/manager/ManagerDashboard'));
const ManagerProjects = lazy(() => import('../pages/manager/ManagerProjects'));
const ManagerLibrary = lazy(() => import('../pages/manager/ManagerLibrary'));
const ProjectCommandCenter = lazy(() => import('../pages/projects/ProjectCommandCenter'));
const ImageGenerator = lazy(() => import('../pages/video/ImageGenerator'));
const VideoGenerator = lazy(() => import('../pages/video/VideoGenerator'));
const GeminiChatPage = lazy(() => import('../pages/ai/GeminiChatPage'));

export const managerRoutes = (
  <>
    <Route index element={<ManagerDashboard />} />
    <Route path="projects" element={<ManagerProjects />} />
    <Route path="library" element={<ManagerLibrary />} />
    <Route path="project/:slug" element={<ProjectCommandCenter />} />
    {/* AI Tools for Manager */}
    <Route path="image-generator" element={<ImageGenerator />} />
    <Route path="video-generator" element={<VideoGenerator />} />
    <Route path="gemini-chat" element={<GeminiChatPage />} />
  </>
);
