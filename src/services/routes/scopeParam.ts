/**
 * Central overview endpoints (`/overview/central/list` + `/overview/central/totals`)
 * treat department id `0` as "the caller's own department group" unless
 * `scope=all` is sent, which returns every bureau the caller is permitted to see
 * (all bureaus for an unrestricted admin; still only their own for a restricted
 * user — so it is always safe to send). Only dept 0 is affected; any other dept
 * ignores the param, so we omit it to keep those URLs clean.
 */
export const centralScope = (
  deptId: string | number
): { scope: 'all' } | undefined =>
  Number(deptId) === 0 ? { scope: 'all' } : undefined
