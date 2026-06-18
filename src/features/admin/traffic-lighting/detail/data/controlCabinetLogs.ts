export type CabinetLogEventCategory = 'CIRCUIT' | 'LINE_CHECK' | 'VOLT_AMP' | 'OTHER'

export type CabinetLogStatus =
  | { kind: 'ok_pills'; labels: string[] }
  | { kind: 'voltage'; value: string }
  | {
      kind: 'circuit_badges'
      badges: { label: string; color: string; variant: 'outline' | 'filled' }[]
    }
  | { kind: 'empty' }

export interface ControlCabinetLogRecord {
  key: string
  datetime: string
  eventType: string
  eventCategory: CabinetLogEventCategory
  phase: string
  status: CabinetLogStatus
  data: { value: string; color: 'white' | 'yellow' }
}

export const EVENT_TYPE_COLORS: Record<string, string> = {
  'Line Check': '#FCD116',
  FMTS: '#E94C4C',
  UPS1: '#E94C4C',
  'Volt/Amp': '#66AEFF',
  Circuit: '#05F2DB',
}

const CIRCUIT_BADGES: ControlCabinetLogRecord['status'] = {
  kind: 'circuit_badges',
  badges: [
    { label: 'ST', color: '#E94C4C', variant: 'outline' },
    { label: 'MB', color: '#66AEFF', variant: 'filled' },
    { label: 'PS', color: '#E94C4C', variant: 'outline' },
    { label: 'MC1', color: '#E94C4C', variant: 'outline' },
    { label: 'MC2', color: '#E94C4C', variant: 'outline' },
    { label: 'CB1', color: '#979797', variant: 'outline' },
    { label: 'CB2', color: '#979797', variant: 'outline' },
    { label: 'CB3', color: '#979797', variant: 'outline' },
    { label: 'CB4', color: '#979797', variant: 'outline' },
    { label: 'TFM', color: '#FCD116', variant: 'filled' },
  ],
}

/** Mock control-cabinet logs for Lighting 4G IoT Monitor tab. */
export const CONTROL_CABINET_LOGS: ControlCabinetLogRecord[] = [
  {
    key: '1',
    datetime: '20 เม.ย. 2569 11:35:33',
    eventType: 'Line Check',
    eventCategory: 'LINE_CHECK',
    phase: '1',
    status: { kind: 'ok_pills', labels: ['OK', 'OK', 'OK', 'OK'] },
    data: { value: '11110 - 00000', color: 'white' },
  },
  {
    key: '2',
    datetime: '20 เม.ย. 2569 11:34:58',
    eventType: 'FMTS',
    eventCategory: 'OTHER',
    phase: '1',
    status: { kind: 'empty' },
    data: { value: '0.30 - 0.0002', color: 'white' },
  },
  {
    key: '3',
    datetime: '20 เม.ย. 2569 11:34:12',
    eventType: 'UPS1',
    eventCategory: 'OTHER',
    phase: '1',
    status: { kind: 'empty' },
    data: { value: '11110 - 00000', color: 'white' },
  },
  {
    key: '4',
    datetime: '20 เม.ย. 2569 11:33:45',
    eventType: 'Volt/Amp',
    eventCategory: 'VOLT_AMP',
    phase: '1',
    status: { kind: 'voltage', value: '241.09 V' },
    data: { value: '241.20 V - 0.2142 A', color: 'yellow' },
  },
  {
    key: '5',
    datetime: '20 เม.ย. 2569 11:33:05',
    eventType: 'Circuit',
    eventCategory: 'CIRCUIT',
    phase: '1',
    status: CIRCUIT_BADGES,
    data: { value: '11110 - 00000', color: 'white' },
  },
  {
    key: '6',
    datetime: '20 เม.ย. 2569 11:32:18',
    eventType: 'Line Check',
    eventCategory: 'LINE_CHECK',
    phase: '1',
    status: { kind: 'ok_pills', labels: ['OK', 'OK', 'OK', 'OK'] },
    data: { value: '11001 - 00110', color: 'white' },
  },
  {
    key: '7',
    datetime: '20 เม.ย. 2569 11:31:42',
    eventType: 'FMTS',
    eventCategory: 'OTHER',
    phase: '1',
    status: { kind: 'empty' },
    data: { value: '0.30 - 0.0002', color: 'white' },
  },
  {
    key: '8',
    datetime: '20 เม.ย. 2569 11:30:48',
    eventType: 'UPS1',
    eventCategory: 'OTHER',
    phase: '1',
    status: { kind: 'empty' },
    data: { value: '10101 - 01010', color: 'white' },
  },
  {
    key: '9',
    datetime: '20 เม.ย. 2569 11:30:12',
    eventType: 'Volt/Amp',
    eventCategory: 'VOLT_AMP',
    phase: '1',
    status: { kind: 'voltage', value: '241.09 V' },
    data: { value: '241.20 V - 0.2142 A', color: 'yellow' },
  },
  {
    key: '10',
    datetime: '20 เม.ย. 2569 11:29:33',
    eventType: 'Circuit',
    eventCategory: 'CIRCUIT',
    phase: '1',
    status: CIRCUIT_BADGES,
    data: { value: '11110 - 00000', color: 'white' },
  },
  {
    key: '11',
    datetime: '20 เม.ย. 2569 11:28:22',
    eventType: 'Line Check',
    eventCategory: 'LINE_CHECK',
    phase: '1',
    status: { kind: 'ok_pills', labels: ['OK', 'OK', 'OK', 'OK'] },
    data: { value: '11110 - 00000', color: 'white' },
  },
  {
    key: '12',
    datetime: '20 เม.ย. 2569 11:27:55',
    eventType: 'Volt/Amp',
    eventCategory: 'VOLT_AMP',
    phase: '1',
    status: { kind: 'voltage', value: '238.52 V' },
    data: { value: '238.52 V - 11.80 A', color: 'yellow' },
  },
]
