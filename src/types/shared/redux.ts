export interface PromiseProperties {
  loading: boolean;
  status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'FAILED'
}