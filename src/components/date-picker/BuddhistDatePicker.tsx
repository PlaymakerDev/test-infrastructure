import type { Dayjs } from 'dayjs'
import generateConfig from '@rc-component/picker/lib/generate/dayjs'
import generatePicker from 'antd/es/date-picker/generatePicker'

const buddhistConfig = {
  ...generateConfig,
  getYear: (date: Dayjs) => date.year() + 543,
  setYear: (date: Dayjs, year: number) => date.year(year - 543),
}

const BuddhistDatePicker = generatePicker<Dayjs>(buddhistConfig)
export default BuddhistDatePicker
