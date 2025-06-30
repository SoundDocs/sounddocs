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
    import AudioFormulasPage from "./pages/AudioFormulasPage"; 
    import AudioCategoryPage from "./pages/AudioCategoryPage"; 
    import VideoCategoryPage from "./pages/VideoCategoryPage"; 
    import LightingCategoryPage from "./pages/LightingCategoryPage"; 
    import ReferenceGuidesPage from "./pages/ReferenceGuidesPage";
    import CommonPinoutsPage from "./pages/guides/CommonPinoutsPage";
    import FrequencyBandsPage from "./pages/guides/FrequencyBandsPage";
    import DecibelChartPage from "./pages/guides/DecibelChartPage";
    import GlossariesPage from "./pages/guides/GlossariesPage";
    import NotFoundPage from "./pages/NotFoundPage"; // Import the 404 page

    // New Category Pages
    import AudioPage from "./pages/AudioPage";
    import VideoPage from "./pages/VideoPage";
    import LightingPage from "./pages/LightingPage";
    import ProductionPage from "./pages/ProductionPage";
    import CorporateMicPlotEditor from "./pages/CorporateMicPlotEditor";
    import TheaterMicPlotEditor from "./pages/TheaterMicPlotEditor";
    import AllMicPlots from "./pages/AllMicPlots";
    import AllCorporateMicPlots from "./pages/AllCorporateMicPlots";
    import AllTheaterMicPlots from "./pages/AllTheaterMicPlots"; 
    import SharedCorporateMicPlot from "./pages/SharedCorporateMicPlot"; 
    import SharedTheaterMicPlot from "./pages/SharedTheaterMicPlot"; // New Shared Theater Mic Plot Page


    function App() {
      useEffect(() => {
        // Update title
        document.title = "SoundDocs | Event Production Docs, Tools & Resources";
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
                <Route path="/resources/audio-formulas" element={<AudioFormulasPage />} />
                <Route path="/resources/formulas/audio" element={<AudioCategoryPage />} /> 
                <Route path="/resources/formulas/video" element={<VideoCategoryPage />} /> 
                <Route path="/resources/formulas/lighting" element={<LightingCategoryPage />} /> 
                <Route path="/resources/reference-guides" element={<ReferenceGuidesPage />} />
                <Route path="/resources/guides/pinouts" element={<CommonPinoutsPage />} />
                <Route path="/resources/guides/frequency-bands" element={<FrequencyBandsPage />} />
                <Route path="/resources/guides/db-chart" element={<DecibelChartPage />} />
                <Route path="/resources/guides/glossaries" element={<GlossariesPage />} />


                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                {/* New Category Page Routes */}
                <Route
                  path="/audio"
                  element={
                    <ProtectedRoute>
                      <AudioPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/video"
                  element={
                    <ProtectedRoute>
                      <VideoPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lighting"
                  element={
                    <ProtectedRoute>
                      <LightingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/production"
                  element={
                    <ProtectedRoute>
                      <ProductionPage />
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

                {/* Corporate Mic Plot Editor Routes */}
                <Route
                  path="/corporate-mic-plot/:id" 
                  element={
                    <ProtectedRoute>
                      <CorporateMicPlotEditor />
                    </ProtectedRoute>
                  }
                />
                <Route path="/shared/corporate-mic-plot/edit/:shareCode" element={<CorporateMicPlotEditor />} />
                <Route path="/shared/corporate-mic-plot/:shareCode" element={<SharedCorporateMicPlot />} />

                {/* Theater Mic Plot Editor Routes */}
                <Route
                  path="/theater-mic-plot/:id"
                  element={
                    <ProtectedRoute>
                      <TheaterMicPlotEditor />
                    </ProtectedRoute>
                  }
                />
                {/* Shared Theater Mic Plot Routes - NEW */}
                <Route path="/shared/theater-mic-plot/edit/:shareCode" element={<TheaterMicPlotEditor />} />
                <Route path="/shared/theater-mic-plot/:shareCode" element={<SharedTheaterMicPlot />} />


                {/* All Mic Plots Page Route */}
                <Route
                  path="/all-mic-plots"
                  element={
                    <ProtectedRoute>
                      <AllMicPlots />
                    </ProtectedRoute>
                  }
                />
                {/* All Corporate Mic Plots Page Route */}
                <Route
                  path="/all-corporate-mic-plots"
                  element={
                    <ProtectedRoute>
                      <AllCorporateMicPlots />
                    </ProtectedRoute>
                  }
                />
                {/* All Theater Mic Plots Page Route */}
                <Route
                  path="/all-theater-mic-plots"
                  element={
                    <ProtectedRoute>
                      <AllTheaterMicPlots />
                    </ProtectedRoute>
                  }
                />

                {/* Static Pages */}
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />

                {/* Catch-all 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Router>
          </AuthProvider>
        </div>
      );
    }

    export default App;
