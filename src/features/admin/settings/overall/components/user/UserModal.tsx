"use client"
import { Button, ConfigProvider, Form, Input, Modal, Radio, Select } from 'antd'
import React, { useEffect } from 'react'
import { TbUserCog } from 'react-icons/tb'
import { DEPARTMENT_OPTIONS } from '../../data/mockUsers'
import type { User, UserFormValues, UserRole, UserStatus } from '../../types/user'

interface Props {
  open: boolean
  editing: User | null
  onClose: () => void
  onSubmit: (values: UserFormValues, editingId: string | null) => void
}

interface FormShape {
  username: string
  fullName: string
  email: string
  role: UserRole
  department: string
  phone: string
  status: UserStatus
}

const UserModal: React.FC<Props> = ({ open, editing, onClose, onSubmit }) => {
  const [form] = Form.useForm<FormShape>()
  const isEdit = !!editing

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.setFieldsValue({
        username: editing.username,
        fullName: editing.fullName,
        email: editing.email,
        role: editing.role,
        department: editing.department,
        phone: editing.phone,
        status: editing.status,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ role: 'operator', status: 'active' })
    }
  }, [open, editing, form])

  const handleFinish = (values: FormShape) => {
    const payload: UserFormValues = {
      username: values.username.trim(),
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      role: values.role,
      department: values.department,
      phone: (values.phone || '').trim(),
      status: values.status,
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
            <TbUserCog size={22} />
            <span className='font-bold text-lg'>
              {isEdit ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งาน'}
            </span>
          </div>
        }
      >
        <Form<FormShape>
          form={form}
          layout='vertical'
          onFinish={handleFinish}
          initialValues={{ role: 'operator', status: 'active' }}
        >
          <div className='grid grid-cols-2 gap-4'>
            <Form.Item
              label={<span className='text-black'>Username<span className='text-red-500'>*</span></span>}
              name='username'
              rules={[
                { required: true, message: 'กรุณาระบุ Username' },
                { pattern: /^[a-zA-Z0-9._-]+$/, message: 'ใช้ได้เฉพาะ a-z, 0-9, . _ -' },
              ]}
            >
              <Input placeholder='เช่น drr.admin' autoComplete='off' />
            </Form.Item>
            <Form.Item
              label={<span className='text-black'>ชื่อ-นามสกุล<span className='text-red-500'>*</span></span>}
              name='fullName'
              rules={[{ required: true, message: 'กรุณาระบุชื่อ-นามสกุล' }]}
            >
              <Input placeholder='กรุณาระบุชื่อ-นามสกุล...' />
            </Form.Item>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <Form.Item
              label={<span className='text-black'>อีเมล<span className='text-red-500'>*</span></span>}
              name='email'
              rules={[
                { required: true, message: 'กรุณาระบุอีเมล' },
                { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' },
              ]}
            >
              <Input placeholder='name@drr.go.th' autoComplete='off' />
            </Form.Item>
            <Form.Item label={<span className='text-black'>เบอร์โทรศัพท์</span>} name='phone'>
              <Input placeholder='08x-xxx-xxxx' />
            </Form.Item>
          </div>

          <Form.Item
            label={<span className='text-black'>หน่วยงาน<span className='text-red-500'>*</span></span>}
            name='department'
            rules={[{ required: true, message: 'กรุณาเลือกหน่วยงาน' }]}
          >
            <Select
              placeholder='กรุณาเลือกหน่วยงาน...'
              options={DEPARTMENT_OPTIONS.map((d) => ({ label: d, value: d }))}
              showSearch
              optionFilterProp='label'
            />
          </Form.Item>

          <Form.Item
            label={<span className='text-black'>บทบาท<span className='text-red-500'>*</span></span>}
            name='role'
            rules={[{ required: true, message: 'กรุณาเลือกบทบาท' }]}
          >
            <Radio.Group>
              <Radio value='admin'>ผู้ดูแลระบบ</Radio>
              <Radio value='operator'>ผู้ปฏิบัติงาน</Radio>
              <Radio value='viewer'>ผู้ดูข้อมูล</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label={<span className='text-black'>สถานะ<span className='text-red-500'>*</span></span>}
            name='status'
            rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]}
          >
            <Radio.Group>
              <Radio value='active'>ใช้งาน</Radio>
              <Radio value='inactive'>ปิดใช้งาน</Radio>
            </Radio.Group>
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

export default React.memo<Props>(UserModal)
