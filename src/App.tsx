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
import ProductionScheduleEditor from "./pages/ProductionScheduleEditor"; 
import AllProductionSchedules from "./pages/AllProductionSchedules"; 
import RunOfShowEditor from "./pages/RunOfShowEditor";
import AllRunOfShows from "./pages/AllRunOfShows";
import ShowModePage from "./pages/ShowModePage";
import SharedShowModePage from "./pages/SharedShowModePage"; // Import SharedShowModePage
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SharedPatchSheet from "./pages/SharedPatchSheet";
import SharedStagePlot from "./pages/SharedStagePlot";
import SharedProductionSchedule from "./pages/SharedProductionSchedule";
import ProfilePage from "./pages/ProfilePage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";

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
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
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
            <Route path="/shared/stage-plot/edit/:shareCode" element={<StagePlotEditor />} />
            <Route
              path="/all-stage-plots"
              element={
                <ProtectedRoute>
                  <AllStagePlots />
                </ProtectedRoute>
              }
            />
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
            <Route
              path="/run-of-show/:id"
              element={
                <ProtectedRoute>
                  <RunOfShowEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/all-run-of-shows"
              element={
                <ProtectedRoute>
                  <AllRunOfShows />
                </ProtectedRoute>
              }
            />
            <Route
              path="/show-mode/:id" 
              element={
                <ProtectedRoute>
                  <ShowModePage />
                </ProtectedRoute>
              }
            />
            {/* New route for SharedShowModePage - NOT protected */}
            <Route path="/shared/run-of-show/:shareCode" element={<SharedShowModePage />} />

            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />

            <Route path="/shared/stage-plot/:shareCode" element={<SharedStagePlot />} />
            <Route path="/shared/production-schedule/:shareCode" element={<SharedProductionSchedule />} />
            <Route path="/shared/:shareCode" element={<SharedPatchSheet />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
