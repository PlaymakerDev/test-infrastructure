"use client"
import { Button, ConfigProvider, Form, Input, InputNumber, Modal, Select } from 'antd'
import React, { useEffect, useMemo } from 'react'
import { TbRoad } from 'react-icons/tb'
import type { APIResponseDepartment } from '@/types/manage/department-api'
import type { Route, RouteFormValues } from '../../types/route'

interface Props {
  open: boolean
  editing: Route | null
  departments: APIResponseDepartment[]
  submitting: boolean
  onClose: () => void
  onSubmit: (values: RouteFormValues, editingId: number | null) => void | Promise<void>
}

interface FormShape {
  code: string
  name: string
  province: string
  district: string
  subdistrict: string
  startSta: string
  endSta: string
  lengthKm: number | null
  departmentId: number
}

// Figma tokens (single source of truth for the white-shell "Add/Edit" modal)
const FIGMA = {
  label: '#1F1F1F',
  requiredAsterisk: '#FF3B3B',
  inputBorder: '#E5E5E5',
  inputFocusBorder: '#FCD116',
  placeholder: '#B8B8B8',
  cancelBg: '#E5E5E5',
  cancelText: '#4A4A4A',
  confirmBg: '#FCD116',
  confirmText: '#1A1A1A',
  titleText: '#111111',
  iconYellow: '#FCD116',
} as const

/** Renders a form label with the Figma-spec red asterisk. Non-required
 *  fields skip the asterisk entirely. */
const FieldLabel: React.FC<{ text: string; required?: boolean }> = ({ text, required }) => (
  <span style={{ color: FIGMA.label, fontSize: 14, fontWeight: 500 }}>
    {text}
    {required && <span style={{ color: FIGMA.requiredAsterisk, marginLeft: 2 }}>*</span>}
  </span>
)

const RouteModal: React.FC<Props> = ({
  open,
  editing,
  departments,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm<FormShape>()
  const isEdit = !!editing

  // Build initialValues from `editing` — passed to Form so field registration
  // sees the correct value AT MOUNT, avoiding the AntD Select+showSearch race
  // where post-mount setFieldsValue can be swallowed if the value isn't yet in
  // the option list.
  const initialValues = useMemo<Partial<FormShape>>(
    () =>
      editing
        ? {
            code: editing.code,
            name: editing.name,
            province: editing.province,
            district: editing.district,
            subdistrict: editing.subdistrict,
            startSta: editing.startSta,
            endSta: editing.endSta,
            lengthKm: editing.lengthKm,
            departmentId: editing.departmentId ?? (undefined as unknown as number),
          }
        : {},
    [editing],
  )

  // Kept as a safety net in case Form isn't remounted (e.g. rapid tab-switch);
  // combined with the `key={editing?.id}` on the Form component below the two
  // together guarantee the values land at the right moment.
  useEffect(() => {
    if (!open) return
    if (editing) form.setFieldsValue(initialValues)
    else form.resetFields()
  }, [open, editing, form, initialValues])

  const departmentOptions = useMemo(() => {
    const opts = departments
      .filter((d) => !!d.department_short_name)
      .map((d) => ({ label: d.department_short_name, value: d.id }))
    // Fallback: ensure the currently-edited department id renders even when
    // the master list omits it (missing short_name, deleted dept, or hasn't
    // loaded yet). Prevents the Select from rendering blank on edit.
    if (
      editing?.departmentId != null &&
      !opts.some((o) => o.value === editing.departmentId)
    ) {
      opts.push({ label: `#${editing.departmentId}`, value: editing.departmentId })
    }
    return opts
  }, [departments, editing])

  // Deduped province suggestions from the departments list so the field
  // stays useful even before the roads list has any rows. When editing an
  // existing road, ensure its current province is in the option list — road
  // API spelling can diverge from department API (e.g. "กรุงเทพมหานคร" vs
  // "กรุงเทพ"), and without this fallback the Select renders blank because
  // showSearch mode filters unmatched values.
  const provinceOptions = useMemo(() => {
    const set = new Set<string>()
    departments.forEach((d) => {
      if (d.province) set.add(d.province)
    })
    if (editing?.province) set.add(editing.province)
    return Array.from(set)
      .sort()
      .map((p) => ({ label: p, value: p }))
  }, [departments, editing])

  const handleFinish = (values: FormShape) => {
    const payload: RouteFormValues = {
      code: values.code.trim(),
      name: values.name.trim(),
      province: (values.province ?? '').trim(),
      district: (values.district ?? '').trim(),
      subdistrict: (values.subdistrict ?? '').trim(),
      startSta: (values.startSta ?? '').trim(),
      endSta: (values.endSta ?? '').trim(),
      lengthKm: values.lengthKm ?? null,
      departmentId: values.departmentId,
    }
    onSubmit(payload, editing?.id ?? null)
  }

  // Guard `onCancel` while submitting so the backdrop / ESC don't dismiss
  // a modal mid-request (Ant fires onCancel for both).
  const handleCancel = () => {
    if (submitting) return
    onClose()
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: FIGMA.inputFocusBorder,
        },
        components: {
          Modal: {
            colorIcon: '#000000',
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            footerBg: '#FFFFFF',
            titleColor: FIGMA.titleText,
            borderRadiusLG: 16,
          },
          Form: { labelColor: FIGMA.label },
          Input: {
            colorText: FIGMA.label,
            colorTextPlaceholder: FIGMA.placeholder,
            colorBorder: FIGMA.inputBorder,
            colorBgContainer: '#FFFFFF',
            controlHeight: 44,
            borderRadius: 8,
            paddingInline: 14,
            activeBorderColor: FIGMA.inputFocusBorder,
            hoverBorderColor: FIGMA.inputFocusBorder,
          },
          InputNumber: {
            colorText: FIGMA.label,
            colorTextPlaceholder: FIGMA.placeholder,
            colorBorder: FIGMA.inputBorder,
            colorBgContainer: '#FFFFFF',
            controlHeight: 44,
            borderRadius: 8,
            paddingInline: 14,
            activeBorderColor: FIGMA.inputFocusBorder,
            hoverBorderColor: FIGMA.inputFocusBorder,
          },
          Select: {
            colorText: FIGMA.label,
            colorTextPlaceholder: FIGMA.placeholder,
            colorBorder: FIGMA.inputBorder,
            colorBgContainer: '#FFFFFF',
            controlHeight: 44,
            borderRadius: 8,
            activeBorderColor: FIGMA.inputFocusBorder,
            hoverBorderColor: FIGMA.inputFocusBorder,
            optionSelectedBg: '#FFF8CC',
          },
        },
      }}
    >
      <Modal
        wrapClassName='light-modal'
        open={open}
        onCancel={handleCancel}
        footer={null}
        destroyOnHidden
        width={720}
        mask={{ closable: !submitting }}
        closable={{ 'aria-label': 'Custom Close Button' }}
        keyboard={!submitting}
        styles={{
          mask: { background: 'rgba(0,0,0,0.55)' },
          container: { borderRadius: 16, padding: '32px 40px' },
          body: { padding: 0 },
          header: { padding: 0, marginBottom: 20 },
        }}
        title={
          <div className='flex items-center' style={{ gap: 12 }}>
            <TbRoad size={22} color={FIGMA.iconYellow} />
            <span style={{ color: FIGMA.titleText, fontSize: 20, fontWeight: 600 }}>
              {isEdit ? 'แก้ไขข้อมูลสายทาง' : 'เพิ่มข้อมูลสายทาง'}
            </span>
          </div>
        }
      >
        <Form<FormShape>
          key={editing?.id ?? 'new'}
          form={form}
          layout='vertical'
          onFinish={handleFinish}
          disabled={submitting}
          requiredMark={false}
          initialValues={initialValues}
        >
          <div className='grid grid-cols-2' style={{ gap: 20 }}>
            <Form.Item
              label={<FieldLabel text='รหัสสายทาง' required />}
              name='code'
              rules={[{ required: true, message: 'กรุณาระบุรหัสสายทาง' }]}
              style={{ marginBottom: 16 }}
            >
              <Input placeholder='เช่น ขก.1027' />
            </Form.Item>
            <Form.Item
              label={<FieldLabel text='จังหวัด' required />}
              name='province'
              rules={[{ required: true, message: 'กรุณาเลือกจังหวัด' }]}
              style={{ marginBottom: 16 }}
            >
              <Select
                showSearch
                placeholder='กรุณาเลือกจังหวัด...'
                options={provinceOptions}
                classNames={{ popup: { root: 'light-modal-popup' } }}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </div>

          <Form.Item
            label={<FieldLabel text='ชื่อสายทาง' required />}
            name='name'
            rules={[{ required: true, message: 'กรุณาระบุชื่อสายทาง' }]}
            style={{ marginBottom: 16 }}
          >
            <Input placeholder='กรุณาระบุชื่อสายทาง...' />
          </Form.Item>

          <div className='grid grid-cols-2' style={{ gap: 20 }}>
            <Form.Item
              label={<FieldLabel text='อำเภอ' required />}
              name='district'
              rules={[{ required: true, message: 'กรุณาระบุอำเภอ' }]}
              style={{ marginBottom: 16 }}
            >
              <Input placeholder='กรุณาระบุอำเภอ...' />
            </Form.Item>
            <Form.Item
              label={<FieldLabel text='ตำบล' required />}
              name='subdistrict'
              rules={[{ required: true, message: 'กรุณาระบุตำบล' }]}
              style={{ marginBottom: 16 }}
            >
              <Input placeholder='กรุณาระบุตำบล...' />
            </Form.Item>
          </div>

          <div className='grid grid-cols-3' style={{ gap: 20 }}>
            <Form.Item
              label={<FieldLabel text='กม.เริ่มต้น' required />}
              name='startSta'
              rules={[{ required: true, message: 'กรุณาระบุ กม.เริ่มต้น' }]}
              style={{ marginBottom: 16 }}
            >
              <Input placeholder='เช่น 0+000' />
            </Form.Item>
            <Form.Item
              label={<FieldLabel text='กม.สิ้นสุด' required />}
              name='endSta'
              rules={[{ required: true, message: 'กรุณาระบุ กม.สิ้นสุด' }]}
              style={{ marginBottom: 16 }}
            >
              <Input placeholder='เช่น 12+450' />
            </Form.Item>
            <Form.Item
              label={<FieldLabel text='ระยะทาง (กม.)' />}
              name='lengthKm'
              style={{ marginBottom: 16 }}
            >
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
            label={<FieldLabel text='หน่วยงานรับผิดชอบ' required />}
            name='departmentId'
            rules={[{ required: true, message: 'กรุณาเลือกหน่วยงานรับผิดชอบ' }]}
            style={{ marginBottom: 8 }}
          >
            <Select
              showSearch
              placeholder='กรุณาเลือกหน่วยงานรับผิดชอบ...'
              options={departmentOptions}
              classNames={{ popup: { root: 'light-modal-popup' } }}
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <div className='flex justify-end' style={{ gap: 12, marginTop: 8 }}>
            <Button
              onClick={handleCancel}
              disabled={submitting}
              style={{
                background: FIGMA.cancelBg,
                color: FIGMA.cancelText,
                borderColor: FIGMA.cancelBg,
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
              // The Form's `disabled` prop above would also disable the submit
              // button — we explicitly keep it enabled so the user can retry
              // if the loading state is stuck.
              disabled={false}
              style={{
                background: FIGMA.confirmBg,
                color: FIGMA.confirmText,
                borderColor: FIGMA.confirmBg,
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

export default React.memo<Props>(RouteModal)
