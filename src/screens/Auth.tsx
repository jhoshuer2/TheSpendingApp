import { useState, type FormEvent, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Aura } from "../design-system/Aura";
import { Button } from "../design-system/Button";
import { Field } from "../design-system/Field";
import { Icon } from "../design-system/Icon";
import { Orb } from "../design-system/Orb";
import { useAuth } from "../lib/auth";
import { validateEmail, validateName, validatePassword } from "../lib/validate";

type Mode = "signup" | "login";
type Errors = Partial<Record<"name" | "email" | "password", string>>;

const COPY = {
  signup: {
    title: "Create your account",
    lede: "It takes a minute. Then we'll ask a few questions about your business.",
    submit: "Create account",
    switchText: "Already have an account?",
    switchAction: "Log in",
    switchTo: "/login",
  },
  login: {
    title: "Welcome back",
    lede: "Log in to pick up where you left off.",
    submit: "Log in",
    switchText: "New here?",
    switchAction: "Create an account",
    switchTo: "/signup",
  },
} as const;

/** Header with a back button, a body and a footer: the frame all the account screens share. */
function Frame({ onSubmit, title, lede, children, footer }: { onSubmit?: (e: FormEvent) => void; title: string; lede?: string; children?: ReactNode; footer: ReactNode }) {
  const navigate = useNavigate();
  return (
    <form className="screen screen--account" onSubmit={onSubmit} noValidate>
      <Aura variant="soft" />
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={() => navigate(-1)}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>
      <main className="screen__body">
        <span className="account__mark enter" aria-hidden="true">
          <Orb size={44} />
        </span>
        <h1 className="title title--hero enter">{title}</h1>
        {lede && (
          <p className="lede enter" style={{ ["--i" as string]: 1 }}>
            {lede}
          </p>
        )}
        {children}
      </main>
      <footer className="screen__footer">{footer}</footer>
    </form>
  );
}

function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="field__toggle" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} onClick={onToggle}>
      <Icon name={show ? "eye-off" : "eye"} size={20} />
    </button>
  );
}

export function Auth({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const { session, signUp, signIn, mode: backendMode } = useAuth();
  const c = COPY[mode];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  // Signed in (including just now): the Gate sends new people on to onboarding.
  if (session) return <Navigate to="/app" replace />;

  const clear = (k: keyof Errors) => {
    setErrors((e) => ({ ...e, [k]: undefined }));
    setFormError(undefined);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const next: Errors = {
      name: mode === "signup" ? validateName(name) : undefined,
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(next);
    if (next.name || next.email || next.password) return;

    setBusy(true);
    setFormError(undefined);
    const cleanEmail = email.trim().toLowerCase();
    const r = mode === "signup" ? await signUp({ name: name.trim(), email: cleanEmail, password }) : await signIn({ email: cleanEmail, password });
    setBusy(false);
    if (!r.ok) return setFormError(r.message);
    if (r.needsConfirmation) setConfirmEmail(cleanEmail);
  };

  if (confirmEmail) {
    return (
      <Frame
        title="Check your email"
        lede={`We sent a link to ${confirmEmail}. Open it to finish creating your account, then log in.`}
        footer={
          <Button variant="ink" type="button" fullWidth onClick={() => navigate("/login", { replace: true })}>
            Go to log in
          </Button>
        }
      />
    );
  }

  return (
    <Frame
      onSubmit={submit}
      title={c.title}
      lede={c.lede}
      footer={
        <>
          <Button variant="ink" type="submit" fullWidth loading={busy}>
            {c.submit}
          </Button>
          <div className="auth-switch">
            <button type="button" className="link-btn" onClick={() => navigate(c.switchTo, { replace: true })}>
              {c.switchText} <strong>{c.switchAction}</strong>
            </button>
          </div>
        </>
      }
    >
      {backendMode === "local" && <p className="note">Demo mode: nothing is checked or sent anywhere, and your data stays on this device.</p>}
      <div className="form enter" style={{ ["--i" as string]: 2 }}>
        {mode === "signup" && (
          <Field
            label="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clear("name");
            }}
            error={errors.name}
            autoComplete="name"
            autoCapitalize="words"
          />
        )}
        <Field
          label="Email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clear("email");
          }}
          error={errors.email}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
        />
        <Field
          label="Password"
          type={show ? "text" : "password"}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clear("password");
          }}
          error={errors.password}
          hint={mode === "signup" ? "At least 8 characters" : undefined}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          suffix={<PasswordToggle show={show} onToggle={() => setShow((s) => !s)} />}
        />
        {mode === "login" && backendMode === "supabase" && (
          <button type="button" className="link-btn" style={{ alignSelf: "flex-start", marginLeft: "calc(var(--space-2) * -1)" }} onClick={() => navigate("/forgot-password")}>
            <strong style={{ marginLeft: 0 }}>Forgot your password?</strong>
          </button>
        )}
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
      </div>
    </Frame>
  );
}

export function ForgotPassword() {
  const navigate = useNavigate();
  const { requestReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const problem = validateEmail(email);
    setError(problem);
    if (problem) return;
    setBusy(true);
    const clean = email.trim().toLowerCase();
    const r = await requestReset(clean);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setSentTo(clean);
  };

  if (sentTo) {
    return (
      <Frame
        title="Check your email"
        lede={`If there's an account for ${sentTo}, we've sent a link to reset the password. It can take a few minutes.`}
        footer={
          <Button variant="ink" type="button" fullWidth onClick={() => navigate("/login", { replace: true })}>
            Back to log in
          </Button>
        }
      />
    );
  }

  return (
    <Frame
      onSubmit={submit}
      title="Reset your password"
      lede="Enter your email and we'll send you a link to choose a new one."
      footer={
        <Button variant="ink" type="submit" fullWidth loading={busy}>
          Send link
        </Button>
      }
    >
      <div className="form enter" style={{ ["--i" as string]: 2 }}>
        <Field
          label="Email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(undefined);
          }}
          error={error}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>
    </Frame>
  );
}

/** Where the reset-password email link lands. The link signs the person in briefly so they can set a new password. */
export function ResetPassword() {
  const navigate = useNavigate();
  const { session, status, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (status === "loading") return null;

  if (!session) {
    return (
      <Frame
        title="This link has expired"
        lede="Reset links only work once, for a short time. Ask for a new one."
        footer={
          <Button variant="ink" type="button" fullWidth onClick={() => navigate("/forgot-password", { replace: true })}>
            Send a new link
          </Button>
        }
      />
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const problem = validatePassword(password);
    setError(problem);
    if (problem) return;
    setBusy(true);
    const r = await updatePassword(password);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    navigate("/app", { replace: true });
  };

  return (
    <Frame
      onSubmit={submit}
      title="Choose a new password"
      footer={
        <Button variant="ink" type="submit" fullWidth loading={busy}>
          Save password
        </Button>
      }
    >
      <div className="form enter" style={{ ["--i" as string]: 2 }}>
        <Field
          label="New password"
          type={show ? "text" : "password"}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(undefined);
          }}
          error={error}
          hint="At least 8 characters"
          autoComplete="new-password"
          suffix={<PasswordToggle show={show} onToggle={() => setShow((s) => !s)} />}
        />
      </div>
    </Frame>
  );
}
