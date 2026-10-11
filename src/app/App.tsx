import { useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthContext, readSession, writeSession, type AuthContextValue, type Session } from "../lib/auth";
import { ProfileProvider } from "../profile/store";
import { Auth } from "../screens/Auth";
import { Journey } from "../screens/Journey";
import { Library } from "../screens/Library";
import { ModuleDetail } from "../screens/ModuleDetail";
import { Building, Onboarding, Summary } from "../screens/Onboarding";
import { Profile } from "../screens/Profile";
import { NotFound, RequireReady, Shell } from "../screens/Shell";
import { Splash } from "../screens/Splash";
import { Today } from "../screens/Today";
import { Welcome } from "../screens/Welcome";

export function App() {
  const [session, setSession] = useState<Session | null>(readSession);

  const auth = useMemo<AuthContextValue>(
    () => ({
      session,
      signIn: (s) => {
        writeSession(s);
        setSession(s);
      },
      signOut: () => {
        writeSession(null);
        setSession(null);
      },
    }),
    [session],
  );

  const signedIn = (el: JSX.Element) => (session ? el : <Navigate to="/welcome" replace />);

  return (
    <AuthContext.Provider value={auth}>
      <ProfileProvider>
        <BrowserRouter>
          <div className="app">
            <Routes>
              <Route path="/" element={<Splash />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/signup" element={<Auth mode="signup" />} />
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/onboarding" element={signedIn(<Onboarding />)} />
              <Route path="/onboarding/building" element={signedIn(<Building />)} />
              <Route path="/onboarding/summary" element={signedIn(<Summary />)} />
              <Route
                path="/module/:id"
                element={
                  <RequireReady>
                    <ModuleDetail />
                  </RequireReady>
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
    </AuthContext.Provider>
  );
}
