"use client"
import { Button, ConfigProvider, Form, Input, Modal } from 'antd'
import React, { useEffect } from 'react'
import { TbInfoCircle, TbKey } from 'react-icons/tb'
import type { User } from '../../types/user'

interface Props {
  open: boolean
  user: User | null
  submitting?: boolean
  onClose: () => void
  onConfirm: (id: string, password: string) => void
}

interface FormShape {
  password: string
  confirm: string
}

// Figma design spec — mirrored here so tweaks stay colocated with JSX.
const RED_ASTERISK = '#FF3B3B'
const LABEL_COLOR = '#1F1F1F'
const BORDER_DEFAULT = '#E5E5E5'
const BORDER_FOCUS = '#FCD116'
const PLACEHOLDER = '#B8B8B8'
const CANCEL_BG = '#E5E5E5'
const CANCEL_TEXT = '#4A4A4A'
const CONFIRM_BG = '#FCD116'
const CONFIRM_TEXT = '#1A1A1A'

// LDAP guard card — orange/red palette lifted from AntD's "warning" tone so
// it's clearly not-actionable without being an outright error state.
const LDAP_WARN_BG = '#FFF4E5'
const LDAP_WARN_BORDER = '#FFB020'
const LDAP_WARN_ICON = '#D97706'
const LDAP_WARN_TEXT = '#8A4B00'
const LDAP_WARN_COPY =
  'ผู้ใช้ประเภท LDAP ไม่สามารถเปลี่ยนรหัสผ่านที่นี่ได้ — กรุณาแก้ไขที่ Active Directory (AD)'

const Asterisk: React.FC = () => (
  <span style={{ color: RED_ASTERISK, marginLeft: 2 }}>*</span>
)

/** Admin-side password reset — thin wrapper around
 *  PATCH /manage/general_user/{user_id}/password. Kept in its own modal so
 *  the edit dialog stays focused on profile fields (username/name/role/department). */
const ChangePasswordModal: React.FC<Props> = ({ open, user, submitting, onClose, onConfirm }) => {
  const [form] = Form.useForm<FormShape>()
  const isSubmitting = !!submitting
  // LDAP users' passwords live in Active Directory — the PATCH SSO endpoint
  // rejects them server-side, so we short-circuit the form entirely and show
  // a read-only info card instead of surfacing an error after submit.
  const isLdap = !!user?.isLdap

  useEffect(() => {
    if (open) form.resetFields()
  }, [open, form])

  const handleFinish = ({ password }: FormShape) => {
    if (!user || isLdap) return
    onConfirm(user.id, password)
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: LABEL_COLOR,
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            footerBg: '#FFFFFF',
            titleColor: '#111111',
            borderRadiusLG: 16,
          },
          Form: { labelColor: LABEL_COLOR },
          Input: {
            colorTextPlaceholder: PLACEHOLDER,
            colorBorder: BORDER_DEFAULT,
            activeBorderColor: BORDER_FOCUS,
            hoverBorderColor: BORDER_FOCUS,
            controlHeight: 44,
            borderRadius: 8,
            paddingInline: 14,
            colorText: LABEL_COLOR,
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
        width={520}
        closable={{ 'aria-label': 'Custom Close Button' }}
        mask={{ closable: !isSubmitting }}
        styles={{
          mask: { background: 'rgba(0,0,0,0.55)' },
          container: { padding: '32px 40px', borderRadius: 16 },
          header: { marginBottom: 20 },
        }}
        title={
          <div className='flex items-center' style={{ gap: 12 }}>
            <TbKey size={20} color={CONFIRM_BG} />
            <span style={{ color: '#111', fontSize: 20, fontWeight: 600 }}>
              เปลี่ยนรหัสผ่านผู้ใช้งาน
            </span>
          </div>
        }
      >
        {user && (
          <div className='mb-4 text-sm'>
            <div style={{ color: '#6B6B6B' }}>
              Username : <span style={{ color: LABEL_COLOR, fontWeight: 500 }}>{user.username}</span>
            </div>
            <div style={{ color: '#6B6B6B' }}>
              ชื่อ-นามสกุล :{' '}
              <span style={{ color: LABEL_COLOR, fontWeight: 500 }}>{user.fullName || '-'}</span>
            </div>
          </div>
        )}
        {isLdap ? (
          <>
            <div
              role='alert'
              className='flex items-start'
              style={{
                gap: 12,
                padding: '14px 16px',
                marginBottom: 20,
                background: LDAP_WARN_BG,
                border: `1px solid ${LDAP_WARN_BORDER}`,
                borderRadius: 10,
              }}
            >
              <TbInfoCircle size={20} color={LDAP_WARN_ICON} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ color: LDAP_WARN_TEXT, fontSize: 14, lineHeight: 1.55 }}>
                {LDAP_WARN_COPY}
              </span>
            </div>
            <div className='flex justify-end' style={{ marginTop: 8 }}>
              <Button
                shape='round'
                onClick={onClose}
                style={{
                  background: CONFIRM_BG,
                  color: CONFIRM_TEXT,
                  borderColor: CONFIRM_BG,
                  fontWeight: 600,
                  padding: '10px 32px',
                  height: 'auto',
                }}
              >
                รับทราบ
              </Button>
            </div>
          </>
        ) : (
          <Form<FormShape>
            form={form}
            layout='vertical'
            onFinish={handleFinish}
            disabled={isSubmitting}
          >
            <Form.Item
              label={
                <span style={{ color: LABEL_COLOR, fontSize: 14, fontWeight: 500 }}>
                  รหัสผ่านใหม่<Asterisk />
                </span>
              }
              name='password'
              rules={[
                { required: true, message: 'กรุณาระบุรหัสผ่านใหม่' },
                { min: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' },
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input.Password placeholder='รหัสผ่านใหม่' autoComplete='new-password' />
            </Form.Item>
            <Form.Item
              label={
                <span style={{ color: LABEL_COLOR, fontSize: 14, fontWeight: 500 }}>
                  ยืนยันรหัสผ่านใหม่<Asterisk />
                </span>
              }
              name='confirm'
              dependencies={['password']}
              rules={[
                { required: true, message: 'กรุณายืนยันรหัสผ่านใหม่' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve()
                    return Promise.reject(new Error('รหัสผ่านไม่ตรงกัน'))
                  },
                }),
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input.Password placeholder='ยืนยันรหัสผ่านใหม่' autoComplete='new-password' />
            </Form.Item>

            <div className='flex justify-end' style={{ gap: 12, marginTop: 8 }}>
              <Button
                shape='round'
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  background: CANCEL_BG,
                  color: CANCEL_TEXT,
                  borderColor: CANCEL_BG,
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
                style={{
                  background: CONFIRM_BG,
                  color: CONFIRM_TEXT,
                  borderColor: CONFIRM_BG,
                  fontWeight: 600,
                  padding: '10px 32px',
                  height: 'auto',
                }}
              >
                ยืนยัน
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ChangePasswordModal)
