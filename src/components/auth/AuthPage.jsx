// 비로그인 사용자가 Blocki에 진입하는 전체 화면 로그인·회원가입 페이지다.
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { useAuth } from "../../state/AuthContext";
import Icon from "../common/Icon";

export default function AuthPage({ view = null }) {
  const { modalView } = useAuth();
  const isSignup = (view ?? modalView) === "SIGNUP";

  return (
    <main className="auth-page">
      <section className="auth-page-card" aria-labelledby="auth-page-title">
        <div className="auth-page-intro">
          <div className="auth-page-brand"><Icon name="sparkles" size={24} /></div>
          <p className="auth-page-kicker">PERSONAL WORK ARCHIVE</p>
          <h1>작업이 곧<br />나를 설명하도록.</h1>
          <p>Notion과 GitHub에 흩어진 기록을 포트폴리오와 이력서로 정리해요.</p>
          <div className="auth-page-note">
            <Icon name="arrow-up-right" size={18} />
            <span>연결된 서비스가 문서의 수집 범위를 결정해요.</span>
          </div>
        </div>
        <div className="auth-page-form-panel">
          <p className="auth-page-kicker">BLOCKI</p>
          <h2 id="auth-page-title">{isSignup ? "Blocki 회원가입" : "Blocki 로그인"}</h2>
          <p className="auth-page-description">
            {isSignup ? "나만의 작업 문서 공간을 시작해보세요." : "다시 만나서 반가워요. 작업 아카이브를 이어가세요."}
          </p>
          {isSignup ? <SignupForm /> : <LoginForm />}
        </div>
      </section>
    </main>
  );
}
