import { lazy } from 'react';
import { Route } from 'react-router-dom';

const MobileDashboard = lazy(() => import('../pages/mobile/MobileDashboard'));
const MobileGit = lazy(() => import('../pages/mobile/MobileGit'));
const MobileChat = lazy(() => import('../pages/mobile/MobileChat'));
const MobileDeploy = lazy(() => import('../pages/mobile/MobileDeploy'));
const MobileFiles = lazy(() => import('../pages/mobile/MobileFiles'));

export const mobileRoutes = (
  <>
    <Route path="/mobile" element={<MobileDashboard />} />
    <Route path="/mobile/git" element={<MobileGit />} />
    <Route path="/mobile/files" element={<MobileFiles />} />
    <Route path="/mobile/chat" element={<MobileChat />} />
    <Route path="/mobile/deploy" element={<MobileDeploy />} />
  </>
);
