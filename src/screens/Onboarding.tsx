import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../design-system/Button";
import { Icon } from "../design-system/Icon";
import { OptionCard } from "../design-system/OptionCard";
import { ProgressBar } from "../design-system/ProgressBar";
import { SpalSymbol } from "../design-system/SpalSymbol";
import { isAnswered, visibleQuestions, type Option } from "../profile/questions";
import { BAND_LABEL, BAND_NOTE, NEED_LABEL } from "../profile/scoring";
import { useProfile } from "../profile/store";
import type { Answers } from "../profile/types";
import { NEED_ICON } from "../profile/ui";

/** One question per screen. Questions adapt to earlier answers (e.g. no sales question before you've started). */
export function Onboarding() {
  const navigate = useNavigate();
  const { stored, saveAnswers } = useProfile();
  const [answers, setAnswers] = useState<Answers>(stored.answers);
  const [idx, setIdx] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);

  const questions = visibleQuestions(answers);
  const q = questions[Math.min(idx, questions.length - 1)];
  const last = idx >= questions.length - 1;
  const answered = isAnswered(q, answers);

  // Move focus to the new question so screen-reader users hear it.
  useEffect(() => heading.current?.focus(), [idx]);

  const pick = (o: Option) => {
    if (!q.multi) return setAnswers((a) => ({ ...a, [q.id]: o.value }));
    const cur = (answers[q.id] as string[] | undefined) ?? [];
    const next = o.exclusive ? (cur.includes(o.value) ? [] : [o.value]) : cur.includes(o.value) ? cur.filter((v) => v !== o.value) : [...cur.filter((v) => v !== "none"), o.value];
    setAnswers((a) => ({ ...a, [q.id]: next }));
  };

  const isOn = (o: Option) => {
    const v = answers[q.id];
    return Array.isArray(v) ? (v as string[]).includes(o.value) : v === o.value;
  };

  const next = () => {
    saveAnswers(answers);
    if (last) navigate("/onboarding/building", { replace: true });
    else setIdx(idx + 1);
  };

  const back = () => {
    if (idx > 0) setIdx(idx - 1);
    else navigate(stored.completed ? "/app/profile" : "/welcome");
  };

  return (
    <div className="screen">
      <header className="screen__header screen__header--bar">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
        <ProgressBar value={idx + 1} max={questions.length} label={`Question ${idx + 1} of ${questions.length}`} />
      </header>

      <main className="screen__body" key={q.id}>
        <h1 className="title title--page enter" ref={heading} tabIndex={-1} style={{ outline: "none" }}>
          {q.title}
        </h1>
        {q.lede && (
          <p className="lede enter" style={{ ["--i" as string]: 1 }}>
            {q.lede}
          </p>
        )}
        <div className="opts enter" role={q.multi ? "group" : "radiogroup"} aria-label={q.title} style={{ ["--i" as string]: 2 }}>
          {q.options.map((o) => (
            <OptionCard key={o.value} label={o.label} hint={o.hint} kind={q.multi ? "checkbox" : "radio"} selected={isOn(o)} onSelect={() => pick(o)} />
          ))}
        </div>
      </main>

      <footer className="screen__footer">
        <Button fullWidth disabled={!answered} onClick={next}>
          {last ? "Finish" : "Continue"}
        </Button>
      </footer>
    </div>
  );
}

const LINES = ["Looking at where your business is", "Matching it to what you need", "Choosing your first step"];

/** A short pause so the person can tell their answers are being used. */
export function Building() {
  const navigate = useNavigate();
  const { stored } = useProfile();
  const [line, setLine] = useState(0);
  const hasAnswers = stored.answers.stage !== undefined;

  useEffect(() => {
    if (!hasAnswers) return;
    const tick = window.setInterval(() => setLine((l) => Math.min(l + 1, LINES.length - 1)), 650);
    const done = window.setTimeout(() => navigate("/onboarding/summary", { replace: true }), 2000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, [hasAnswers, navigate]);

  if (!hasAnswers) return <Navigate to="/onboarding" replace />;
  return (
    <div className="screen" role="status" aria-live="polite">
      <div className="building">
        <SpalSymbol symbol="insight" size="100%" />
        <p key={line} className="enter">
          {LINES[line]}
        </p>
      </div>
    </div>
  );
}

/** "Here's how we see you": the profile in plain words, with a way to correct it. */
export function Summary() {
  const navigate = useNavigate();
  const { stored, profile, completeOnboarding } = useProfile();
  if (stored.answers.stage === undefined) return <Navigate to="/onboarding" replace />;
  const focus = profile.needs.slice(0, 3);

  return (
    <div className="screen">
      <main className="screen__body">
        <h1 className="title title--page enter" style={{ paddingTop: "var(--space-8)" }}>
          Here's how we see your business
        </h1>
        <p className="lede enter" style={{ ["--i" as string]: 1 }}>
          This shapes what SPAL shows you. You can change it any time.
        </p>

        <div className="card enter stack" style={{ marginTop: "var(--space-6)", ["--i" as string]: 2 }}>
          <p className="row__sub">Where you are</p>
          <p className="hero__title">{BAND_LABEL[profile.band]}</p>
          <p className="hero__why">{BAND_NOTE[profile.band]}</p>
        </div>

        <h2 className="section-title">What we'll focus on first</h2>
        <div className="list enter" style={{ ["--i" as string]: 3 }}>
          {focus.map((n) => (
            <div className="row" key={n.id}>
              <span className="tile">
                <Icon name={NEED_ICON[n.id]} size={20} />
              </span>
              <span className="row__main">
                <span className="row__title">{NEED_LABEL[n.id]}</span>
                <span className="row__sub">{n.reasons[0]}</span>
              </span>
            </div>
          ))}
        </div>
      </main>

      <footer className="screen__footer">
        <Button
          fullWidth
          onClick={() => {
            completeOnboarding();
            navigate("/app/today", { replace: true });
          }}
        >
          See my first step
        </Button>
        <button type="button" className="link-btn" onClick={() => navigate("/onboarding")}>
          Change my answers
        </button>
      </footer>
    </div>
  );
}
