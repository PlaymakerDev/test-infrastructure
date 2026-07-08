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

  const labelReq = (t: string) => (
    <span style={{ color: '#1F1F1F', fontSize: 14, fontWeight: 500 }}>
      {t}<span style={{ color: '#FF3B3B', marginLeft: 2 }}>*</span>
    </span>
  )
  const labelOpt = (t: string) => (
    <span style={{ color: '#1F1F1F', fontSize: 14, fontWeight: 500 }}>{t}</span>
  )

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: { contentBg: '#FFFFFF', headerBg: '#FFFFFF', footerBg: '#FFFFFF', colorIcon: '#000', titleColor: '#1F1F1F', borderRadiusLG: 16 },
          Form: { labelColor: '#1F1F1F', labelFontSize: 14 },
          Input: { colorBorder: '#E5E5E5', activeBorderColor: '#FCD116', hoverBorderColor: '#FCD116', colorTextPlaceholder: '#B8B8B8', borderRadius: 8, controlHeight: 44, paddingInline: 14 },
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
            <TbDeviceCctv size={22} style={{ color: '#66AEFF' }} />
            <span style={{ fontSize: 20, fontWeight: 600, color: '#111' }}>เพิ่มข้อมูลอุปกรณ์</span>
          </div>
        }
      >
        <div
          className='mb-5 flex items-center justify-between'
          style={{ background: '#111111', borderRadius: 10, padding: '14px 20px' }}
        >
          <span style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 600 }}>{point?.name ?? ''}</span>
          <span
            className='inline-flex items-center'
            style={{ border: '1px solid #FCD116', color: '#FCD116', background: 'transparent', borderRadius: 999, padding: '4px 14px', fontSize: 13 }}
          >
            {route?.code}
          </span>
        </div>

        <Form<FormShape> form={form} layout='vertical' onFinish={handleFinish} requiredMark={false}>
          <Form.Item
            label={labelReq('ชื่อกล้อง')}
            name='name'
            rules={[{ required: true, message: 'กรุณาระบุชื่อกล้อง' }]}
          >
            <Input placeholder='กรุณาระบุชื่อกล้อง(รายละเอียดการติดตั้ง)...' />
          </Form.Item>
          <div className='grid grid-cols-2 gap-5'>
            <Form.Item
              label={labelReq('กม.ที่')}
              name='km'
              rules={[{ required: true, message: 'กรุณาระบุ กม.ที่' }]}
            >
              <Input placeholder='กรุณาระบุเลขที่ กม....' />
            </Form.Item>
            <Form.Item label={labelOpt('IP Adress')} name='ipAddress'>
              <Input placeholder='กรุณาระบุ IP Adress...' />
            </Form.Item>
          </div>
          <Form.Item
            label={labelReq('URL HLS (.m3u8)')}
            name='hlsUrl'
            rules={[{ required: true, message: 'กรุณาระบุ URL HLS' }]}
          >
            <Input placeholder='กรุณาระบุ URL HLS (.m3u8)...' />
          </Form.Item>
          <div className='grid grid-cols-2 gap-5'>
            <Form.Item
              label={labelReq('Latitude')}
              name='latitude'
              rules={[{ required: true, message: 'กรุณาระบุ Latitude' }]}
            >
              <Input placeholder='กรุณาระบุ Latitude...' />
            </Form.Item>
            <Form.Item
              label={labelReq('Longitude')}
              name='longitude'
              rules={[{ required: true, message: 'กรุณาระบุ Longitude' }]}
            >
              <Input placeholder='กรุณาระบุ Longitude...' />
            </Form.Item>
          </div>
          <Form.Item label={labelOpt('หมายเหตุ')} name='note'>
            <Input.TextArea placeholder='กรุณาระบุหมายเหตุ...' rows={2} />
          </Form.Item>
          <div className='flex justify-end gap-3 mt-2'>
            <Button
              shape='round'
              onClick={onClose}
              style={{ background: '#E5E5E5', color: '#4A4A4A', borderColor: '#E5E5E5', padding: '10px 28px', height: 'auto', fontWeight: 500 }}
            >
              ยกเลิก
            </Button>
            <Button
              shape='round'
              htmlType='submit'
              style={{ background: '#FCD116', color: '#1A1A1A', borderColor: '#FCD116', padding: '10px 32px', height: 'auto', fontWeight: 600 }}
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
