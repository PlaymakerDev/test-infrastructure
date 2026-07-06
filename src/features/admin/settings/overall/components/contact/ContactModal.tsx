"use client"
import { Button, ConfigProvider, Form, Input, Modal, Select } from 'antd'
import React, { useEffect } from 'react'
import { TbBuildingSkyscraper } from 'react-icons/tb'
import { MOCK_PROVINCES } from '../../data/mockContractors'
import type { Contractor, ContractorFormValues } from '../../types/contractor'

interface Props {
  open: boolean
  editing: Contractor | null
  onClose: () => void
  onSubmit: (values: ContractorFormValues, editingId: string | null) => void
}

const TAX_ID_PATTERN = /^\d{13}$/

const ContactModal: React.FC<Props> = ({ open, editing, onClose, onSubmit }) => {
  const [form] = Form.useForm<ContractorFormValues>()
  const isEdit = !!editing

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.setFieldsValue({
        companyName: editing.companyName,
        taxId: editing.taxId,
        contactPerson: editing.contactPerson,
        phone: editing.phone,
        email: editing.email,
        address: editing.address,
        province: editing.province,
      })
    } else {
      form.resetFields()
    }
  }, [open, editing, form])

  const handleFinish = (values: ContractorFormValues) => {
    onSubmit(
      {
        companyName: values.companyName.trim(),
        taxId: values.taxId.trim(),
        contactPerson: values.contactPerson.trim(),
        phone: values.phone.trim(),
        email: (values.email || '').trim(),
        address: (values.address || '').trim(),
        province: values.province,
      },
      editing?.id ?? null,
    )
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
            <TbBuildingSkyscraper size={22} />
            <span className='font-bold text-lg'>
              {isEdit ? 'แก้ไขข้อมูลผู้รับจ้าง' : 'เพิ่มผู้รับจ้าง'}
            </span>
          </div>
        }
      >
        <Form<ContractorFormValues> form={form} layout='vertical' onFinish={handleFinish}>
          <Form.Item
            label={<span className='text-black'>ชื่อบริษัท<span className='text-red-500'>*</span></span>}
            name='companyName'
            rules={[{ required: true, message: 'กรุณาระบุชื่อบริษัท' }]}
          >
            <Input placeholder='กรุณาระบุชื่อบริษัท...' />
          </Form.Item>

          <div className='grid grid-cols-2 gap-4'>
            <Form.Item
              label={<span className='text-black'>เลขประจำตัวผู้เสียภาษี<span className='text-red-500'>*</span></span>}
              name='taxId'
              rules={[
                { required: true, message: 'กรุณาระบุเลขประจำตัวผู้เสียภาษี' },
                {
                  pattern: TAX_ID_PATTERN,
                  message: 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก',
                },
              ]}
            >
              <Input maxLength={13} placeholder='เช่น 0105536012345' />
            </Form.Item>
            <Form.Item
              label={<span className='text-black'>จังหวัด<span className='text-red-500'>*</span></span>}
              name='province'
              rules={[{ required: true, message: 'กรุณาเลือกจังหวัด' }]}
            >
              <Select
                showSearch
                placeholder='กรุณาเลือกจังหวัด...'
                options={MOCK_PROVINCES.map((p) => ({ label: p, value: p }))}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <Form.Item
              label={<span className='text-black'>ผู้ติดต่อ<span className='text-red-500'>*</span></span>}
              name='contactPerson'
              rules={[{ required: true, message: 'กรุณาระบุผู้ติดต่อ' }]}
            >
              <Input placeholder='กรุณาระบุชื่อผู้ติดต่อ...' />
            </Form.Item>
            <Form.Item
              label={<span className='text-black'>เบอร์โทรศัพท์<span className='text-red-500'>*</span></span>}
              name='phone'
              rules={[{ required: true, message: 'กรุณาระบุเบอร์โทรศัพท์' }]}
            >
              <Input placeholder='เช่น 02-123-4567' />
            </Form.Item>
          </div>

          <Form.Item
            label={<span className='text-black'>อีเมล</span>}
            name='email'
            rules={[{ type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }]}
          >
            <Input placeholder='เช่น contact@company.co.th' />
          </Form.Item>

          <Form.Item label={<span className='text-black'>ที่อยู่</span>} name='address'>
            <Input.TextArea rows={3} placeholder='กรุณาระบุที่อยู่...' />
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

export default React.memo<Props>(ContactModal)
