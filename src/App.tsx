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
    import SharedShowModePage from "./pages/SharedShowModePage";
    import PrivacyPolicy from "./pages/PrivacyPolicy";
    import TermsOfService from "./pages/TermsOfService";
    import SharedPatchSheet from "./pages/SharedPatchSheet";
    import SharedStagePlot from "./pages/SharedStagePlot";
    import SharedProductionSchedule from "./pages/SharedProductionSchedule";
    import ProfilePage from "./pages/ProfilePage";
    import UpdatePasswordPage from "./pages/UpdatePasswordPage";
    import SharedWithMePage from "./pages/SharedWithMePage";
    import Resources from "./pages/Resources";
    import RatesPage from "./pages/RatesPage";
    import AudioFormulasPage from "./pages/AudioFormulasPage"; // This is now the category hub
    import AudioCategoryPage from "./pages/AudioCategoryPage"; // Dedicated Audio formulas
    import VideoCategoryPage from "./pages/VideoCategoryPage"; // Dedicated Video formulas
    import LightingCategoryPage from "./pages/LightingCategoryPage"; // Dedicated Lighting formulas


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
                
                {/* Resources Routes */}
                <Route path="/resources" element={<Resources />} />
                <Route path="/resources/rates" element={<RatesPage />} />
                <Route path="/resources/audio-formulas" element={<AudioFormulasPage />} /> {/* Hub Page */}
                <Route path="/resources/formulas/audio" element={<AudioCategoryPage />} /> {/* Specific Audio Formulas */}
                <Route path="/resources/formulas/video" element={<VideoCategoryPage />} /> {/* Specific Video Formulas */}
                <Route path="/resources/formulas/lighting" element={<LightingCategoryPage />} /> {/* Specific Lighting Formulas */}


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
                  path="/shared-with-me"
                  element={
                    <ProtectedRoute>
                      <SharedWithMePage />
                    </ProtectedRoute>
                  }
                />
                {/* Patch Sheet Routes */}
                <Route
                  path="/patch-sheet/:id"
                  element={
                    <ProtectedRoute>
                      <PatchSheetEditor />
                    </ProtectedRoute>
                  }
                />
                <Route path="/shared/edit/:shareCode" element={<PatchSheetEditor />} />
                <Route path="/shared/:shareCode" element={<SharedPatchSheet />} />
                <Route
                  path="/all-patch-sheets"
                  element={
                    <ProtectedRoute>
                      <AllPatchSheets />
                    </ProtectedRoute>
                  }
                />
                {/* Stage Plot Routes */}
                <Route
                  path="/stage-plot/:id"
                  element={
                    <ProtectedRoute>
                      <StagePlotEditor />
                    </ProtectedRoute>
                  }
                />
                <Route path="/shared/stage-plot/edit/:shareCode" element={<StagePlotEditor />} />
                <Route path="/shared/stage-plot/:shareCode" element={<SharedStagePlot />} />
                <Route
                  path="/all-stage-plots"
                  element={
                    <ProtectedRoute>
                      <AllStagePlots />
                    </ProtectedRoute>
                  }
                />
                {/* Production Schedule Routes */}
                <Route
                  path="/production-schedule/:id"
                  element={
                    <ProtectedRoute>
                      <ProductionScheduleEditor />
                    </ProtectedRoute>
                  }
                />
                <Route path="/shared/production-schedule/edit/:shareCode" element={<ProductionScheduleEditor />} />
                <Route path="/shared/production-schedule/:shareCode" element={<SharedProductionSchedule />} />
                <Route
                  path="/all-production-schedules"
                  element={
                    <ProtectedRoute>
                      <AllProductionSchedules />
                    </ProtectedRoute>
                  }
                />
                {/* Run of Show Routes */}
                <Route
                  path="/run-of-show/:id"
                  element={
                    <ProtectedRoute>
                      <RunOfShowEditor />
                    </ProtectedRoute>
                  }
                />
                <Route path="/shared/run-of-show/edit/:shareCode" element={<RunOfShowEditor />} />
                <Route path="/shared/run-of-show/:shareCode" element={<SharedShowModePage />} />
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

                {/* Static Pages */}
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />

              </Routes>
            </Router>
          </AuthProvider>
        </div>
      );
    }

    export default App;
