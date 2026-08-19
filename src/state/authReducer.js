// 인증 상태와 로그인·회원가입 모달 전환을 순수 reducer로 관리한다.
export const initialAuthState = {
  status: "BOOTING",
  user: null,
  modalView: null,
  emailPrefill: "",
  error: null,
  toast: null,
};

export function createInitialAuthState(modalView = null, user = null) {
  return {
    ...initialAuthState,
    modalView,
    status: user ? "AUTHENTICATED" : initialAuthState.status,
    user,
  };
}

export function authReducer(state, action) {
  switch (action.type) {
    case "BOOTSTRAP_SUCCESS":
      return {
        ...state,
        status: action.user ? "AUTHENTICATED" : "GUEST",
        user: action.user ?? null,
        error: null,
      };
    case "OPEN_LOGIN":
      return { ...state, modalView: "LOGIN", error: null, toast: null };
    case "OPEN_SIGNUP":
      return { ...state, modalView: "SIGNUP", error: null, toast: null };
    case "CLOSE_MODAL":
      return { ...state, modalView: null, error: null };
    case "SUBMITTING":
      return { ...state, status: "SUBMITTING", error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        status: "AUTHENTICATED",
        user: action.user,
        modalView: null,
        error: null,
      };
    case "SIGNUP_SUCCESS":
      return {
        ...state,
        status: "GUEST",
        modalView: "LOGIN",
        emailPrefill: action.email,
        error: null,
        toast: "가입이 완료됐어요. 이제 로그인해주세요.",
      };
    case "AUTH_ERROR":
      return {
        ...state,
        status: state.user ? "AUTHENTICATED" : "GUEST",
        error: action.error,
      };
    case "LOGOUT":
      return { ...state, status: "GUEST", user: null, error: null };
    case "SET_TOAST":
      return { ...state, toast: action.message };
    case "CLEAR_TOAST":
      return { ...state, toast: null };
    default:
      return state;
  }
}
