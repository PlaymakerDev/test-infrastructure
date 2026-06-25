// Single load-site for the Thai locale + Buddhist Era plugin. Every other
// file in the Traffic Volume module imports `dayjs` from here (not directly
// from 'dayjs') so the plugin is guaranteed to be extended exactly once and
// can't be tree-shaken away while leaving the `BBBB` format token broken.

import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'

dayjs.extend(buddhistEra)

export { dayjs }
export type { Dayjs } from 'dayjs'
