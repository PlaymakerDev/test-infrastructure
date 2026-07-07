// App-wide dayjs bootstrap. Import this once from a top-level client boundary
// (see StoreProvider) so the `buddhistEra` plugin — and therefore the `BBBB`
// format token used by BuddhistDatePicker + Thai-formatted labels — is
// available everywhere without each feature module extending it locally.
//
// Kept minimal on purpose:
//  - Only the plugin is registered here.
//  - Locale is NOT set globally (some modules set `dayjs.locale('th')`
//    scoped to their render tree; a global switch would flip every format
//    string in the app and shift downstream date arithmetic).
//  - Re-exports `dayjs` so callers that want the "already extended" instance
//    can `import dayjs from '@/configs/dayjs'` — but a side-effect
//    `import '@/configs/dayjs'` is also enough because `dayjs` is a
//    singleton within a bundle.

import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'

dayjs.extend(buddhistEra)

export default dayjs
