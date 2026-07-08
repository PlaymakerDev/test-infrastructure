/** Lighting endpoints may return `{ res_code, res_data }` or the payload directly. */
export function unwrapLightingResponse<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'res_data' in payload) {
    return (payload as { res_data: T }).res_data
  }
  return payload as T
}
