"use client"
import { Button, ConfigProvider, Form, Input, message, Modal, Spin } from 'antd'
import React, { useEffect } from 'react'
import { TbPencil } from 'react-icons/tb'
import { useSolutionDetail, useUpdateSolution } from '@/hooks/queries/manage'
import type { TaskType } from '../../types'
import { useProjectDetailContext } from '../../context'

interface Props {
  open: boolean
  /** The task type row being edited — provides the tbl_solution.id and
   *  the current kind label for the header pill. */
  task: TaskType | null
  onClose: () => void
}

interface FormShape {
  solution_name: string
  latitude: string
  longitude: string
  sta: string
  ip_address?: string
  zt_ip_address?: string
  anydesk_id?: string
  remarks?: string
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

const toGeometry = (lat: string, lng: string) => ({
  type: 'Point' as const,
  coordinates: [Number(lng), Number(lat)] as [number, number],
})

/** Read the [lng, lat] pair out of whatever `geometry_point` shape the
 *  backend shipped. Server sends `[lng,lat]` array on some endpoints and
 *  GeoJSON object on others. Bare number pair from a Postgres `POINT`
 *  cast is also possible. Bad / missing values fall through to empty
 *  strings so the form inputs stay usable. */
const readGeometry = (geom: unknown): { lat: string; lng: string } => {
  if (Array.isArray(geom) && geom.length === 2) {
    const [lng, lat] = geom as [number, number]
    return { lat: String(lat), lng: String(lng) }
  }
  if (
    geom &&
    typeof geom === 'object' &&
    'coordinates' in geom &&
    Array.isArray((geom as { coordinates: unknown[] }).coordinates)
  ) {
    const [lng, lat] = (geom as { coordinates: [number, number] }).coordinates
    return { lat: String(lat), lng: String(lng) }
  }
  return { lat: '', lng: '' }
}

/** Edit an existing Solution row. Fetches detail on open, wires
 *  useUpdateSolution. Non-editable: solution_type_id (create-only). */
const EditSolutionModal: React.FC<Props> = ({ open, task, onClose }) => {
  const { activeRoute, activePoint } = useProjectDetailContext()
  const { data: detail, isLoading: detailLoading } = useSolutionDetail(
    open && task ? task.id : null,
  )
  const updateSolution = useUpdateSolution()
  const [form] = Form.useForm<FormShape>()

  useEffect(() => {
    if (!open || !detail) return
    const { lat, lng } = readGeometry(detail.geometry_point)
    form.setFieldsValue({
      solution_name: detail.solution_name,
      latitude: lat,
      longitude: lng,
      sta: detail.sta ?? '',
      ip_address: detail.ip_address ?? '',
      zt_ip_address: detail.zt_ip_address ?? '',
      anydesk_id: detail.anydesk ?? '',
      remarks: detail.remarks ?? '',
    })
  }, [open, detail, form])

  const handleFinish = async (v: FormShape) => {
    if (!task) return
    try {
      await updateSolution.mutateAsync({
        id: task.id,
        data: {
          sta: v.sta.trim(),
          geometry_point: toGeometry(v.latitude, v.longitude),
          solution_name: v.solution_name.trim(),
          ip_address: v.ip_address?.trim() ?? '',
          zt_ip_address: v.zt_ip_address?.trim() ?? '',
          anydesk_id: v.anydesk_id?.trim() ?? '',
          remarks: v.remarks?.trim() ?? '',
        },
      })
      message.success('แก้ไขประเภทงานสำเร็จ')
      onClose()
    } catch (err) {
      const anyErr = err as {
        response?: { data?: { res_data?: { message?: string; details?: unknown } } }
        message?: string
      }
      message.error(
        anyErr?.response?.data?.res_data?.message ??
          anyErr?.message ??
          'แก้ไขประเภทงานไม่สำเร็จ',
      )
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
        styles={{
          container: { padding: '32px 40px', borderRadius: 16 },
          mask: { background: 'rgba(0,0,0,0.55)' },
        }}
        title={
          <div className='flex items-center gap-3' style={{ color: '#111' }}>
            <TbPencil size={22} style={{ color: 'var(--yellow)' }} />
            <span style={{ fontSize: 20, fontWeight: 600, color: '#111' }}>
              แก้ไขประเภทงาน
            </span>
          </div>
        }
      >
        <div
          className='mb-5 flex items-center justify-between'
          style={{ background: '#111111', borderRadius: 10, padding: '14px 20px' }}
        >
          <span style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 600 }}>
            {task?.kind} · {activePoint?.name ?? ''}
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

        {detailLoading ? (
          <div className='flex items-center justify-center py-10'>
            <Spin />
          </div>
        ) : (
          <Form<FormShape>
            key={task ? `edit-${task.id}-${detail ? 'ready' : 'wait'}` : 'idle'}
            form={form}
            layout='vertical'
            onFinish={handleFinish}
            requiredMark={false}
            disabled={updateSolution.isPending}
          >
            <Form.Item
              label={<RequiredLabel>ชื่ออุปกรณ์ / งาน</RequiredLabel>}
              name='solution_name'
              rules={[{ required: true, message: 'กรุณาระบุชื่อ' }]}
            >
              <Input placeholder='กรุณาระบุชื่อประเภทงาน...' />
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
            <Form.Item label={<PlainLabel>หมายเหตุ</PlainLabel>} name='remarks'>
              <Input.TextArea placeholder='กรุณาระบุหมายเหตุ...' rows={2} />
            </Form.Item>
            <div className='flex justify-end gap-3 mt-2'>
              <Button
                shape='round'
                onClick={onClose}
                disabled={updateSolution.isPending}
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
                loading={updateSolution.isPending}
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
        )}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(EditSolutionModal)
