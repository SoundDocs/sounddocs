import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Landing from "./pages/Landing";
import SignUp from "./components/auth/SignUp";
import SignIn from "./components/auth/SignIn";
import Dashboard from "./pages/Dashboard";
import PatchSheetEditor from "./pages/PatchSheetEditor";
import AllPatchSheets from "./pages/AllPatchSheets";
import StagePlotEditor from "./pages/StagePlotEditor";
import AllStagePlots from "./pages/AllStagePlots";
import ProductionScheduleEditor from "./pages/ProductionScheduleEditor"; // New
import AllProductionSchedules from "./pages/AllProductionSchedules"; // New
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SharedPatchSheet from "./pages/SharedPatchSheet";
import SharedStagePlot from "./pages/SharedStagePlot";

function App() {
  useEffect(() => {
    // Update title
    document.title = "SoundDocs | Patch Lists & Stage Plots for Audio Engineers";
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
            {/* Shared Edit Route for Patch Sheets (assuming /shared/edit/ is for patch sheets) */}
            <Route path="/shared/edit/:shareCode" element={<PatchSheetEditor />} />
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
            {/* Shared Edit Route for Stage Plots */}
            <Route path="/shared/stage-plot/edit/:shareCode" element={<StagePlotEditor />} />
            <Route
              path="/all-stage-plots"
              element={
                <ProtectedRoute>
                  <AllStagePlots />
                </ProtectedRoute>
              }
            />
            {/* Production Schedule Routes - NEW */}
            <Route
              path="/production-schedule/:id"
              element={
                <ProtectedRoute>
                  <ProductionScheduleEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/all-production-schedules"
              element={
                <ProtectedRoute>
                  <AllProductionSchedules />
                </ProtectedRoute>
              }
            />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />

            {/* Shared resource view routes - Specific routes MUST come BEFORE generic ones */}
            <Route path="/shared/stage-plot/:shareCode" element={<SharedStagePlot />} />
            {/* Generic shared route (should now only catch patch sheets if stage plot route didn't match) */}
            <Route path="/shared/:shareCode" element={<SharedPatchSheet />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
