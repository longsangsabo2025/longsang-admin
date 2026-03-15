import { lazy } from 'react';
import { Route } from 'react-router-dom';

const InvestmentPortalLayout = lazy(() => import('../pages/investment/InvestmentPortalLayout'));
const InvestmentOverview = lazy(() => import('../pages/investment/InvestmentOverview'));
const InvestmentRoadmap = lazy(() => import('../pages/investment/InvestmentRoadmap'));
const InvestmentFinancials = lazy(() => import('../pages/investment/InvestmentFinancials'));
const InvestmentApply = lazy(() => import('../pages/investment/InvestmentApply'));

export const investmentRoutes = (
  <Route path="/project-showcase/:slug/investment" element={<InvestmentPortalLayout />}>
    <Route index element={<InvestmentOverview />} />
    <Route path="roadmap" element={<InvestmentRoadmap />} />
    <Route path="financials" element={<InvestmentFinancials />} />
    <Route path="apply" element={<InvestmentApply />} />
  </Route>
);
