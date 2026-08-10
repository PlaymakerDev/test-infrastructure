import { SessionOptions } from "iron-session";

export interface SessionData {
  access_token: string;
  refresh_token: string;
  role: "EXAMPLE" | "ADMIN" | "";
  refresh_at: number;  // unix ms — next proactive-refresh due time (now + REFRESH_AFTER_MS)
  /** Department the user should land on — `resolveHomeDeptId()` over the
   *  token-scoped `GET /manage/departments`, computed once at login.
   *  0 = ส่วนกลาง (nationwide). `undefined` on sessions created before this
   *  field existed, so every reader must handle its absence.
   *
   *  WHY it lives in the session: `proxy.ts` redirects an already-logged-in
   *  visitor from /auth/login to their landing page and must build the SAME
   *  `?dept_id=…&scope=all` query the login form builds. Middleware runs at the
   *  edge and can't resolve the dept without an extra authenticated fetch on
   *  every login-page hit — so login stores it here instead (2026-08-10). */
  home_dept_id?: number;
}

export const defaultSession: SessionData = {
  access_token: "",
  refresh_token: "",
  role: "",
  refresh_at: 0,
};

const getSessionPassword = (): string => {
  const secret = process.env.TOKEN_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[defaultSession] TOKEN_SECRET environment variable must be set in production')
  }
  // Development only — set TOKEN_SECRET in .env.local to silence this warning
  console.warn('[defaultSession] TOKEN_SECRET is not set — using insecure dev fallback. Add TOKEN_SECRET to .env.local')
  return 'dev-only-insecure-fallback-set-TOKEN_SECRET-in-env-local-32chars'
}

export const sessionOptions: SessionOptions = {
  password: getSessionPassword(),
  cookieName: "DRR_ITS",
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production', // true in production, false in dev
    httpOnly: true,      // Prevents JavaScript access (XSS protection)
    // maxAge: 60 * 60 * 24, // 1 day expiration
    maxAge: 60 * 60 * 24 * 30, // 1 month expiration
    // maxAge: 60 * 60 * 24 * 365, // 1 year expiration
    sameSite: 'strict',  // CSRF protection
  },
};