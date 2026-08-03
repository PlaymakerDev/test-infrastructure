"use client"
import { Button, ConfigProvider, Form, Input, Modal } from 'antd'
import React, { useEffect } from 'react'
import { TbMapPin } from 'react-icons/tb'
import { useProjectDetailContext } from '../../context'

interface Props {
  open: boolean
  onClose: () => void
  /** tbl_solution_location.id — null on create. */
  editingPointId: number | null
}

/** Add / rename an installation point (tbl_solution_location) on the
 *  currently-active route. Submits via the shared context. */
const AddPointModal: React.FC<Props> = ({ open, onClose, editingPointId }) => {
  const { activeRoute, activePoint, addPoint, updatePoint, isSubmitting } =
    useProjectDetailContext()
  const [form] = Form.useForm<{ name: string }>()

  const editing = editingPointId != null ? activePoint : null
  const isEdit = editing != null && editingPointId === activePoint?.id

  useEffect(() => {
    if (!open) return
    if (isEdit) {
      form.setFieldsValue({ name: editing!.name })
    } else {
      const nextIndex = (activeRoute?.points.length ?? 0) + 1
      form.setFieldsValue({ name: `จุดติดตั้งที่ ${nextIndex}` })
    }
  }, [open, isEdit, editing, form, activeRoute])

  const handleFinish = async (v: { name: string }) => {
    try {
      if (isEdit && editing) {
        await updatePoint(editing.id, v.name.trim())
      } else if (activeRoute) {
        await addPoint(activeRoute.projectRoadId, v.name.trim())
      }
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
          Form: { labelColor: '#1F1F1F', labelfontSize: "var(--fs-12)" },
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
        width={560}
        closable={{ 'aria-label': 'Custom Close Button' }}
        styles={{ container: { padding: '32px 40px', borderRadius: 16 }, mask: { background: 'rgba(0,0,0,0.55)' } }}
        title={
          <div className='flex items-center gap-3' style={{ color: '#111' }}>
            <TbMapPin size={22} style={{ color: 'var(--yellow)' }} />
            <span style={{ fontSize: 20, fontWeight: 600, color: '#111' }}>
              {isEdit ? 'แก้ไขจุดติดตั้ง' : 'เพิ่มจุดติดตั้ง'}
            </span>
          </div>
        }
      >
        <Form<{ name: string }>
          form={form}
          layout='vertical'
          onFinish={handleFinish}
          requiredMark={false}
          disabled={isSubmitting}
        >
          <Form.Item
            label={
              <span style={{ color: '#1F1F1F', fontSize: "var(--fs-12)", fontWeight: 500 }}>
                ชื่อจุดติดตั้ง<span style={{ color: '#FF3B3B', marginLeft: 2 }}>*</span>
              </span>
            }
            name='name'
            rules={[
              { required: true, message: 'กรุณาระบุชื่อจุดติดตั้ง' },
              {
                validator: async (_, v: string) =>
                  (v ?? '').trim().length > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error('กรุณาระบุชื่อจุดติดตั้ง')),
              },
            ]}
          >
            <Input placeholder='กรุณาระบุชื่อจุดติดตั้ง...' />
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

export default React.memo<Props>(AddPointModal)
