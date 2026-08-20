// 내 작업·설정·로그아웃을 담당하는 왼쪽 탐색 패널을 표시한다.
import { useAuth } from "../../state/AuthContext";
import { navigateTo, ROUTES, useAppPathname } from "../../routing/appRouter";
import Icon from "../common/Icon";

export default function Sidebar() {
  const pathname = useAppPathname();
  const { user, logout } = useAuth();

  return (
    <aside className="blocki-sidebar" aria-label="Blocki 탐색">
      <div className="sidebar-brand">
        <div className="brand-mark"><Icon name="sparkles" size={20} /></div>
        <div>
          <strong>Blocki</strong>
          <span>WORK ARCHIVE</span>
        </div>
      </div>
      <nav className="blocki-nav" aria-label="주요 메뉴">
        <button className={pathname === ROUTES.WORKSPACE || pathname === ROUTES.DOCUMENTS ? "is-active" : ""} type="button" onClick={() => navigateTo(ROUTES.WORKSPACE)}>
          <Icon name="home" size={18} /> 내 작업
        </button>
        <button className={pathname === ROUTES.SETTINGS ? "is-active" : ""} type="button" onClick={() => navigateTo(ROUTES.SETTINGS)}>
          <Icon name="settings" size={18} /> 설정
        </button>
      </nav>
      <div className="sidebar-account">
        <div className="account-avatar" aria-hidden="true">{user?.name?.[0]?.toUpperCase() ?? "B"}</div>
        <div className="account-copy">
          <strong>{user?.name ?? "Blocki 사용자"}</strong>
          <span>{user?.email ?? ""}</span>
        </div>
        <button className="logout-button" type="button" onClick={logout} aria-label="로그아웃">
          <Icon name="log-out" size={16} /> 로그아웃
        </button>
      </div>
    </aside>
  );
}
