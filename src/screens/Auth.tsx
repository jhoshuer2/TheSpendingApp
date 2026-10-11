import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../design-system/Button";
import { Field } from "../design-system/Field";
import { Icon } from "../design-system/Icon";
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

export function Auth({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const c = COPY[mode];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const clear = (k: keyof Errors) => setErrors((e) => ({ ...e, [k]: undefined }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {
      name: mode === "signup" ? validateName(name) : undefined,
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(next);
    if (next.name || next.email || next.password) return;

    const cleanEmail = email.trim().toLowerCase();
    signIn({ name: mode === "signup" ? name.trim() : cleanEmail.split("@")[0], email: cleanEmail });
    navigate(mode === "signup" ? "/onboarding" : "/app", { replace: true });
  };

  return (
    <form className="screen" onSubmit={submit} noValidate>
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={() => navigate(-1)}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>

      <main className="screen__body">
        <h1 className="title title--page enter">{c.title}</h1>
        <p className="lede enter" style={{ ["--i" as string]: 1 }}>
          {c.lede}
        </p>

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
            suffix={
              <button
                type="button"
                className="field__toggle"
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
                onClick={() => setShow((s) => !s)}
              >
                <Icon name={show ? "eye-off" : "eye"} size={20} />
              </button>
            }
          />
        </div>
      </main>

      <footer className="screen__footer">
        <Button type="submit" fullWidth>
          {c.submit}
        </Button>
        <div className="auth-switch">
          <button type="button" className="link-btn" onClick={() => navigate(c.switchTo, { replace: true })}>
            {c.switchText} <strong>{c.switchAction}</strong>
          </button>
        </div>
      </footer>
    </form>
  );
}
