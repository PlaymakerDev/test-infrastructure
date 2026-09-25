import { AuthInfo } from "@/types/auth";

export const isAdmin = (info: AuthInfo) => {
  if (info.username === 'admin') {
    return true
  } else {
    if (info.user_type_id === 1) {
      return true
    }
  }
  return false
}