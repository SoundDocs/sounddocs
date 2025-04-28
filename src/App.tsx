import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import SignUp from './components/auth/SignUp';
import SignIn from './components/auth/SignIn';
import Dashboard from './components/Dashboard';
import PatchSheetEditor from './pages/PatchSheetEditor';
import AllPatchSheets from './pages/AllPatchSheets';
import StagePlotEditor from './pages/StagePlotEditor';
import AllStagePlots from './pages/AllStagePlots';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SharedPatchSheet from './pages/SharedPatchSheet';
import SharedStagePlot from './pages/SharedStagePlot';

function App() {
  useEffect(() => {
    // Update title
    document.title = 'SoundDocs | Patch Lists & Stage Plots for Audio Engineers';
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<SignIn />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patch-sheet/:id" 
              element={
                <ProtectedRoute>
                  <PatchSheetEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/all-patch-sheets" 
              element={
                <ProtectedRoute>
                  <AllPatchSheets />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/stage-plot/:id" 
              element={
                <ProtectedRoute>
                  <StagePlotEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/all-stage-plots" 
              element={
                <ProtectedRoute>
                  <AllStagePlots />
                </ProtectedRoute>
              } 
            />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            
            {/* Shared resource routes - more specific routes must come first */}
            <Route path="/shared/stage-plot/edit/:shareCode" element={<StagePlotEditor />} />
            <Route path="/shared/stage-plot/:shareCode" element={<SharedStagePlot />} />
            <Route path="/shared/edit/:shareCode" element={<PatchSheetEditor />} />
            <Route path="/shared/:shareCode" element={<SharedPatchSheet />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;