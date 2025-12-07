// =====================================
// FLUX - Main Application Router
// Last Updated: 21:11:22 Dec 06, 2025
// =====================================
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { FluxSetupWizard } from './components/FluxSetupWizard';

// Pages
import SplashPage from './pages/pages/SplashPage';
import HeroPage from './pages/pages/HeroPage';
import DashboardPage from './pages/pages/DashboardPage';
import BoardPage from './pages/pages/BoardPage';
import AnalyticsPage from './pages/pages/AnalyticsPage';
import ImportPage from './pages/pages/ImportPage';
import ITSMPage from './pages/pages/ITSMPage';
import WorkflowPage from './pages/pages/WorkflowPage';
import SprintPage from './pages/pages/SprintPage';
import InboxPage from './pages/pages/InboxPage';
import AssetsPage from './pages/pages/AssetsPage';
import IntegrationsPage from './pages/pages/IntegrationsPage';
import DocumentsPage from './pages/pages/DocumentsPage';
import DesignSystemPage from './pages/pages/DesignSystemPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Splash and Login */}
        <Route path="/" element={<SplashPage />} />
        <Route path="/login" element={<HeroPage />} />

        {/* Protected App Routes */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          
          {/* Core Project Management */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="board" element={<BoardPage />} />
          <Route path="sprints" element={<SprintPage />} />
          
          {/* ITSM & Service Desk */}
          <Route path="service-desk" element={<ITSMPage />} />
          
          {/* Automation & Config */}
          <Route path="automation" element={<WorkflowPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          
          {/* Data & Assets */}
          <Route path="assets" element={<AssetsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="design" element={<DesignSystemPage />} />
        </Route>

        {/* Setup Wizard */}
        <Route path="/setup" element={
            <FluxSetupWizard onComplete={(config: any) => console.log("Setup Config:", config)} />
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
// 21:11:22 Dec 06, 2025
