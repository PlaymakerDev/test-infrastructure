export interface Contractor {
  id: string
  companyName: string
  taxId: string
  contactPerson: string
  phone: string
  email: string
  address: string
  province: string
  registeredAt: string
  projectCount: number
}

export interface ContractorFormValues {
  companyName: string
  taxId: string
  contactPerson: string
  phone: string
  email: string
  address: string
  province: string
}

export interface ContractorFilters {
  province: string | null
  search: string
}
