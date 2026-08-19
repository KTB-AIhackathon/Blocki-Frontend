// 이메일·비밀번호 로그인 입력과 회원가입 전환을 처리한다.
import { useState } from "react";
import { useAuth } from "../../state/AuthContext";

function validateLogin(form) {
  const errors = {};
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim()) || form.email.trim().length > 254) {
    errors.email = "이메일 주소를 확인해주세요.";
  }
  if (!form.password) {
    errors.password = "비밀번호를 입력해주세요.";
  }
  return errors;
}

export default function LoginForm() {
  const { error, status, login, openSignup } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateLogin(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      await login({ email: form.email.trim().toLowerCase(), password: form.password });
    } catch (submitError) {
      setErrors(submitError.fieldErrors ?? {});
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="login-email">이메일</label>
      <input
        id="login-email"
        type="email"
        value={form.email}
        onChange={updateField("email")}
        autoComplete="email"
        aria-invalid={Boolean(errors.email)}
      />
      {errors.email ? <p className="field-error">{errors.email}</p> : null}

      <label htmlFor="login-password">비밀번호</label>
      <input
        id="login-password"
        type="password"
        value={form.password}
        onChange={updateField("password")}
        autoComplete="current-password"
        aria-invalid={Boolean(errors.password)}
      />
      {errors.password ? <p className="field-error">{errors.password}</p> : null}
      {error?.message && !Object.keys(errors).length ? <p className="field-error">{error.message}</p> : null}

      <button className="button button-primary" type="submit" disabled={status === "SUBMITTING"}>
        {status === "SUBMITTING" ? "로그인 중…" : "로그인"}
      </button>
      <p className="auth-switch">
        아직 계정이 없나요?{" "}
        <button type="button" onClick={openSignup}>
          회원가입
        </button>
      </p>
    </form>
  );
}
