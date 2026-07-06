"use client"
import { Button, ConfigProvider, Form, Input, InputNumber, Modal, Select } from 'antd'
import React, { useEffect } from 'react'
import { TbRoad } from 'react-icons/tb'
import { MOCK_ROUTE_OFFICES, MOCK_ROUTE_PROVINCES } from '../../data/mockRoutes'
import type { Route, RouteFormValues } from '../../types/route'

interface Props {
  open: boolean
  editing: Route | null
  onClose: () => void
  onSubmit: (values: RouteFormValues, editingId: string | null) => void
}

interface FormShape {
  code: string
  name: string
  province: string
  district: string
  lengthKm: number | null
  responsibleOffice: string
}

const RouteModal: React.FC<Props> = ({ open, editing, onClose, onSubmit }) => {
  const [form] = Form.useForm<FormShape>()
  const isEdit = !!editing

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.setFieldsValue({
        code: editing.code,
        name: editing.name,
        province: editing.province,
        district: editing.district,
        lengthKm: editing.lengthKm,
        responsibleOffice: editing.responsibleOffice,
      })
    } else {
      form.resetFields()
    }
  }, [open, editing, form])

  const handleFinish = (values: FormShape) => {
    const payload: RouteFormValues = {
      code: values.code.trim(),
      name: values.name.trim(),
      province: values.province,
      district: values.district?.trim() ?? '',
      lengthKm: values.lengthKm ?? null,
      responsibleOffice: values.responsibleOffice,
    }
    onSubmit(payload, editing?.id ?? null)
    onClose()
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#000000',
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            footerBg: '#FFFFFF',
            titleColor: '#000000',
          },
          Form: { labelColor: '#000000' },
          Input: { colorTextPlaceholder: '#B0B0B0' },
          InputNumber: { colorTextPlaceholder: '#B0B0B0' },
          Select: { colorTextPlaceholder: '#B0B0B0' },
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
            <TbRoad size={22} />
            <span className='font-bold text-lg'>
              {isEdit ? 'แก้ไขข้อมูลสายทาง' : 'เพิ่มข้อมูลสายทาง'}
            </span>
          </div>
        }
      >
        <Form<FormShape> form={form} layout='vertical' onFinish={handleFinish}>
          <div className='grid grid-cols-2 gap-4'>
            <Form.Item
              label={
                <span className='text-black'>
                  รหัสสายทาง<span className='text-red-500'>*</span>
                </span>
              }
              name='code'
              rules={[{ required: true, message: 'กรุณาระบุรหัสสายทาง' }]}
            >
              <Input placeholder='เช่น ขก.1027' />
            </Form.Item>
            <Form.Item
              label={
                <span className='text-black'>
                  จังหวัด<span className='text-red-500'>*</span>
                </span>
              }
              name='province'
              rules={[{ required: true, message: 'กรุณาเลือกจังหวัด' }]}
            >
              <Select
                showSearch
                placeholder='กรุณาเลือกจังหวัด...'
                options={MOCK_ROUTE_PROVINCES.map((p) => ({ label: p, value: p }))}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </div>

          <Form.Item
            label={
              <span className='text-black'>
                ชื่อสายทาง<span className='text-red-500'>*</span>
              </span>
            }
            name='name'
            rules={[{ required: true, message: 'กรุณาระบุชื่อสายทาง' }]}
          >
            <Input placeholder='กรุณาระบุชื่อสายทาง...' />
          </Form.Item>

          <div className='grid grid-cols-2 gap-4'>
            <Form.Item label={<span className='text-black'>อำเภอ</span>} name='district'>
              <Input placeholder='กรุณาระบุอำเภอ...' />
            </Form.Item>
            <Form.Item label={<span className='text-black'>ระยะทาง (กม.)</span>} name='lengthKm'>
              <InputNumber
                className='w-full'
                placeholder='กรุณาระบุระยะทาง...'
                min={0}
                step={0.01}
                stringMode={false}
              />
            </Form.Item>
          </div>

          <Form.Item
            label={
              <span className='text-black'>
                หน่วยงานรับผิดชอบ<span className='text-red-500'>*</span>
              </span>
            }
            name='responsibleOffice'
            rules={[{ required: true, message: 'กรุณาเลือกหน่วยงานรับผิดชอบ' }]}
          >
            <Select
              showSearch
              placeholder='กรุณาเลือกหน่วยงานรับผิดชอบ...'
              options={MOCK_ROUTE_OFFICES.map((o) => ({ label: o, value: o }))}
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <div className='flex justify-end gap-2 mt-2'>
            <Button size='large' shape='round' onClick={onClose}>
              ยกเลิก
            </Button>
            <Button
              size='large'
              shape='round'
              htmlType='submit'
              style={{
                background: 'var(--yellow)',
                color: '#000',
                borderColor: 'var(--yellow)',
                fontWeight: 700,
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

export default React.memo<Props>(RouteModal)
