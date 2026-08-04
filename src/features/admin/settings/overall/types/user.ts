// UI-side User type — mapped from `APIResponseGeneralUser` in
// src/types/manage/general-user-api.ts. Real API differences vs. the mock:
//   • ID is `user_id` (uuid) — kept as `id: string` here.
//   • Real "last name" wire field is `lastname` (single word). We split it
//     into `firstName` + `lastName` for the form, and expose `fullName` as a
//     computed convenience for the table + delete dialog.
//   • No `email`, `phone`, or `lastLoginAt` on the wire — dropped from UI.
//   • `status` is inferred from `user.is_active` (boolean) — read-only for now.
//   • Department is stored as `department_id` (number) with a human label
//     joined in from /manage/departments.

/** The two role slugs the system issues: `admin` (ผู้ดูแลระบบ) and `user`
 *  (ผู้ใช้งาน). Free-form strings from the server are still allowed (cast
 *  when reading) — legacy rows may carry `operator`/`viewer`, which RoleBadge
 *  still labels but which are no longer offered in the create/filter UI. */
export type UserRole = 'admin' | 'user'

export type UserStatus = 'active' | 'inactive'

export interface User {
  /** user_id (uuid) — path parameter for PUT/DELETE/PATCH. */
  id: string
  username: string
  firstName: string
  lastName: string
  /** `${firstName} ${lastName}` — precomputed for table + delete summary. */
  fullName: string
  role: string
  departmentId: number | null
  /** department_short_name looked up from useDepartments — '-' when null. */
  department: string
  status: UserStatus
  createdAt: string
  /** Whether the account is linked to Active Directory (mapped from
   *  `is_ldap` on the wire). LDAP users authenticate via AD and cannot
   *  have their password changed through the SSO PATCH endpoint. */
  isLdap: boolean
}

/** Values captured by UserModal. `password` is required on CREATE, absent on
 *  EDIT (the edit dialog delegates password changes to a dedicated modal
 *  hitting PATCH /general_user/{id}/password). */
export interface UserFormValues {
  username: string
  firstName: string
  lastName: string
  role: string
  departmentId: number
  password?: string
  /** Set by the modal to reflect which sub-tab mode was active when the
   *  form was opened. LDAP mode omits the password field and creates the
   *  user with `is_ldap: true` on POST /general_user. */
  isLdap: boolean
}

export interface UserFilters {
  role: UserRole | null
  status: UserStatus | null
  search: string
}
