"use client"
import { Button, ConfigProvider, Form, Input, Modal } from 'antd'
import React, { useEffect } from 'react'
import { TbMapPin } from 'react-icons/tb'
import { useProjectDetailContext } from '../../context'

interface Props {
  open: boolean
  onClose: () => void
  editingPointId: string | null
}

const AddPointModal: React.FC<Props> = ({ open, onClose, editingPointId }) => {
  const { project, activeRouteId, addPoint, updatePoint } = useProjectDetailContext()
  const [form] = Form.useForm<{ name: string }>()

  const route = project.routes.find((r) => r.id === activeRouteId)
  const editing = route?.points.find((p) => p.id === editingPointId) ?? null
  const isEdit = !!editing

  useEffect(() => {
    if (!open) return
    if (editing) form.setFieldsValue({ name: editing.name })
    else {
      const nextIndex = (route?.points.length ?? 0) + 1
      form.setFieldsValue({ name: `จุดติดตั้งที่ ${nextIndex}` })
    }
  }, [open, editing, form, route])

  const handleFinish = (v: { name: string }) => {
    if (isEdit) updatePoint(activeRouteId, editing!.id, v.name)
    else addPoint(activeRouteId, v.name)
    onClose()
  }

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
        width={560}
        closable={{ 'aria-label': 'Custom Close Button' }}
        styles={{ container: { padding: '32px 40px', borderRadius: 16 }, mask: { background: 'rgba(0,0,0,0.55)' } }}
        title={
          <div className='flex items-center gap-3' style={{ color: '#111' }}>
            <TbMapPin size={22} style={{ color: 'var(--yellow)' }} />
            <span style={{ fontSize: 20, fontWeight: 600, color: '#111' }}>{isEdit ? 'แก้ไขจุดติดตั้ง' : 'เพิ่มจุดติดตั้ง'}</span>
          </div>
        }
      >
        <Form<{ name: string }> form={form} layout='vertical' onFinish={handleFinish} requiredMark={false}>
          <Form.Item
            label={<span style={{ color: '#1F1F1F', fontSize: 14, fontWeight: 500 }}>ชื่อจุดติดตั้ง<span style={{ color: '#FF3B3B', marginLeft: 2 }}>*</span></span>}
            name='name'
            rules={[{ required: true, message: 'กรุณาระบุชื่อจุดติดตั้ง' }]}
          >
            <Input placeholder='กรุณาระบุชื่อจุดติดตั้ง...' />
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

export default React.memo<Props>(AddPointModal)
