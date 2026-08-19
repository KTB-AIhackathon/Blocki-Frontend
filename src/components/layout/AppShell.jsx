// 현재 URL에 맞는 Blocki 문서 작업·설정 화면을 조합한다.
import Sidebar from "./Sidebar";
import DashboardPage from "../dashboard/DashboardPage";
import DocumentWorkspace from "../documents/DocumentWorkspace";
import IntegrationSettings from "../settings/IntegrationSettings";
import { ROUTES, useAppPathname } from "../../routing/appRouter";

export default function AppShell() {
  const pathname = useAppPathname();

  const page = pathname === ROUTES.SETTINGS
    ? <IntegrationSettings />
    : pathname === ROUTES.DOCUMENTS
      ? <DocumentWorkspace />
      : <DashboardPage />;

  return (
    <div className="blocki-shell">
      <Sidebar />
      <main className="blocki-main">
        <div className="view-transition" key={pathname}>{page}</div>
      </main>
    </div>
  );
}
