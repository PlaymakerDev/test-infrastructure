"use client"
import { Button, ConfigProvider, Form, Input, Modal, Select } from 'antd'
import React, { useEffect } from 'react'
import { TbNetwork } from 'react-icons/tb'
import { useProjectDetailContext } from '../../context'
import type { TaskKind } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
}

interface FormShape {
  pointName: string
  kind: TaskKind
  latitude: string
  longitude: string
  km: string
  localIp: string
  anyDesk: string
  ztIp: string
  note: string
}

const KIND_OPTIONS: { label: string; value: TaskKind }[] = [
  { label: 'CCTV', value: 'CCTV' },
  { label: 'Traffic Volume', value: 'Traffic Volume' },
  { label: 'Incident Detection', value: 'Incident Detection' },
]

const AddTaskTypeModal: React.FC<Props> = ({ open, onClose }) => {
  const { activeRouteId, activePointId, addTaskType, project } = useProjectDetailContext()
  const [form] = Form.useForm<FormShape>()

  const route = project.routes.find((r) => r.id === activeRouteId)
  const point = route?.points.find((p) => p.id === activePointId)
  const usedKinds = new Set(point?.taskTypes.map((t) => t.kind) ?? [])

  useEffect(() => {
    if (open && point) {
      form.setFieldsValue({
        pointName: point.name,
        kind: undefined as unknown as TaskKind,
        latitude: '', longitude: '', km: '',
        localIp: '', anyDesk: '', ztIp: '', note: '',
      })
    }
  }, [open, point, form])

  const handleFinish = (v: FormShape) => {
    if (!activePointId) return
    addTaskType(activeRouteId, activePointId, {
      kind: v.kind,
      pointName: v.pointName,
      latitude: v.latitude,
      longitude: v.longitude,
      km: v.km,
      localIp: v.localIp,
      anyDesk: v.anyDesk,
      ztIp: v.ztIp,
      note: v.note,
    })
    onClose()
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: { contentBg: '#FFFFFF', headerBg: '#FFFFFF', footerBg: '#FFFFFF', colorIcon: '#000', titleColor: '#000' },
        },
      }}
    >
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnHidden
        width={720}
        title={
          <div className='flex items-center gap-2 text-black'>
            <TbNetwork size={22} />
            <span className='font-bold text-lg'>เพิ่มประเภทงาน</span>
          </div>
        }
      >
        <div className='mb-3 flex items-center justify-between rounded-lg px-4 py-3' style={{ background: '#111' }}>
          <span className='text-white font-semibold'>{point?.name ?? ''}</span>
          <span
            className='inline-flex items-center px-3 py-1 rounded-full text-xs'
            style={{ border: '1px solid var(--yellow)', color: 'var(--yellow)' }}
          >
            {route?.code}
          </span>
        </div>

        <Form<FormShape> form={form} layout='vertical' onFinish={handleFinish}>
          <Form.Item
            label={<span className='text-black'>ชื่อจุดติดตั้ง<span className='text-red-500'>*</span></span>}
            name='pointName'
            rules={[{ required: true, message: 'กรุณาระบุชื่อจุดติดตั้ง' }]}
          >
            <Input placeholder='กรุณาระบุชื่อจุดติดตั้ง...' />
          </Form.Item>
          <Form.Item
            label={<span className='text-black'>ประเภทงาน<span className='text-red-500'>*</span></span>}
            name='kind'
            rules={[{ required: true, message: 'กรุณาเลือกประเภทงาน' }]}
          >
            <Select
              placeholder='กรุณาเลือกประเภทงาน...'
              options={KIND_OPTIONS.map((o) => ({
                ...o,
                disabled: usedKinds.has(o.value),
              }))}
            />
          </Form.Item>
          <div className='grid grid-cols-2 gap-4'>
            <Form.Item
              label={<span className='text-black'>Latitude<span className='text-red-500'>*</span></span>}
              name='latitude'
              rules={[{ required: true, message: 'กรุณาระบุ Latitude' }]}
            >
              <Input placeholder='กรุณาระบุ Latitude...' />
            </Form.Item>
            <Form.Item
              label={<span className='text-black'>Longitude<span className='text-red-500'>*</span></span>}
              name='longitude'
              rules={[{ required: true, message: 'กรุณาระบุ Longitude' }]}
            >
              <Input placeholder='กรุณาระบุ Longitude...' />
            </Form.Item>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <Form.Item
              label={<span className='text-black'>กม.ที่<span className='text-red-500'>*</span></span>}
              name='km'
              rules={[{ required: true, message: 'กรุณาระบุ กม.ที่' }]}
            >
              <Input placeholder='กรุณาระบุเลขที่ กม....' />
            </Form.Item>
            <Form.Item label={<span className='text-black'>Local IP Adress</span>} name='localIp'>
              <Input placeholder='กรุณาระบุ Local IP Adress...' />
            </Form.Item>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <Form.Item
              label={<span className='text-black'>Anydesk<span className='text-red-500'>*</span></span>}
              name='anyDesk'
              rules={[{ required: true, message: 'กรุณาระบุ Anydesk' }]}
            >
              <Input placeholder='กรุณาระบุ Anydesk...' />
            </Form.Item>
            <Form.Item label={<span className='text-black'>ZT IP Adress</span>} name='ztIp'>
              <Input placeholder='กรุณาระบุ ZT IP Adress...' />
            </Form.Item>
          </div>
          <Form.Item label={<span className='text-black'>หมายเหตุ</span>} name='note'>
            <Input.TextArea placeholder='กรุณาระบุหมายเหตุ...' rows={2} />
          </Form.Item>
          <div className='flex justify-end gap-2'>
            <Button size='large' shape='round' onClick={onClose}>ยกเลิก</Button>
            <Button
              size='large'
              shape='round'
              htmlType='submit'
              style={{
                background: 'var(--yellow)', color: '#000',
                borderColor: 'var(--yellow)', fontWeight: 700,
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
