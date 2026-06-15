export interface APIActionResponse {
  message: string;
}

export interface PromiseProperties {
  loading: boolean;
  status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'FAILED'
}

export interface MetaData {
  count: number
  page: number
  limit: number
  total_pages: number
}
