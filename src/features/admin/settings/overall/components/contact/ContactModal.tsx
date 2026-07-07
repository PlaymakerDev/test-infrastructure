"use client"
import { Button, ConfigProvider, Form, Input, Modal } from 'antd'
import React, { useEffect } from 'react'
import { TbBuildingSkyscraper } from 'react-icons/tb'
import type { Contractor, ContractorFormValues } from '../../types/contractor'

interface Props {
  open: boolean
  editing: Contractor | null
  submitting?: boolean
  onClose: () => void
  onSubmit: (values: ContractorFormValues, editingId: string | null) => void
}

/** Figma design tokens for the white "add/edit" modal — kept in one const so
 *  every field, label, and control stays visually aligned with frame 2. */
const TOKENS = {
  label: '#1F1F1F',
  asterisk: '#FF3B3B',
  border: '#E5E5E5',
  borderFocus: '#FCD116',
  placeholder: '#B8B8B8',
  title: '#111111',
  cancelBg: '#E5E5E5',
  cancelText: '#4A4A4A',
  confirmBg: '#FCD116',
  confirmText: '#1A1A1A',
} as const

const requiredLabel = (text: string) => (
  <span style={{ color: TOKENS.label, fontSize: 14, fontWeight: 500 }}>
    {text}
    <span style={{ color: TOKENS.asterisk, marginLeft: 2 }}>*</span>
  </span>
)

const plainLabel = (text: string) => (
  <span style={{ color: TOKENS.label, fontSize: 14, fontWeight: 500 }}>{text}</span>
)

/** Fields mirror the real /manage/contractor request bodies:
 *   - create requires: company_name, short_name, password
 *   - update requires: company_name, short_name (password optional; sent
 *     only when the operator explicitly types a new one).
 *  taxId / email / province from the mock UI were dropped — the backend has
 *  no columns for them. */
const ContactModal: React.FC<Props> = ({ open, editing, submitting, onClose, onSubmit }) => {
  const [form] = Form.useForm<ContractorFormValues>()
  const isEdit = !!editing

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.setFieldsValue({
        companyName: editing.companyName,
        shortName: editing.shortName,
        contactPerson: editing.contactPerson,
        phone: editing.phone,
        address: editing.address,
        role: editing.role,
        // Password intentionally blank on edit — the API keeps the existing
        // password when this field is omitted.
        password: '',
      })
    } else {
      form.resetFields()
    }
  }, [open, editing, form])

  const handleFinish = (values: ContractorFormValues) => {
    onSubmit(values, editing?.id ?? null)
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBorder: TOKENS.border,
          colorPrimary: TOKENS.borderFocus,
          colorTextPlaceholder: TOKENS.placeholder,
          borderRadius: 8,
        },
        components: {
          Modal: {
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            footerBg: '#FFFFFF',
            titleColor: TOKENS.title,
            borderRadiusLG: 16,
            paddingContentHorizontalLG: 40,
            paddingLG: 32,
          },
          Form: { labelColor: TOKENS.label, itemMarginBottom: 16 },
          Input: {
            colorTextPlaceholder: TOKENS.placeholder,
            borderRadius: 8,
            controlHeight: 44,
            paddingInline: 14,
            activeBorderColor: TOKENS.borderFocus,
            hoverBorderColor: TOKENS.borderFocus,
          },
          Select: {
            colorTextPlaceholder: TOKENS.placeholder,
            borderRadius: 8,
            controlHeight: 44,
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
        mask={{ closable: !submitting }}
        keyboard={!submitting}
        styles={{ mask: { background: 'rgba(0,0,0,0.55)' } }}
        title={
          <div className='flex items-center' style={{ gap: 12 }}>
            <TbBuildingSkyscraper size={22} color={TOKENS.borderFocus} />
            <span
              style={{
                color: TOKENS.title,
                fontSize: 20,
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {isEdit ? 'แก้ไขข้อมูลผู้รับจ้าง' : 'เพิ่มผู้รับจ้าง'}
            </span>
          </div>
        }
      >
        {isEdit && editing?.username ? (
          <div
            className='mb-4 rounded-lg px-3 py-2 text-xs'
            style={{ background: '#F3F4F6', color: '#374151' }}
          >
            บัญชีผู้ใช้ (username):{' '}
            <span className='font-semibold' style={{ color: TOKENS.title }}>
              {editing.username}
            </span>
          </div>
        ) : null}

        <Form<ContractorFormValues>
          form={form}
          layout='vertical'
          onFinish={handleFinish}
          disabled={submitting}
          requiredMark={false}
        >
          <Form.Item
            label={requiredLabel('ชื่อบริษัท')}
            name='companyName'
            rules={[{ required: true, message: 'กรุณาระบุชื่อบริษัท' }]}
          >
            <Input placeholder='กรุณาระบุชื่อบริษัท...' />
          </Form.Item>

          <div className='grid grid-cols-2' style={{ gap: 20 }}>
            <Form.Item
              label={requiredLabel('ชื่อย่อ')}
              name='shortName'
              rules={[{ required: true, message: 'กรุณาระบุชื่อย่อ' }]}
            >
              <Input placeholder='เช่น TPS' />
            </Form.Item>
            <Form.Item label={plainLabel('ตำแหน่ง / บทบาท')} name='role'>
              <Input placeholder='เช่น ผู้จัดการโครงการ' />
            </Form.Item>
          </div>

          <div className='grid grid-cols-2' style={{ gap: 20 }}>
            <Form.Item label={plainLabel('ผู้ติดต่อ')} name='contactPerson'>
              <Input placeholder='กรุณาระบุชื่อผู้ติดต่อ...' />
            </Form.Item>
            <Form.Item label={plainLabel('เบอร์โทรศัพท์')} name='phone'>
              <Input placeholder='เช่น 02-123-4567' />
            </Form.Item>
          </div>

          <Form.Item label={plainLabel('ที่อยู่')} name='address'>
            <Input.TextArea rows={3} placeholder='กรุณาระบุที่อยู่...' />
          </Form.Item>

          <Form.Item
            label={
              <span style={{ color: TOKENS.label, fontSize: 14, fontWeight: 500 }}>
                รหัสผ่าน
                {isEdit ? (
                  <span style={{ color: '#8A8A8A', fontSize: 12, marginLeft: 6 }}>
                    (เว้นว่างหากไม่ต้องการเปลี่ยน)
                  </span>
                ) : (
                  <span style={{ color: TOKENS.asterisk, marginLeft: 2 }}>*</span>
                )}
              </span>
            }
            name='password'
            rules={
              isEdit
                ? []
                : [{ required: true, message: 'กรุณาระบุรหัสผ่านสำหรับเข้าใช้งาน' }]
            }
          >
            <Input.Password
              placeholder={isEdit ? 'ปล่อยว่างเพื่อคงรหัสผ่านเดิม' : 'กรุณาระบุรหัสผ่าน...'}
              autoComplete='new-password'
            />
          </Form.Item>

          <div className='flex justify-end mt-2' style={{ gap: 12 }}>
            <Button
              onClick={onClose}
              disabled={submitting}
              style={{
                background: TOKENS.cancelBg,
                color: TOKENS.cancelText,
                border: 'none',
                borderRadius: 999,
                padding: '10px 28px',
                height: 'auto',
                fontWeight: 500,
              }}
            >
              ยกเลิก
            </Button>
            <Button
              htmlType='submit'
              loading={submitting}
              // Form's `disabled` prop above cascades to buttons via context —
              // explicitly keep the submit control enabled so the loading
              // spinner is visible and the click still fires validation.
              disabled={false}
              style={{
                background: TOKENS.confirmBg,
                color: TOKENS.confirmText,
                border: 'none',
                borderRadius: 999,
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

export default React.memo<Props>(ContactModal)
