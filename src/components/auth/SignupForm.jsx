// 이름·이메일·비밀번호 회원가입 입력을 처리한다.
import { useState } from "react";
import { useAuth } from "../../state/AuthContext";

function validateSignup(form) {
  const errors = {};
  if (!/^.*(?=.{8,72}$).*$/.test(form.password)) {
    errors.password = "비밀번호는 8~72자여야 해요.";
  }
  if (!form.name.trim() || form.name.trim().length > 50) {
    errors.name = "이름은 1~50자로 입력해주세요.";
  }
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim()) || form.email.trim().length > 254) {
    errors.email = "이메일 주소를 확인해주세요.";
  }
  if (form.password !== form.passwordConfirmation) {
    errors.passwordConfirmation = "비밀번호가 일치하지 않습니다.";
  }
  return errors;
}

export default function SignupForm() {
  const { error, status, signup, openLogin } = useAuth();
  const [form, setForm] = useState({ password: "", passwordConfirmation: "", name: "", email: "" });
  const [errors, setErrors] = useState({});

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateSignup(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
    } catch (submitError) {
      setErrors(submitError.fieldErrors ?? {});
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="signup-email">이메일</label>
      <input
        id="signup-email"
        type="email"
        value={form.email}
        onChange={updateField("email")}
        autoComplete="email"
        aria-invalid={Boolean(errors.email)}
      />
      {errors.email ? <p className="field-error">{errors.email}</p> : null}

      <label htmlFor="signup-name">이름</label>
      <input
        id="signup-name"
        type="text"
        value={form.name}
        onChange={updateField("name")}
        autoComplete="name"
        aria-invalid={Boolean(errors.name)}
      />
      {errors.name ? <p className="field-error">{errors.name}</p> : null}

      <label htmlFor="signup-password">비밀번호</label>
      <input
        id="signup-password"
        type="password"
        value={form.password}
        onChange={updateField("password")}
        autoComplete="new-password"
        aria-invalid={Boolean(errors.password)}
      />
      {errors.password ? <p className="field-error">{errors.password}</p> : null}

      <label htmlFor="signup-password-confirmation">비밀번호 확인</label>
      <input
        id="signup-password-confirmation"
        type="password"
        value={form.passwordConfirmation}
        onChange={updateField("passwordConfirmation")}
        autoComplete="new-password"
        aria-invalid={Boolean(errors.passwordConfirmation)}
      />
      {errors.passwordConfirmation ? <p className="field-error">{errors.passwordConfirmation}</p> : null}
      {error?.message && !Object.keys(errors).length ? <p className="field-error">{error.message}</p> : null}

      <button className="button button-primary" type="submit" disabled={status === "SUBMITTING"}>
        {status === "SUBMITTING" ? "가입 중…" : "Blocki 시작하기"}
      </button>
      <p className="auth-switch">
        이미 계정이 있나요?{" "}
        <button type="button" onClick={openLogin}>
          로그인
        </button>
      </p>
    </form>
  );
}
