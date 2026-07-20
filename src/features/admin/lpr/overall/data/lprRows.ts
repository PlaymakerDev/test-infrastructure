import type { LPRInstallPoint } from '@/types/lpr/lpr-api'

/** Overall-list row — an LPR install point tagged with its owning แขวง's
 *  short name (joined client-side from /manage/departments, since the
 *  /lpr/points payload only carries `department_id`). Same role as
 *  incident-detection's `IncidentRow`: DataDisplaySection builds + filters
 *  these, the table/grid just render them. */
export type LPRRow = LPRInstallPoint & { bureau: string }
