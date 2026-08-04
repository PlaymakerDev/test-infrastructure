"use client"
import { Button, ConfigProvider, Form, Input, Modal, Radio, Select } from 'antd'
import React, { useEffect, useMemo } from 'react'
import { TbUserCog } from 'react-icons/tb'
import { useDepartments } from '@/hooks/queries/manage'
import type { APIResponseSSOUser } from '@/types/manage/sso-search-api'
import type { User, UserFormValues } from '../../types/user'

interface Props {
  open: boolean
  editing: User | null
  submitting?: boolean
  onClose: () => void
  onSubmit: (values: UserFormValues, editing: User | null) => void
  /** Opens the "change password" sub-modal from within the edit dialog.
   *  Passed through instead of hard-wired so UserSection stays the single
   *  owner of that modal's open state. */
  onChangePassword?: (user: User) => void
  /** Which sub-tab opened this modal — decides title copy, password field
   *  visibility, username hint copy, and the `isLdap` flag on submit.
   *  Defaults to 'local' so any callsite that hasn't been updated yet keeps
   *  behaving exactly as before this prop was added. */
  mode?: 'local' | 'ldap'
  /** AD user picked in LDAPSearchModal, forwarded here to seed the create
   *  form. Only consulted for `mode === 'ldap' && !isEdit`. Null in every
   *  other flow (Local create, LDAP edit, Local edit). */
  prefill?: APIResponseSSOUser | null
}

interface FormShape {
  username: string
  firstName: string
  lastName: string
  role: string
  departmentId: number | null
  password?: string
}

// Figma design spec — kept alongside JSX so the intent is discoverable when
// tweaking styles later. Hex values are mirrored verbatim from the spec brief.
const RED_ASTERISK = '#FF3B3B'
const LABEL_COLOR = '#1F1F1F'
const BORDER_DEFAULT = '#E5E5E5'
const BORDER_FOCUS = '#FCD116'
const PLACEHOLDER = '#B8B8B8'
const CANCEL_BG = '#E5E5E5'
const CANCEL_TEXT = '#4A4A4A'
const CONFIRM_BG = '#FCD116'
const CONFIRM_TEXT = '#1A1A1A'

const Asterisk: React.FC = () => (
  <span style={{ color: RED_ASTERISK, marginLeft: 2 }}>*</span>
)

const LDAP_BADGE_BG = '#66AEFF'
const LOCAL_BADGE_BG = '#E5E5E5'
const LOCAL_BADGE_TEXT = '#4A4A4A'

const UserModal: React.FC<Props> = ({
  open,
  editing,
  submitting,
  onClose,
  onSubmit,
  onChangePassword,
  mode = 'local',
  prefill = null,
}) => {
  const [form] = Form.useForm<FormShape>()
  const isEdit = !!editing
  const isSubmitting = !!submitting
  const isLdapMode = mode === 'ldap'
  // For "edit" the mode prop tells us which sub-tab launched the modal, but
  // the source of truth for whether *this* user is AD-linked is the row
  // itself. Fall back to mode when creating (no row yet).
  const editingIsLdap = isEdit ? !!editing?.isLdap : isLdapMode

  const { data: departments, isLoading: departmentsLoading } = useDepartments()

  const departmentOptions = useMemo(() => {
    const opts = (departments ?? []).map((d) => ({
      label: d.department_short_name || d.department_name,
      value: d.id,
    }))
    // Fallback: if the editing user's departmentId isn't in the fetched list
    // (async race, deleted FK, or missing short_name), inject a synthetic
    // option so the Select still renders the stored value instead of blanking.
    if (editing?.departmentId != null && !opts.some((o) => o.value === editing.departmentId)) {
      opts.push({ label: `#${editing.departmentId}`, value: editing.departmentId })
    }
    return opts
  }, [departments, editing])

  // See RouteModal for the rationale — initialValues + key on Form guarantees
  // the value lands on Select fields at mount, avoiding the showSearch race
  // where post-mount setFieldsValue can be swallowed.
  const initialValues = useMemo<Partial<FormShape>>(() => {
    if (editing) {
      return {
        username: editing.username,
        firstName: editing.firstName,
        lastName: editing.lastName,
        role: editing.role || 'user',
        departmentId: editing.departmentId,
      }
    }
    // LDAP create seeded from the AD row picked in LDAPSearchModal.
    // departmentId stays undefined so the admin has to pick one.
    if (isLdapMode && prefill) {
      return {
        username: prefill.Username,
        firstName: prefill.FirstName,
        lastName: prefill.LastName,
        role: 'user',
        departmentId: undefined,
      }
    }
    return { role: 'user' }
  }, [editing, isLdapMode, prefill])

  useEffect(() => {
    if (!open) return
    if (editing) form.setFieldsValue(initialValues)
    else {
      form.resetFields()
      form.setFieldsValue(initialValues)
    }
  }, [open, editing, form, initialValues])

  const handleFinish = (values: FormShape) => {
    if (values.departmentId == null) return
    const payload: UserFormValues = {
      username: values.username.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      role: values.role,
      departmentId: values.departmentId,
      // Password is only meaningful on create AND for local users — LDAP
      // accounts authenticate through AD, so the field isn't rendered and
      // no password ever reaches the POST payload. Edit flow always uses
      // the dedicated PATCH /general_user/{id}/password modal instead.
      password: !isEdit && !isLdapMode ? values.password?.trim() || undefined : undefined,
      // Persist which auth mode created/opened this form. For edits we
      // preserve the row's existing flag (server rejects changing `is_ldap`
      // on PUT anyway), for creates we tag it from the active sub-tab.
      isLdap: isEdit ? !!editing?.isLdap : isLdapMode,
    }
    onSubmit(payload, editing)
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
            paddingContentHorizontalLG: 40,
            paddingMD: 32,
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
          Select: {
            colorTextPlaceholder: PLACEHOLDER,
            colorBorder: BORDER_DEFAULT,
            controlHeight: 44,
            borderRadius: 8,
            colorText: LABEL_COLOR,
          },
          Radio: { colorText: LABEL_COLOR },
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
        mask={{ closable: !isSubmitting }}
        styles={{
          mask: { background: 'rgba(0,0,0,0.55)' },
          container: { padding: '32px 40px', borderRadius: 16 },
          header: { marginBottom: 20 },
        }}
        title={
          <div className='flex items-center' style={{ gap: 12 }}>
            <TbUserCog size={22} color={CONFIRM_BG} />
            <span style={{ color: '#111', fontSize: 20, fontWeight: 600 }}>
              {isLdapMode
                ? isEdit
                  ? 'แก้ไขผู้ใช้งาน LDAP'
                  : 'เพิ่มผู้ใช้งาน LDAP'
                : isEdit
                  ? 'แก้ไขข้อมูลผู้ใช้งาน'
                  : 'เพิ่มผู้ใช้งาน'}
            </span>
            {/* Small pill next to the title so the operator can see at a
             *  glance which auth backend they're about to write to. */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 10px',
                borderRadius: 999,
                fontSize: "var(--fs-12)",
                fontWeight: 600,
                lineHeight: 1.6,
                background: isLdapMode ? LDAP_BADGE_BG : LOCAL_BADGE_BG,
                color: isLdapMode ? '#0B2A4A' : LOCAL_BADGE_TEXT,
              }}
            >
              {isLdapMode ? 'LDAP' : 'Local'}
            </span>
          </div>
        }
      >
        <Form<FormShape>
          key={editing?.id ?? prefill?.Username ?? 'new'}
          form={form}
          layout='vertical'
          onFinish={handleFinish}
          initialValues={initialValues}
          disabled={isSubmitting}
        >
          <div className='grid grid-cols-2' style={{ gap: 20 }}>
            <Form.Item
              label={
                <span style={{ color: LABEL_COLOR, fontSize: "var(--fs-12)", fontWeight: 500 }}>
                  Username<Asterisk />
                </span>
              }
              name='username'
              rules={[
                { required: true, message: 'กรุณาระบุ Username' },
                { pattern: /^[a-zA-Z0-9._-]+$/, message: 'ใช้ได้เฉพาะ a-z, 0-9, . _ -' },
              ]}
              // In LDAP mode we surface the AD-link hint underneath the
              // field, so drop the default marginBottom to keep the row
              // aligned with the (now-hidden) password column.
              style={{ marginBottom: isLdapMode ? 4 : 16 }}
              extra={
                isLdapMode ? (
                  <span style={{ color: '#8A8A8A', fontSize: "var(--fs-12)" }}>
                    ระบบจะเชื่อมกับ AD โดยอัตโนมัติ
                  </span>
                ) : undefined
              }
            >
              {/* Username can't be changed via PUT — real API rejects it. */}
              <Input
                placeholder={isLdapMode ? 'ระบุ Username ที่มีอยู่ใน LDAP AD' : 'เช่น drr.admin'}
                autoComplete='off'
                disabled={isEdit || isSubmitting}
              />
            </Form.Item>
            {/* Password field is only rendered for Local create.
             *  LDAP accounts authenticate via AD (no local secret to store),
             *  and edit uses the dedicated PATCH change-password flow. */}
            {!isEdit && !isLdapMode && (
              <Form.Item
                label={
                  <span style={{ color: LABEL_COLOR, fontSize: "var(--fs-12)", fontWeight: 500 }}>
                    รหัสผ่าน<Asterisk />
                  </span>
                }
                name='password'
                rules={[
                  { required: true, message: 'กรุณาระบุรหัสผ่าน' },
                  { min: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' },
                ]}
                style={{ marginBottom: 16 }}
              >
                <Input.Password placeholder='รหัสผ่านเริ่มต้น' autoComplete='new-password' />
              </Form.Item>
            )}
          </div>

          <div className='grid grid-cols-2' style={{ gap: 20 }}>
            <Form.Item
              label={
                <span style={{ color: LABEL_COLOR, fontSize: "var(--fs-12)", fontWeight: 500 }}>
                  ชื่อ<Asterisk />
                </span>
              }
              name='firstName'
              rules={[{ required: true, message: 'กรุณาระบุชื่อ' }]}
              style={{ marginBottom: 16 }}
            >
              <Input placeholder='ชื่อ' />
            </Form.Item>
            <Form.Item
              label={
                <span style={{ color: LABEL_COLOR, fontSize: "var(--fs-12)", fontWeight: 500 }}>
                  นามสกุล<Asterisk />
                </span>
              }
              name='lastName'
              rules={[{ required: true, message: 'กรุณาระบุนามสกุล' }]}
              style={{ marginBottom: 16 }}
            >
              <Input placeholder='นามสกุล' />
            </Form.Item>
          </div>

          <Form.Item
            label={
              <span style={{ color: LABEL_COLOR, fontSize: "var(--fs-12)", fontWeight: 500 }}>
                หน่วยงาน<Asterisk />
              </span>
            }
            name='departmentId'
            rules={[{ required: true, message: 'กรุณาเลือกหน่วยงาน' }]}
            style={{ marginBottom: 16 }}
          >
            <Select
              placeholder='กรุณาเลือกหน่วยงาน...'
              options={departmentOptions}
              loading={departmentsLoading}
              showSearch
              optionFilterProp='label'
              classNames={{ popup: { root: 'light-modal-popup' } }} />
          </Form.Item>

          <Form.Item
            label={
              <span style={{ color: LABEL_COLOR, fontSize: "var(--fs-12)", fontWeight: 500 }}>
                บทบาท<Asterisk />
              </span>
            }
            name='role'
            rules={[{ required: true, message: 'กรุณาเลือกบทบาท' }]}
            style={{ marginBottom: 16 }}
          >
            {/* Only two roles exist: `user` (ผู้ใช้งาน) and `admin`
             *  (ผู้ดูแลระบบ). Legacy rows carrying operator/viewer still
             *  render a label via RoleBadge, but can't be re-selected here. */}
            <Radio.Group>
              <Radio value='user' style={{ color: LABEL_COLOR }}>ผู้ใช้งาน</Radio>
              <Radio value='admin' style={{ color: LABEL_COLOR }}>ผู้ดูแลระบบ</Radio>
            </Radio.Group>
          </Form.Item>

          {isEdit && (
            <div
              className='mb-4 flex items-center justify-between rounded-lg px-3 py-2'
              style={{ background: '#F7F7F7', border: `1px solid ${BORDER_DEFAULT}` }}
            >
              <div className='fs-12'>
                <div style={{ color: LABEL_COLOR, fontWeight: 500 }}>รหัสผ่าน</div>
                <div style={{ color: '#8A8A8A', fontSize: "var(--fs-12)" }}>
                  {editingIsLdap
                    ? 'รหัสผ่านจัดการที่ AD'
                    : 'แก้ไขได้ผ่านช่องเปลี่ยนรหัสผ่านโดยเฉพาะ'}
                </div>
              </div>
              {/* LDAP passwords live in AD — the PATCH endpoint refuses
               *  is_ldap users, so the button is hidden rather than left
               *  disabled to make the affordance clearer. */}
              {!editingIsLdap && (
                <Button
                  shape='round'
                  onClick={() => editing && onChangePassword?.(editing)}
                  disabled={isSubmitting}
                  style={{ background: '#66AEFF', color: '#000', borderColor: '#66AEFF', fontWeight: 600 }}
                >
                  เปลี่ยนรหัสผ่าน
                </Button>
              )}
            </div>
          )}

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
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(UserModal)
