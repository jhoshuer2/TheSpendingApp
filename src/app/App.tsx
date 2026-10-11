import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../lib/auth";
import { ProfileProvider } from "../profile/store";
import { Auth, ForgotPassword, ResetPassword } from "../screens/Auth";
import { Journey } from "../screens/Journey";
import { Library } from "../screens/Library";
import { ModuleDetail } from "../screens/ModuleDetail";
import { Building, Onboarding, Summary } from "../screens/Onboarding";
import { Profile } from "../screens/Profile";
import { Gate, NotFound, Shell } from "../screens/Shell";
import { Splash } from "../screens/Splash";
import { Today } from "../screens/Today";
import { Welcome } from "../screens/Welcome";

export function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <BrowserRouter>
          <div className="app">
            <Routes>
              <Route path="/" element={<Splash />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/signup" element={<Auth key="signup" mode="signup" />} />
              <Route path="/login" element={<Auth key="login" mode="login" />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/onboarding"
                element={
                  <Gate onboarded={false}>
                    <Onboarding />
                  </Gate>
                }
              />
              <Route
                path="/onboarding/building"
                element={
                  <Gate onboarded={false}>
                    <Building />
                  </Gate>
                }
              />
              <Route
                path="/onboarding/summary"
                element={
                  <Gate onboarded={false}>
                    <Summary />
                  </Gate>
                }
              />
              <Route
                path="/module/:id"
                element={
                  <Gate>
                    <ModuleDetail />
                  </Gate>
                }
              />
              <Route path="/app" element={<Shell />}>
                <Route index element={<Navigate to="today" replace />} />
                <Route path="today" element={<Today />} />
                <Route path="library" element={<Library />} />
                <Route path="journey" element={<Journey />} />
                <Route path="profile" element={<Profile />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </ProfileProvider>
    </AuthProvider>
  );
}
