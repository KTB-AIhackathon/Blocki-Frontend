// React 앱을 DOM 루트와 전역 스타일에 연결한다.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/auth.css";
import "./styles/workspace.css";
import "./styles/calendar.css";
import "./styles/blocki.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
