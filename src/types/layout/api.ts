export type APIResponseSidebar = SidebarItem[]

export interface SidebarItem {
  department_short_name: string
  sub_department: SubDepartment[]
}

export interface SubDepartment {
  department_id: number
  department_short_name: string
  solutions: Solution[]
}

export interface Solution {
  solution_type_id: number
  solution_type_name: string
  roads_count: number
}
