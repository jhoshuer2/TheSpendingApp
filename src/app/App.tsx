import { useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthContext, readSession, writeSession, type AuthContextValue, type Session } from "../lib/auth";
import { Auth } from "../screens/Auth";
import { Onboarding } from "../screens/Onboarding";
import { Journey, Library, NotFound, Profile, Shell, Today } from "../screens/Shell";
import { Splash } from "../screens/Splash";
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

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/signup" element={<Auth mode="signup" />} />
            <Route path="/login" element={<Auth mode="login" />} />
            <Route path="/onboarding" element={session ? <Onboarding /> : <Navigate to="/welcome" replace />} />
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
    </AuthContext.Provider>
  );
}
