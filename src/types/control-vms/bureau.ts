import type { VMSDepartmentList, SubDepartment, Road, Solution } from './vms-api'

export type BureauItem = VMSDepartmentList
export type BureauState = SubDepartment
export type BureauRoute = Road
export type BureauSign = Solution

export interface BureauSelection {
  keys: string[]
  bureaus: BureauItem[]
  states: BureauState[]
  routes: BureauRoute[]
  signs: BureauSign[]
}
