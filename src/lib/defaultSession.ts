import { SessionOptions } from "iron-session";

export interface SessionData {
  access_token: string;
  refresh_token: string;
  role: "EXAMPLE" | "ADMIN" | "";
}

export const defaultSession: SessionData = {
  access_token: "",
  refresh_token: "",
  role: "",
};

export const sessionOptions: SessionOptions = {
  password: process.env.TOKEN_SECRET || 'a7b9c3d2e8f1g4h6i9j2k5l7m0n3p6q8',
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