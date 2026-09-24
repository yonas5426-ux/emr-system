import { useState } from "react";
import { supabase } from "./supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email address and password.");
      return;
    }

    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <style>{globalLoginStyles}</style>
      <div style={styles.glowLeft} />
      <div style={styles.glowRight} />

      <div style={styles.shell}>
        <section style={styles.infoPanel}>
          <div>
            <div style={styles.logo}>🏥</div>
            <div style={styles.eyebrow}>PAPERLESS HEALTHCARE</div>
            <h1 style={styles.brandTitle}>Hospital EMR</h1>
            <p style={styles.brandText}>
              A modern electronic medical record system for patient
              registration, triage, clinical care, laboratory, pharmacy,
              billing and reporting.
            </p>
          </div>

          <div style={styles.features}>
            <Feature icon="🧾" title="Registration & Triage" text="Fast patient intake and triage workflow." />
            <Feature icon="📋" title="Patient History" text="Keep clinical records and documents together." />
            <Feature icon="📊" title="Reports & Tracking" text="Follow patient flow and hospital activities." />
          </div>
        </section>

        <section style={styles.loginPanel}>
          <div style={styles.header}>
            <div style={styles.badge}>SECURE LOGIN</div>
            <h2 style={styles.title}>Welcome back</h2>
            <p style={styles.subtitle}>
              Sign in to access the Hospital EMR system.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label htmlFor="email" style={styles.label}>
                Email Address
              </label>
              <div style={styles.inputBox}>
                <span style={styles.icon}>✉️</span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="password" style={styles.label}>
                Password
              </label>
              <div style={styles.inputBox}>
                <span style={styles.icon}>🔒</span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={styles.showButton}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div style={styles.options}>
              <label style={styles.remember}>
                <input type="checkbox" style={styles.checkbox} />
                <span>Remember me</span>
              </label>
              <span style={styles.secure}>🔐 Secure access</span>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button type="submit" disabled={loading} style={styles.loginButton}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={styles.footer}>
            <strong>Hospital EMR System</strong>
            <span>•</span>
            <span>Authorized users only</span>
          </div>
        </section>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div style={styles.feature}>
      <div style={styles.featureIcon}>{icon}</div>
      <div>
        <div style={styles.featureTitle}>{title}</div>
        <div style={styles.featureText}>{text}</div>
      </div>
    </div>
  );
}

const globalLoginStyles = `
  html, body, #root {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    min-width: 100% !important;
    min-height: 100% !important;
    font-family: "Times New Roman", Times, serif !important;
  }

  *, *::before, *::after {
    box-sizing: border-box !important;
    font-family: "Times New Roman", Times, serif !important;
  }

  body {
    font-size: 18px !important;
    line-height: 1.45 !important;
  }

  h1 { font-size: 34px !important; line-height: 1.2 !important; }
  h2 { font-size: 28px !important; line-height: 1.25 !important; }
  h3 { font-size: 22px !important; line-height: 1.3 !important; }
  h4 { font-size: 20px !important; line-height: 1.3 !important; }

  p, span, label, div, button, input, select, textarea, th, td, small {
    font-family: "Times New Roman", Times, serif !important;
  }

  button, input, select, textarea {
    font-size: 18px !important;
  }

  button {
    font-weight: 700 !important;
  }
`;

const styles = {
  page: {
    minHeight: "100vh",
    width: "100vw",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "28px",
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(135deg, #eef6ff 0%, #f8fbff 48%, #eefbf6 100%)",
    fontFamily: "Times New Roman, Times, serif",
    color: "#172033",
  },
  glowLeft: {
    position: "absolute",
    width: "460px",
    height: "460px",
    left: "-170px",
    top: "-180px",
    borderRadius: "50%",
    background: "rgba(37, 99, 235, 0.10)",
    filter: "blur(12px)",
  },
  glowRight: {
    position: "absolute",
    width: "460px",
    height: "460px",
    right: "-180px",
    bottom: "-190px",
    borderRadius: "50%",
    background: "rgba(16, 185, 129, 0.10)",
    filter: "blur(12px)",
  },
  shell: {
    width: "100%",
    maxWidth: "1400px",
    minHeight: "820px",
    width: "100%",
    display: "grid",
    gridTemplateColumns: "1.08fr 0.92fr",
    borderRadius: "32px",
    overflow: "hidden",
    position: "relative",
    zIndex: 1,
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(148,163,184,0.25)",
    boxShadow: "0 30px 90px rgba(15,23,42,0.16)",
  },
  infoPanel: {
    padding: "82px 72px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "36px",
    background: "linear-gradient(160deg, #eff6ff 0%, #f8fbff 56%, #ecfdf5 100%)",
  },
  logo: {
    width: "84px",
    height: "84px",
    borderRadius: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    fontSize: "40px",
    boxShadow: "0 16px 30px rgba(37,99,235,0.14)",
    marginBottom: "30px",
  },
  eyebrow: {
    fontSize: "14px",
    fontWeight: 900,
    letterSpacing: "0.16em",
    color: "#475569",
    marginBottom: "12px",
  },
  brandTitle: {
    margin: 0,
    fontSize: "58px",
    lineHeight: 1.02,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
  brandText: {
    maxWidth: "650px",
    margin: "22px 0 0",
    fontSize: "19px",
    lineHeight: 1.75,
    fontWeight: 600,
    color: "#475569",
  },
  features: {
    display: "grid",
    gap: "14px",
  },
  feature: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    padding: "17px 19px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.86)",
    border: "1px solid rgba(148,163,184,0.20)",
    boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
  },
  featureIcon: {
    width: "38px",
    fontSize: "27px",
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: "16px",
    fontWeight: 900,
    marginBottom: "5px",
  },
  featureText: {
    fontSize: "14px",
    lineHeight: 1.5,
    fontWeight: 650,
    color: "#64748b",
  },
  loginPanel: {
    padding: "84px 72px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "#ffffff",
  },
  header: {
    marginBottom: "34px",
  },
  badge: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.10em",
  },
  title: {
    margin: "18px 0 10px",
    fontSize: "44px",
    lineHeight: 1.1,
    fontWeight: 900,
    letterSpacing: "-0.035em",
  },
  subtitle: {
    margin: 0,
    fontSize: "17px",
    lineHeight: 1.6,
    fontWeight: 600,
    color: "#64748b",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  label: {
    fontSize: "16px",
    fontWeight: 900,
    color: "#1e293b",
  },
  inputBox: {
    width: "100%",
    minHeight: "64px",
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
    border: "2px solid #dbe4ef",
    borderRadius: "16px",
    background: "#fbfdff",
  },
  icon: {
    width: "52px",
    flexShrink: 0,
    textAlign: "center",
    fontSize: "21px",
  },
  input: {
    width: "100%",
    minHeight: "60px",
    border: "none",
    outline: "none",
    background: "transparent",
    padding: "0 8px 0 0",
    fontSize: "18px",
    fontWeight: 650,
    color: "#0f172a",
    boxSizing: "border-box",
  },
  showButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },
  options: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    fontSize: "14px",
    fontWeight: 700,
    color: "#64748b",
  },
  remember: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  checkbox: {
    width: "18px",
    height: "18px",
  },
  secure: {
    whiteSpace: "nowrap",
  },
  error: {
    padding: "14px 16px",
    borderRadius: "14px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: "14px",
    lineHeight: 1.5,
    fontWeight: 750,
  },
  loginButton: {
    width: "100%",
    minHeight: "66px",
    border: "none",
    borderRadius: "16px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 16px 28px rgba(37,99,235,0.25)",
  },
  footer: {
    marginTop: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    flexWrap: "wrap",
    textAlign: "center",
    fontSize: "13px",
    fontWeight: 650,
    color: "#94a3b8",
  },
};
