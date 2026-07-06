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
          Modal: { contentBg: '#FFFFFF', headerBg: '#FFFFFF', footerBg: '#FFFFFF', colorIcon: '#000', titleColor: '#000' },
        },
      }}
    >
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnHidden
        width={560}
        title={
          <div className='flex items-center gap-2 text-black'>
            <TbMapPin size={22} />
            <span className='font-bold text-lg'>{isEdit ? 'แก้ไขจุดติดตั้ง' : 'เพิ่มจุดติดตั้ง'}</span>
          </div>
        }
      >
        <Form<{ name: string }> form={form} layout='vertical' onFinish={handleFinish}>
          <Form.Item
            label={<span className='text-black'>ชื่อจุดติดตั้ง<span className='text-red-500'>*</span></span>}
            name='name'
            rules={[{ required: true, message: 'กรุณาระบุชื่อจุดติดตั้ง' }]}
          >
            <Input placeholder='กรุณาระบุชื่อจุดติดตั้ง...' />
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

export default React.memo<Props>(AddPointModal)
