import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

type LoginPortal = "institution" | "student";

export function LoginPage({ portal }: { portal: LoginPortal }) {
  const { signIn, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isStudent = portal === "student";

  useEffect(() => {
    setCreating(false);
    setError("");
  }, [portal]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (creating) {
        await register(name, email, password);
        setCreating(false);
      }
      const user = await signIn(
        email,
        password,
        isStudent ? "STUDENT" : "ADMIN",
      );
      const destination =
        location.state?.from ||
        (user.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard");
      navigate(destination, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <aside className="login-aside">
        <Link to="/verify" className="brand login-brand">
          <span className="brand-mark">
            <BadgeCheck size={21} />
          </span>
          <span>
            <strong>CERTICHAIN</strong>
            <small>ACADEMIC RECORDS</small>
          </span>
        </Link>
        <div className="login-aside-copy">
          <span className="eyebrow light-eyebrow">TRUST, MADE VERIFIABLE</span>
          <h1>
            Achievement,
            <br />
            with proof.
          </h1>
          <p>
            Issue and verify academic credentials with a tamper-evident record
            on a local blockchain.
          </p>
        </div>
        <div className="login-proof-row">
          <span>
            <ShieldCheck size={16} />
            Hash secured
          </span>
          <span>
            <BookOpenCheck size={16} />
            Institution issued
          </span>
        </div>
        <div className="login-orbit orbit-one" />
        <div className="login-orbit orbit-two" />
      </aside>
      <main className="login-main">
        <div className="login-public-link">
          <Link to="/verify">
            Verify a certificate <ArrowRight size={15} />
          </Link>
        </div>
        <div className="login-form-wrap">
          <nav className="login-portals" aria-label="Choose sign-in portal">
            <Link
              to="/login/institution"
              className={portal === "institution" ? "login-portal-active" : ""}
              aria-current={portal === "institution" ? "page" : undefined}
            >
              Institution
            </Link>
            <Link
              to="/login/student"
              className={portal === "student" ? "login-portal-active" : ""}
              aria-current={portal === "student" ? "page" : undefined}
            >
              Student
            </Link>
          </nav>
          <div className="login-heading">
            <span className="eyebrow">
              {creating
                ? "STUDENT REGISTRATION"
                : isStudent
                  ? "STUDENT PORTAL"
                  : "INSTITUTION PORTAL"}
            </span>
            <h2>
              {creating
                ? "Create your account"
                : isStudent
                  ? "Student sign in"
                  : "Institution sign in"}
            </h2>
            <p>
              {creating
                ? "Student accounts can view certificates issued to them."
                : isStudent
                  ? "View certificates issued to your student account."
                  : "Sign in with your institution administrator account."}
            </p>
          </div>
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
          <form className="form-stack" onSubmit={submit}>
            {creating && (
              <label className="field">
                <span>Full name</span>
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  minLength={2}
                />
              </label>
            )}
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                autoComplete={creating ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={creating ? 8 : undefined}
              />
            </label>
            <button
              className="button button-primary button-wide"
              disabled={loading}
            >
              {loading
                ? "Please wait…"
                : creating
                  ? "Create student account"
                  : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>
          {isStudent && (
            <p className="auth-toggle">
              {creating ? "Already registered?" : "New student?"}{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setCreating(!creating);
                  setError("");
                }}
              >
                {creating ? "Sign in" : "Create an account"}
              </button>
            </p>
          )}
          <div className="login-footer">
            <span>LOCAL DEVELOPMENT</span>
            <span>HARDHAT NETWORK · 31337</span>
          </div>
        </div>
      </main>
    </div>
  );
}
