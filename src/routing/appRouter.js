// 브라우저 History API로 Blocki의 공개·인증 경로를 동기화한다.
import { useEffect, useState } from "react";

export const ROUTES = Object.freeze({
  LOGIN: "/login",
  SIGNUP: "/signup",
  OAUTH_CALLBACK: "/oauth/callback",
  WORKSPACE: "/workspace",
  DOCUMENTS: "/documents",
  SETTINGS: "/settings",
});

const NAVIGATION_EVENT = "blocki:navigate";

export function navigateTo(pathname, { replace = false } = {}) {
  if (window.location.pathname === pathname) {
    return;
  }

  window.history[replace ? "replaceState" : "pushState"]({}, "", pathname);
  window.dispatchEvent(new Event(NAVIGATION_EVENT));
}

export function useAppPathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const syncPathname = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", syncPathname);
    window.addEventListener(NAVIGATION_EVENT, syncPathname);

    return () => {
      window.removeEventListener("popstate", syncPathname);
      window.removeEventListener(NAVIGATION_EVENT, syncPathname);
    };
  }, []);

  return pathname;
}

export function isPublicRoute(pathname) {
  return pathname === ROUTES.LOGIN || pathname === ROUTES.SIGNUP || pathname === ROUTES.OAUTH_CALLBACK;
}

export function isPrivateRoute(pathname) {
  return pathname === ROUTES.WORKSPACE || pathname === ROUTES.DOCUMENTS || pathname === ROUTES.SETTINGS;
}
