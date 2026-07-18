"use client"
import { Button, ConfigProvider, Form, Input, Modal, Select } from 'antd'
import React, { useEffect, useMemo } from 'react'
import { TbNetwork } from 'react-icons/tb'
import { useProjectDetailContext } from '../../context'
import { SOLUTION_TYPE, type SolutionTypeID } from '@/types/manage/solution-api'

interface Props {
  open: boolean
  onClose: () => void
}

interface FormShape {
  solution_name: string
  solution_type_id: SolutionTypeID
  latitude: string
  longitude: string
  sta: string
  ip_address?: string
  zt_ip_address?: string
  anydesk_id?: string
  remarks?: string
  /** Required when solution_type_id === 9 (WIM). */
  station_id?: number
  // Lighting (solution_type_id === 6) — fans out into the tbl_lighting_iot
  // (IoT4G-67) or lora status row on the backend side.
  lighting_type?: 1 | 2
  lighting_imei?: string
  lighting_phase_type?: string
  lighting_sem_type?: string
  lighting_diagram_type?: string
}

const RequiredLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: '#1F1F1F', fontSize: 14, fontWeight: 500 }}>
    {children}
    <span style={{ color: '#FF3B3B', marginLeft: 2 }}>*</span>
  </span>
)
const PlainLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: '#1F1F1F', fontSize: 14, fontWeight: 500 }}>{children}</span>
)

/** Compose the backend `geometry_point` value. Server unmarshals a
 *  GeoJSON Point object — WKT strings are rejected. */
const toGeometry = (lat: string, lng: string) => ({
  type: 'Point' as const,
  coordinates: [Number(lng), Number(lat)] as [number, number],
})

const AddTaskTypeModal: React.FC<Props> = ({ open, onClose }) => {
  const {
    activeRoute,
    activePoint,
    activePointTaskTypes,
    solutionTypes,
    addTaskType,
    isSubmitting,
  } = useProjectDetailContext()
  const [form] = Form.useForm<FormShape>()

  // Types already present at this point — disable them in the dropdown so
  // the user can't create a duplicate solution row.
  const usedTypeIds = useMemo(
    () => new Set(activePointTaskTypes.map((t) => t.kindId)),
    [activePointTaskTypes],
  )

  const typeOptions = useMemo(
    () =>
      solutionTypes.map((t) => ({
        label: t.label,
        value: t.id,
        disabled: usedTypeIds.has(t.id as SolutionTypeID),
      })),
    [solutionTypes, usedTypeIds],
  )

  useEffect(() => {
    if (!open) return
    form.resetFields()
  }, [open, form])

  const selectedTypeId = Form.useWatch('solution_type_id', form)
  const isWIM = selectedTypeId === SOLUTION_TYPE.WIM
  const isLighting = selectedTypeId === SOLUTION_TYPE.Lighting
  const isLightingIoT = isLighting && Form.useWatch('lighting_type', form) === 2

  const handleFinish = async (v: FormShape) => {
    if (!activePoint) return
    try {
      // Send optional strings as empty rather than omitting them — the
      // backend dereferences `*string` pointers without nil-checking and
      // crashes 500 on absent fields.
      const lighting =
        v.solution_type_id === SOLUTION_TYPE.Lighting && v.lighting_type
          ? {
              lighting_type: v.lighting_type,
              imei: v.lighting_imei?.trim() || undefined,
              phase_type: v.lighting_phase_type?.trim() || undefined,
              sem_type: v.lighting_sem_type?.trim() || undefined,
              diagram_type: v.lighting_diagram_type?.trim() || undefined,
            }
          : undefined
      await addTaskType({
        solution_type_id: v.solution_type_id,
        solution_location_id: activePoint.id,
        sta: v.sta.trim(),
        geometry_point: toGeometry(v.latitude, v.longitude),
        solution_name: v.solution_name.trim(),
        ip_address: v.ip_address?.trim() ?? '',
        zt_ip_address: v.zt_ip_address?.trim() ?? '',
        anydesk_id: v.anydesk_id?.trim() ?? '',
        remarks: v.remarks?.trim() ?? '',
        station_id: v.solution_type_id === SOLUTION_TYPE.WIM ? Number(v.station_id) : undefined,
        lighting,
      })
      onClose()
    } catch {
      // errors surfaced via message.error in the context — keep modal open
    }
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            footerBg: '#FFFFFF',
            colorIcon: '#000',
            titleColor: '#1F1F1F',
            borderRadiusLG: 16,
          },
          Form: { labelColor: '#1F1F1F', labelFontSize: 14 },
          Input: {
            colorBorder: '#E5E5E5',
            activeBorderColor: '#FCD116',
            hoverBorderColor: '#FCD116',
            colorTextPlaceholder: '#B8B8B8',
            borderRadius: 8,
            controlHeight: 44,
            paddingInline: 14,
          },
          Select: {
            colorBorder: '#E5E5E5',
            activeBorderColor: '#FCD116',
            hoverBorderColor: '#FCD116',
            colorTextPlaceholder: '#B8B8B8',
            borderRadius: 8,
            controlHeight: 44,
            optionSelectedBg: '#FFF8CC',
          },
        },
      }}
    >
      <Modal
        wrapClassName='light-modal'
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnHidden
        width={720}
        closable={{ 'aria-label': 'Custom Close Button' }}
        styles={{ container: { padding: '32px 40px', borderRadius: 16 }, mask: { background: 'rgba(0,0,0,0.55)' } }}
        title={
          <div className='flex items-center gap-3' style={{ color: '#111' }}>
            <TbNetwork size={22} style={{ color: 'var(--yellow)' }} />
            <span style={{ fontSize: 20, fontWeight: 600, color: '#111' }}>เพิ่มประเภทงาน</span>
          </div>
        }
      >
        <div
          className='mb-5 flex items-center justify-between'
          style={{ background: '#111111', borderRadius: 10, padding: '14px 20px' }}
        >
          <span style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 600 }}>
            {activePoint?.name ?? ''}
          </span>
          <span
            className='inline-flex items-center'
            style={{
              border: '1px solid #FCD116',
              color: '#FCD116',
              background: 'transparent',
              borderRadius: 999,
              padding: '4px 14px',
              fontSize: 13,
            }}
          >
            {activeRoute?.code}
          </span>
        </div>

        <Form<FormShape>
          form={form}
          layout='vertical'
          onFinish={handleFinish}
          requiredMark={false}
          disabled={isSubmitting}
        >
          <Form.Item
            label={<RequiredLabel>ชื่ออุปกรณ์ / งาน</RequiredLabel>}
            name='solution_name'
            rules={[{ required: true, message: 'กรุณาระบุชื่อประเภทงาน' }]}
          >
            <Input placeholder='กรุณาระบุชื่อประเภทงาน...' />
          </Form.Item>
          <Form.Item
            label={<RequiredLabel>ประเภทงาน</RequiredLabel>}
            name='solution_type_id'
            rules={[{ required: true, message: 'กรุณาเลือกประเภทงาน' }]}
          >
            <Select
              placeholder='กรุณาเลือกประเภทงาน...'
              classNames={{ popup: { root: 'light-modal-popup' } }}
              options={typeOptions}
              loading={solutionTypes.length === 0}
            />
          </Form.Item>
          <div className='grid grid-cols-2 gap-5'>
            <Form.Item
              label={<RequiredLabel>Latitude</RequiredLabel>}
              name='latitude'
              rules={[
                { required: true, message: 'กรุณาระบุ Latitude' },
                {
                  validator: async (_, v) =>
                    v && Number.isFinite(Number(v))
                      ? Promise.resolve()
                      : Promise.reject(new Error('Latitude ต้องเป็นตัวเลข')),
                },
              ]}
            >
              <Input placeholder='กรุณาระบุ Latitude...' />
            </Form.Item>
            <Form.Item
              label={<RequiredLabel>Longitude</RequiredLabel>}
              name='longitude'
              rules={[
                { required: true, message: 'กรุณาระบุ Longitude' },
                {
                  validator: async (_, v) =>
                    v && Number.isFinite(Number(v))
                      ? Promise.resolve()
                      : Promise.reject(new Error('Longitude ต้องเป็นตัวเลข')),
                },
              ]}
            >
              <Input placeholder='กรุณาระบุ Longitude...' />
            </Form.Item>
          </div>
          <div className='grid grid-cols-2 gap-5'>
            <Form.Item
              label={<RequiredLabel>กม.ที่ / STA</RequiredLabel>}
              name='sta'
              rules={[{ required: true, message: 'กรุณาระบุ กม.ที่' }]}
            >
              <Input placeholder='เช่น 10+500' />
            </Form.Item>
            <Form.Item label={<PlainLabel>Local IP Address</PlainLabel>} name='ip_address'>
              <Input placeholder='กรุณาระบุ Local IP Address...' />
            </Form.Item>
          </div>
          <div className='grid grid-cols-2 gap-5'>
            <Form.Item label={<PlainLabel>Anydesk</PlainLabel>} name='anydesk_id'>
              <Input placeholder='กรุณาระบุ Anydesk...' />
            </Form.Item>
            <Form.Item label={<PlainLabel>ZT IP Address</PlainLabel>} name='zt_ip_address'>
              <Input placeholder='กรุณาระบุ ZT IP Address...' />
            </Form.Item>
          </div>
          {isWIM && (
            <Form.Item
              label={<RequiredLabel>Station ID (WIM)</RequiredLabel>}
              name='station_id'
              rules={[
                { required: true, message: 'กรุณาระบุ Station ID' },
                {
                  validator: async (_, v) =>
                    Number.isInteger(Number(v)) && Number(v) > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error('Station ID ต้องเป็นเลขจำนวนเต็ม')),
                },
              ]}
            >
              <Input placeholder='กรุณาระบุ Station ID...' inputMode='numeric' />
            </Form.Item>
          )}
          {isLighting && (
            <>
              <Form.Item
                label={<RequiredLabel>Equipment</RequiredLabel>}
                name='lighting_type'
                rules={[{ required: true, message: 'กรุณาเลือกประเภทอุปกรณ์' }]}
              >
                <Select
                  placeholder='เลือกประเภทอุปกรณ์...'
                  classNames={{ popup: { root: 'light-modal-popup' } }}
                  options={[
                    { label: 'IoT4G-67', value: 2 },
                    { label: 'Lora Gateway', value: 1 },
                  ]}
                />
              </Form.Item>
              {isLightingIoT && (
                <>
                  <Form.Item
                    label={<RequiredLabel>IMEI</RequiredLabel>}
                    name='lighting_imei'
                    rules={[
                      { required: true, message: 'กรุณาระบุ IMEI' },
                      { pattern: /^\d{14,20}$/, message: 'IMEI ควรเป็นตัวเลข 14-20 หลัก' },
                    ]}
                  >
                    <Input placeholder='กรุณาระบุ IMEI...' inputMode='numeric' />
                  </Form.Item>
                  <div className='grid grid-cols-2 gap-5'>
                    <Form.Item
                      label={<RequiredLabel>Phase</RequiredLabel>}
                      name='lighting_phase_type'
                      rules={[{ required: true, message: 'กรุณาเลือก Phase' }]}
                    >
                      <Select
                        placeholder='เลือก Phase...'
                        classNames={{ popup: { root: 'light-modal-popup' } }}
                        options={[
                          { label: '1p (single phase)', value: '1p' },
                          { label: '3p (three phase)', value: '3p' },
                          { label: '1p_cab (single-phase cabinet)', value: '1p_cab' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item
                      label={<RequiredLabel>ประเภท Datalog</RequiredLabel>}
                      name='lighting_sem_type'
                      rules={[{ required: true, message: 'กรุณาเลือก Datalog' }]}
                    >
                      <Select
                        placeholder='เลือกประเภท Datalog...'
                        classNames={{ popup: { root: 'light-modal-popup' } }}
                        showSearch
                        options={[
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
                        ].map((v) => ({ label: v, value: v }))}
                      />
                    </Form.Item>
                  </div>
                  <Form.Item
                    label={<RequiredLabel>ประเภท Diagram</RequiredLabel>}
                    name='lighting_diagram_type'
                    rules={[{ required: true, message: 'กรุณาระบุประเภท Diagram' }]}
                  >
                    <Input placeholder='เช่น 0STW-1MCB-1PW-1MC-3CB-1TFM-ADJ' />
                  </Form.Item>
                </>
              )}
            </>
          )}
          <Form.Item label={<PlainLabel>หมายเหตุ</PlainLabel>} name='remarks'>
            <Input.TextArea placeholder='กรุณาระบุหมายเหตุ...' rows={2} />
          </Form.Item>
          <div className='flex justify-end gap-3 mt-2'>
            <Button
              shape='round'
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                background: '#E5E5E5',
                color: '#4A4A4A',
                borderColor: '#E5E5E5',
                padding: '10px 28px',
                height: 'auto',
                fontWeight: 500,
              }}
            >
              ยกเลิก
            </Button>
            <Button
              shape='round'
              htmlType='submit'
              loading={isSubmitting}
              disabled={false}
              style={{
                background: '#FCD116',
                color: '#1A1A1A',
                borderColor: '#FCD116',
                padding: '10px 32px',
                height: 'auto',
                fontWeight: 600,
              }}
            >
              ยืนยัน
            </Button>
          </div>
        </Form>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(AddTaskTypeModal)
