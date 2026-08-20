// 인증 API와 reducer를 연결해 화면에서 사용할 인증 명령을 제공한다.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { AUTH_EXPIRED_EVENT } from "../api/apiClient";
import { getAppApi } from "../api/apiMode";
import { authReducer, createInitialAuthState } from "./authReducer";
import { navigateTo, ROUTES } from "../routing/appRouter";

const AuthContext = createContext(null);

function unwrapUser(result) {
  return result?.user ?? (result?.id ? result : null);
}

export function AuthProvider({
  api = getAppApi(),
  children,
  initialModalView = null,
  initialUser = null,
  skipBootstrap = false,
}) {
  const [state, dispatch] = useReducer(authReducer, createInitialAuthState(initialModalView, initialUser));

  useEffect(() => {
    if (skipBootstrap) {
      dispatch({ type: "BOOTSTRAP_SUCCESS", user: initialUser });
      return undefined;
    }

    let active = true;
    api.getCurrentUser()
      .then((result) => {
        if (active) {
          dispatch({ type: "BOOTSTRAP_SUCCESS", user: unwrapUser(result) });
        }
      })
      .catch(() => {
        if (active) {
          dispatch({ type: "BOOTSTRAP_SUCCESS", user: null });
        }
      });

    return () => {
      active = false;
    };
  }, [api, initialUser, skipBootstrap]);

  const openLogin = useCallback(() => {
    dispatch({ type: "OPEN_LOGIN" });
    navigateTo(ROUTES.LOGIN);
  }, []);
  const openSignup = useCallback(() => {
    dispatch({ type: "OPEN_SIGNUP" });
    navigateTo(ROUTES.SIGNUP);
  }, []);
  const closeAuth = useCallback(() => dispatch({ type: "CLOSE_MODAL" }), []);
  const clearToast = useCallback(() => dispatch({ type: "CLEAR_TOAST" }), []);

  const login = useCallback(
    async (payload) => {
      dispatch({ type: "SUBMITTING" });
      try {
        const result = await api.login(payload);
        dispatch({ type: "LOGIN_SUCCESS", user: unwrapUser(result) });
        navigateTo(ROUTES.WORKSPACE);
        return result;
      } catch (error) {
        dispatch({ type: "AUTH_ERROR", error });
        throw error;
      }
    },
    [api],
  );

  const signup = useCallback(
    async (payload) => {
      dispatch({ type: "SUBMITTING" });
      try {
        const result = await api.signup(payload);
        dispatch({ type: "SIGNUP_SUCCESS", email: payload.email });
        navigateTo(ROUTES.LOGIN);
        return result;
      } catch (error) {
        dispatch({ type: "AUTH_ERROR", error });
        throw error;
      }
    },
    [api],
  );

  const logout = useCallback(async () => {
    await api.logout();
    dispatch({ type: "LOGOUT" });
    navigateTo(ROUTES.LOGIN);
  }, [api]);

  useEffect(() => {
    const onExpired = () => {
      dispatch({ type: "LOGOUT" });
      navigateTo(ROUTES.LOGIN);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      isAuthenticated: state.status === "AUTHENTICATED",
      openLogin,
      openSignup,
      closeAuth,
      clearToast,
      login,
      signup,
      logout,
    }),
    [state, openLogin, openSignup, closeAuth, clearToast, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
