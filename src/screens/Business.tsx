import { useState, type FormEvent } from "react";
import { Button } from "../design-system/Button";
import { Field } from "../design-system/Field";
import { Icon } from "../design-system/Icon";
import { FACT_KEYS, factsOf, type FactKey } from "../messages/facts";
import { useBack } from "../lib/useBack";
import { useToast } from "../lib/toast";
import { useProfile } from "../profile/store";

/** The few facts about your business that SPAL writes from: price lists, greetings, your Instagram bio. All optional. */
export function Business() {
  const back = useBack("/app/profile");
  const { show } = useToast();
  const { stored, saveAnswers } = useProfile();
  const start = factsOf(stored.answers);
  const [v, setV] = useState<Record<FactKey, string>>({ businessName: start.businessName ?? "", about: start.about ?? "", place: start.place ?? "", hours: start.hours ?? "", instagram: start.instagram ?? "" });
  const [error, setError] = useState<string>();
  const set = (k: FactKey) => (e: { target: { value: string } }) => {
    setV((x) => ({ ...x, [k]: e.target.value }));
    setError(undefined);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const handle = v.instagram.trim().replace(/^@+/, "");
    if (handle && !/^[A-Za-z0-9._]{1,30}$/.test(handle)) return setError("An Instagram name has only letters, numbers, dots and underscores. For example: ada.kitchen");
    const next = { ...stored.answers };
    for (const k of FACT_KEYS) delete next[k];
    for (const k of FACT_KEYS) {
      const val = (k === "instagram" ? handle : v[k]).replace(/\s+/g, " ").trim();
      if (val) next[k] = val;
    }
    saveAnswers(next);
    show("Saved your business details.");
    back();
  };

  return (
    <form className="screen" onSubmit={submit} noValidate>
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>
      <main className="screen__body">
        <h1 className="title title--page enter">Your business</h1>
        <p className="lede enter" style={{ ["--i" as string]: 1 }}>
          A few facts SPAL uses to write for you: your price list, WhatsApp greeting, and your Instagram bio. All optional. Nothing is shared with customers until you send it.
        </p>
        <div className="form enter" style={{ ["--i" as string]: 2, marginTop: "var(--space-5)" }}>
          <Field label="Business name" value={v.businessName} onChange={set("businessName")} maxLength={60} autoComplete="off" autoCapitalize="words" />
          <Field label="What you sell" value={v.about} onChange={set("about")} maxLength={200} hint="One line, in your own words. For example: Home-cooked jollof and zobo, made fresh daily." autoComplete="off" />
          <Field label="Where you are" value={v.place} onChange={set("place")} maxLength={100} hint="An area or address customers can find. For example: Yaba, Lagos." autoComplete="off" />
          <Field label="Opening hours" value={v.hours} onChange={set("hours")} maxLength={100} hint="For example: Mon to Sat, 10am to 6pm." autoComplete="off" />
          <Field label="Instagram" prefix="@" value={v.instagram} onChange={set("instagram")} maxLength={31} error={error} autoComplete="off" autoCapitalize="none" />
        </div>
      </main>
      <footer className="screen__footer">
        <Button type="submit" fullWidth>
          Save
        </Button>
      </footer>
    </form>
  );
}
