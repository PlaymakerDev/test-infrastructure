export type UserRole = 'admin' | 'operator' | 'viewer'

export type UserStatus = 'active' | 'inactive'

export interface User {
  id: string
  username: string
  fullName: string
  email: string
  role: UserRole
  department: string
  phone: string
  status: UserStatus
  lastLoginAt: string | null
  createdAt: string
}

export interface UserFormValues {
  username: string
  fullName: string
  email: string
  role: UserRole
  department: string
  phone: string
  status: UserStatus
}

export interface UserFilters {
  role: UserRole | null
  status: UserStatus | null
  search: string
}
