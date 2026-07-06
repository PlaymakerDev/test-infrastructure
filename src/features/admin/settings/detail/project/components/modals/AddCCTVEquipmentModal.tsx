"use client"
import { Button, ConfigProvider, Form, Input, Modal } from 'antd'
import React, { useEffect } from 'react'
import { TbDeviceCctv } from 'react-icons/tb'
import { useProjectDetailContext } from '../../context'

interface Props {
  open: boolean
  taskId: string | null
  onClose: () => void
}

interface FormShape {
  name: string
  km: string
  ipAddress: string
  hlsUrl: string
  latitude: string
  longitude: string
  note: string
}

const AddCCTVEquipmentModal: React.FC<Props> = ({ open, taskId, onClose }) => {
  const { addEquipment, activeRouteId, activePointId, project } = useProjectDetailContext()
  const [form] = Form.useForm<FormShape>()

  const route = project.routes.find((r) => r.id === activeRouteId)
  const point = route?.points.find((p) => p.id === activePointId)

  useEffect(() => {
    if (open) form.resetFields()
  }, [open, form])

  const handleFinish = (v: FormShape) => {
    if (!taskId || !activePointId) return
    addEquipment(activeRouteId, activePointId, taskId, {
      name: v.name,
      km: v.km,
      ipAddress: v.ipAddress,
      hlsUrl: v.hlsUrl,
      latitude: v.latitude,
      longitude: v.longitude,
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
            <TbDeviceCctv size={22} />
            <span className='font-bold text-lg'>เพิ่มข้อมูลอุปกรณ์</span>
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
            label={<span className='text-black'>ชื่อกล้อง<span className='text-red-500'>*</span></span>}
            name='name'
            rules={[{ required: true, message: 'กรุณาระบุชื่อกล้อง' }]}
          >
            <Input placeholder='กรุณาระบุชื่อกล้อง(รายละเอียดการติดตั้ง)...' />
          </Form.Item>
          <div className='grid grid-cols-2 gap-4'>
            <Form.Item
              label={<span className='text-black'>กม.ที่<span className='text-red-500'>*</span></span>}
              name='km'
              rules={[{ required: true, message: 'กรุณาระบุ กม.ที่' }]}
            >
              <Input placeholder='กรุณาระบุเลขที่ กม....' />
            </Form.Item>
            <Form.Item label={<span className='text-black'>IP Adress</span>} name='ipAddress'>
              <Input placeholder='กรุณาระบุ IP Adress...' />
            </Form.Item>
          </div>
          <Form.Item
            label={<span className='text-black'>URL HLS (.m3u8)<span className='text-red-500'>*</span></span>}
            name='hlsUrl'
            rules={[{ required: true, message: 'กรุณาระบุ URL HLS' }]}
          >
            <Input placeholder='กรุณาระบุ URL HLS (.m3u8)...' />
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

export default React.memo<Props>(AddCCTVEquipmentModal)
