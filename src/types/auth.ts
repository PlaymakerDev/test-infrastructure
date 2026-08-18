export interface AuthState {
  auth_token: AuthToken;
  info: AuthInfo;
  /** True once the `GET /manage/info` fetch has SETTLED — success or failure.
   *  `info` alone can't tell the two apart (a failed fetch leaves it at
   *  initialState, which is indistinguishable from "still loading"), and
   *  role-gated UI must not render its default while the role is unknown.
   *  See `useUserRole` + AuthHydrator. */
  info_loaded: boolean;
}

export interface AuthToken {
  access_token: string | null;
  refresh_token: string | null;
}

export interface AuthInfo {
  id: string
  username: string
  user_type_id: number
  is_active: boolean
  created_at: string
  created_by: string
  deleted_by: any
  general_user: GeneralUser
  contractor: Contractor
}

export interface GeneralUser {
  user_id: string
  first_name: string
  lastname: string
  province_id: number
  department_id: number
  role: string
  is_ldap: boolean
  created_at: string
  created_by: string
  province: Province
  department: Department
}

export interface Province {
  id: number
  name_th: string
  name_en: string
  region_id: number
  region_name_th: string
  region_name_en: string
  created_at: string
  updated_at: any
}

export interface Department {
  id: number
  department_group: number
  province: string
  department_office_no: number
  department_name: string
  department_short_name: string
  is_external: number
  province_id: number
  line_token: string
  line_group_token: string
  is_urban: number
  department_type: number
  region_id: number
}

export interface Contractor {
  user_id: string
  company_name: string
  short_name: string
  address: string
  name: string
  phone: string
  email: string
  created_at: string
  created_by: string
}
