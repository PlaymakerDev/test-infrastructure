import type { Locale } from 'antd/es/locale'
import thTH from 'antd/locale/th_TH'
// Registers dayjs' `th` locale (month / weekday names) WITHOUT switching the
// global dayjs locale — antd's th_TH does not import it, and rc-picker resolves
// `th_TH` → `th` when it formats the panel and the input text.
import 'dayjs/locale/th'

/** antd th_TH with the year formats switched to the Buddhist Era, for use with
 *  `BuddhistDatePicker` via `<ConfigProvider locale={thBuddhistLocale}>`.
 *
 *  Plain `thTH` isn't enough there: antd formats the panel header and the
 *  year / decade cells with `locale.yearFormat` (raw dayjs `YYYY`), bypassing
 *  BuddhistDatePicker's `getYear` / `setYear` (+543) override — so the dropdown
 *  would show the Gregorian year (2025) even though the closed input, driven by
 *  `format='… BBBB'`, shows the BE year (2568). Needs the `buddhistEra` plugin,
 *  which `@/configs/dayjs` registers app-wide (StoreProvider). */
export const thBuddhistLocale: Locale = {
  ...thTH,
  DatePicker: {
    ...thTH.DatePicker!,
    lang: {
      ...thTH.DatePicker!.lang,
      yearFormat: 'BBBB',
      cellYearFormat: 'BBBB',
      fieldYearFormat: 'BBBB',
    },
  },
}
