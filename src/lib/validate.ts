const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const validateName = (v: string): string | undefined =>
  v.trim().length < 2 ? "Enter your name" : undefined;

export const validateEmail = (v: string): string | undefined => {
  const t = v.trim();
  if (!t) return "Enter your email";
  return EMAIL.test(t) ? undefined : "That email doesn't look right";
};

export const validatePassword = (v: string): string | undefined =>
  v.length < 8 ? "Use at least 8 characters" : undefined;
