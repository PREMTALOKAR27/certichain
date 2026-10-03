import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { AppShell } from "./components/AppShell";
import { RequireAuth } from "./components/RequireAuth";
import { AboutBlockchainPage } from "./pages/AboutBlockchainPage";
import { BlockchainPage } from "./pages/BlockchainPage";
import { CertificatesPage } from "./pages/CertificatesPage";
import { CertificateDetailPage } from "./pages/CertificateDetailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { IssuePage } from "./pages/IssuePage";
import { LoginPage } from "./pages/LoginPage";
import { VerifyPage } from "./pages/VerifyPage";

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/verify" replace />;
  return (
    <Navigate
      to={user.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard"}
      replace
    />
  );
}

function LoginRedirect() {
  return <Navigate to="/login/institution" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginRedirect />} />
          <Route
            path="/login/institution"
            element={<LoginPage portal="institution" />}
          />
          <Route
            path="/login/student"
            element={<LoginPage portal="student" />}
          />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/verify/:certificateId" element={<VerifyPage />} />
          <Route
            path="/about-blockchain"
            element={<AboutBlockchainPage publicPage />}
          />
          <Route element={<RequireAuth role="ADMIN" />}>
            <Route element={<AppShell />}>
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route
                path="/admin/certificates"
                element={<CertificatesPage />}
              />
              <Route
                path="/admin/certificates/:certificateId"
                element={<CertificateDetailPage />}
              />
              <Route path="/admin/issue" element={<IssuePage />} />
              <Route path="/admin/blockchain" element={<BlockchainPage />} />
              <Route
                path="/admin"
                element={<Navigate to="/admin/dashboard" replace />}
              />
            </Route>
          </Route>
          <Route element={<RequireAuth role="STUDENT" />}>
            <Route element={<AppShell />}>
              <Route path="/student/dashboard" element={<DashboardPage />} />
              <Route
                path="/student/certificates"
                element={<CertificatesPage />}
              />
              <Route
                path="/student/certificates/:certificateId"
                element={<CertificateDetailPage />}
              />
              <Route
                path="/student"
                element={<Navigate to="/student/dashboard" replace />}
              />
            </Route>
          </Route>
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
