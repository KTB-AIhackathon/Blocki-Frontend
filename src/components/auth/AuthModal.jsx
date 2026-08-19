// A 스타일의 로그인·회원가입 모달과 두 인증 화면의 연결을 제공한다.
import Modal from "../common/Modal";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { useAuth } from "../../state/AuthContext";

export default function AuthModal() {
  const { modalView, closeAuth } = useAuth();
  if (!modalView) {
    return null;
  }

  const isLogin = modalView === "LOGIN";
  const title = isLogin ? "Blocki 로그인" : "Blocki 회원가입";

  return (
    <Modal title={title} onClose={closeAuth} className="auth-modal">
      <header className="auth-modal-header">
        <div className="brand-mark" aria-hidden="true">✦</div>
        <div>
          <strong>Blocki</strong>
          <span> AUTOMATION AGENT</span>
        </div>
        <button type="button" className="modal-close" onClick={closeAuth} aria-label="닫기">
          ×
        </button>
        <p className="auth-eyebrow">{isLogin ? "다시 만나서 반가워요" : "일정을 자동화해보세요"}</p>
        <h2>{title}</h2>
        <p>{isLogin ? "로그인하면 캘린더와 자동화 블록이 바로 이어집니다." : "간단한 계정으로 나만의 자동화 워크스페이스를 시작합니다."}</p>
      </header>
      <div className="auth-modal-body">{isLogin ? <LoginForm /> : <SignupForm />}</div>
    </Modal>
  );
}
