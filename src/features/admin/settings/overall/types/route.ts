export interface Route {
  id: string
  code: string
  name: string
  province: string
  district: string
  lengthKm: number
  responsibleOffice: string
  createdAt: string
}

export interface RouteFormValues {
  code: string
  name: string
  province: string
  district: string
  lengthKm: number | null
  responsibleOffice: string
}

export interface RouteFilters {
  province: string | null
  responsibleOffice: string | null
  search: string
}
