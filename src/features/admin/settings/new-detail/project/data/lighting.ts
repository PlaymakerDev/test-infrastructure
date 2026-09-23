/** Option lists for the Lighting (solution_type_id = 6) block on the create
 *  form. Values are the exact strings the backend stores in
 *  `lighting.tbl_lighting_iot`, lifted from the legacy AddTaskTypeModal so
 *  both forms write the same vocabulary.
 *
 *  `diagram_type` is NOT here — it is picked from the live template list
 *  (useLightingDiagramTemplates), because the chosen name is what the backend
 *  copies the device's starting diagram from. */

export const SOLUTION_TYPE_LIGHTING = 6

/** lighting.tbl_lighting_type — 2 is the IMEI-bearing device. */
export const LIGHTING_TYPE_IOT = 2

export const LIGHTING_TYPE_OPTIONS = [
  { label: 'IoT4G-67', value: 2 },
  { label: 'Lora Gateway', value: 1 },
]

export const LIGHTING_PHASE_OPTIONS = [
  { label: '1p (single phase)', value: '1p' },
  { label: '3p (three phase)', value: '3p' },
  { label: '1p_cab (single-phase cabinet)', value: '1p_cab' },
]

export const LIGHTING_SEM_TYPE_OPTIONS = [
  'nbiot_cab',
  'nbiot_cab_1p',
  'nbiot_cab_3p',
  'nbiot_cab_pole',
  'nbiot_cab_pole_hm_3p',
  'nbiot_cab_line_check_0w',
  'nbiot_cab_line_check_1w_l',
  'nbiot_cab_line_check_1w_r',
  'nbiot_cab_line_check_2w',
  'nbiot_cab_line_check_3w',
  'nbiot_cab_line_check_4w',
  'nbiot_cab_3p_line_check_0w',
  'nbiot_cab_3p_line_check_3w',
  'nbiot_cab_3p_line_check_6w',
  'lora_lighting',
].map((v) => ({ label: v, value: v }))

export const LIGHTING_CONNECTION_TYPE_OPTIONS = [
  { label: 'NB-IoT', value: 'NB-IoT' },
  { label: 'LTE-M', value: 'LTE-M' },
  { label: '4G LTE', value: '4G_LTE' },
  { label: 'WiFi', value: 'WiFi' },
]

export const LIGHTING_SEND_FREQUENCY_OPTIONS = [
  { label: 'ทุก 1 นาที', value: 'every_1min' },
  { label: 'ทุก 5 นาที', value: 'every_5min' },
  { label: 'ทุก 10 นาที', value: 'every_10min' },
  { label: 'ทุก 15 นาที', value: 'every_15min' },
  { label: 'ทุก 30 นาที', value: 'every_30min' },
  { label: 'ทุกชั่วโมง', value: 'hourly' },
]

/** IMEI as the legacy form validated it: 14–20 digits. */
export const IMEI_PATTERN = /^\d{14,20}$/
