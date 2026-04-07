import { SessionData, sessionOptions } from "@/lib/defaultSession";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export const getCookieSession = async () => {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  return session
}