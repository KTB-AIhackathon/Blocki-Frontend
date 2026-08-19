// 인증 상태와 현재 URL에 따라 공개·인증 화면을 표시한다.
import { useEffect } from "react";
import AuthPage from "./components/auth/AuthPage";
import AppShell from "./components/layout/AppShell";
import Toast from "./components/common/Toast";
import { AuthProvider, useAuth } from "./state/AuthContext";
import { DocumentProvider, useDocumentWorkspace } from "./state/DocumentContext";
import { isPrivateRoute, isPublicRoute, navigateTo, ROUTES, useAppPathname } from "./routing/appRouter";

function AppContent() {
  const { clearToast: clearAuthToast, status, toast: authToast } = useAuth();
  const { clearToast: clearDocumentToast, toast: documentToast } = useDocumentWorkspace();
  const pathname = useAppPathname();
  const toast = authToast ?? documentToast;

  useEffect(() => {
    if (status === "AUTHENTICATED" && !isPrivateRoute(pathname)) {
      navigateTo(ROUTES.WORKSPACE, { replace: true });
    }
    if (status === "GUEST" && !isPublicRoute(pathname)) {
      navigateTo(ROUTES.LOGIN, { replace: true });
    }
  }, [pathname, status]);

  if (status === "BOOTING") {
    return <main className="app-loading" aria-label="Blocki 불러오는 중">Blocki를 준비하고 있어요.</main>;
  }

  return (
    <>
      {status === "AUTHENTICATED"
        ? <AppShell />
        : <AuthPage view={pathname === ROUTES.SIGNUP ? "SIGNUP" : "LOGIN"} />}
      <Toast
        message={toast}
        onClose={authToast ? clearAuthToast : clearDocumentToast}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DocumentProvider>
        <AppContent />
      </DocumentProvider>
    </AuthProvider>
  );
}
