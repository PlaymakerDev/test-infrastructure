"use client"
import { Button, ConfigProvider, Form, Input, Modal, Select, Spin } from 'antd'
import dayjs from 'dayjs'
import React, { useEffect, useMemo } from 'react'
import { TbClipboardList, TbPlus, TbTrash } from 'react-icons/tb'
import BuddhistDatePicker from '@/components/date-picker/BuddhistDatePicker'
import {
  useBudgetYears,
  useDepartments,
  useProjectContractors,
  useProjectDetail,
  useRoadsList,
} from '@/hooks/queries/manage'
import type { APIResponseProject } from '@/types/manage/project-api'
import { useOverallContext } from '../../context'
import type { Project, ProjectFormValues } from '../../types/project'

interface Props {
  open: boolean
  editing: Project | null
  onClose: () => void
}

interface FormShape {
  name: string
  budgetYear: number | null
  contractNo: string
  code: string
  /** department_id (number) — kept in the shared UI `owner` slot. */
  owner: number | null
  /** contractor_id (uuid). */
  contractor: string
  /** Each row stores the numeric road id in `roadId`. */
  roads: { roadId: number | null }[]
  warrantyStart: dayjs.Dayjs | null
  warrantyEnd: dayjs.Dayjs | null
}

/** Runtime shape returned by GET /manage/project/{id}. The public type doesn't
 *  declare road linkage yet, but the server ships it as `project_roads` (with
 *  an "s") — each item nests the full road object. We cast at the edge so the
 *  edit modal can restore the existing road selection AND display a proper
 *  label (road_code) instead of just `#<id>`. */
type ProjectDetailRuntime = APIResponseProject & {
  project_roads?: {
    project_road_id: number
    project_id: number
    road_id: number
    road?: {
      id: number
      road_code?: string
      road_name?: string
      province?: string
    }
  }[]
  /** Legacy singular alias — kept as a runtime fallback in case the API is
   *  ever renamed. Current server ships `project_roads` (plural). */
  project_road?: { road_id: number; road?: { road_code?: string; road_name?: string } }[]
}

/** Grab the road linkage array from a project-detail payload, accepting either
 *  the current plural spelling or the legacy singular one. */
const getProjectRoads = (d: ProjectDetailRuntime | undefined) =>
  d?.project_roads ?? d?.project_road ?? []

// ---------------------------------------------------------------------------
// Figma tokens — kept inline for the Project modal so a designer tweak
// touches one file. Values are read from drr-atlas-doc frames 2/3.
// ---------------------------------------------------------------------------
const LABEL_COLOR = '#1F1F1F'
const ASTERISK_COLOR = '#FF3B3B'
const PLACEHOLDER_COLOR = '#B8B8B8'
const BORDER_DEFAULT = '#E5E5E5'
const YELLOW = '#FCD116'
const CANCEL_BG = '#E5E5E5'
const CANCEL_FG = '#4A4A4A'

const RequiredLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: LABEL_COLOR, fontSize: 14, fontWeight: 500 }}>
    {children}
    <span style={{ color: ASTERISK_COLOR, marginLeft: 2 }}>*</span>
  </span>
)

const PlainLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: LABEL_COLOR, fontSize: 14, fontWeight: 500 }}>{children}</span>
)

const ProjectModal: React.FC<Props> = ({ open, editing, onClose }) => {
  const [form] = Form.useForm<FormShape>()
  const { createProject, updateProject, isSubmitting } = useOverallContext()

  const isEdit = !!editing
  const editingId = editing ? Number(editing.id) : null

  const { data: budgetYears } = useBudgetYears()
  const { data: departments } = useDepartments()
  const { data: contractors } = useProjectContractors()
  const { data: roads, isLoading: roadsLoading } = useRoadsList()
  const { data: detail, isLoading: detailLoading } = useProjectDetail(
    open && isEdit ? editingId : null,
  )

  // Build initialValues from the fetched detail (edit) or a stub (create).
  // Form is only rendered once `detail` has resolved (see JSX below), so this
  // memo is guaranteed populated at mount time — no post-mount setFieldsValue
  // race with the Select's showSearch mode.
  const initialValues = useMemo<Partial<FormShape>>(() => {
    if (!isEdit) return { roads: [{ roadId: null }] }
    if (!detail) return { roads: [{ roadId: null }] }
    const d = detail as ProjectDetailRuntime
    const links = getProjectRoads(d)
    return {
      name: d.project_name,
      budgetYear: d.budget_year,
      contractNo: d.contract_no,
      code: d.project_no === '-' ? '' : d.project_no,
      owner: d.department_id,
      contractor: d.contractor_id,
      roads:
        links.length > 0
          ? links.map((r) => ({ roadId: r.road_id }))
          : [{ roadId: null }],
      warrantyStart: d.warranty_start_date ? dayjs(d.warranty_start_date) : null,
      warrantyEnd: d.warranty_end_date ? dayjs(d.warranty_end_date) : null,
    }
  }, [isEdit, detail])

  // Safety net for prop changes without remount.
  useEffect(() => {
    if (!open) return
    if (!isEdit) {
      form.resetFields()
      form.setFieldsValue({ roads: [{ roadId: null }] })
      return
    }
    if (!detail) return
    form.setFieldsValue(initialValues)
  }, [open, isEdit, detail, form, initialValues])

  const handleFinish = async (values: FormShape) => {
    const payload: ProjectFormValues = {
      name: values.name,
      budgetYear: values.budgetYear ?? null,
      contractNo: values.contractNo,
      code: values.code,
      // Reuses the existing string slots but carries the id-as-string so the
      // context can Number(...) it back into the API payload.
      owner: values.owner != null ? String(values.owner) : '',
      contractor: values.contractor,
      roads: (values.roads || [])
        .map((r) => r.roadId)
        .filter((id): id is number => id != null)
        .map((id) => String(id)),
      warrantyStart: values.warrantyStart?.format('YYYY-MM-DD') ?? '',
      warrantyEnd: values.warrantyEnd?.format('YYYY-MM-DD') ?? '',
    }
    try {
      if (editing) await updateProject(editing.id, payload)
      else await createProject(payload)
      onClose()
    } catch {
      // errors surfaced via message.error inside the context — keep modal open.
    }
  }

  const handleCancel = () => {
    if (isSubmitting) return
    onClose()
  }

  // ── Option lists with edit-time fallbacks ───────────────────────────────────
  // Each Select is bound to a foreign key that lives on the fetched project
  // detail. When editing, the master option list (budget years / departments /
  // contractors / roads) can miss the stored id — the row was deleted, is on a
  // later page, or the list simply hasn't resolved yet. `showSearch` + missing
  // option = silently blank Select. Mirroring the RouteModal idiom, each memo
  // appends a `{ label: '#<id>', value: <id> }` fallback so the currently-
  // selected value always renders.
  const detailRuntime = detail as ProjectDetailRuntime | undefined

  const yearOptions = useMemo(() => {
    const opts = (budgetYears ?? []).map((y) => ({ label: y.toString(), value: y }))
    if (
      detailRuntime?.budget_year != null &&
      !opts.some((o) => o.value === detailRuntime.budget_year)
    ) {
      opts.push({ label: String(detailRuntime.budget_year), value: detailRuntime.budget_year })
    }
    return opts
  }, [budgetYears, detailRuntime])

  const ownerOptions = useMemo(() => {
    const opts = (departments ?? []).map((d) => ({
      label: d.department_short_name,
      value: d.id,
    }))
    if (
      detailRuntime?.department_id != null &&
      !opts.some((o) => o.value === detailRuntime.department_id)
    ) {
      opts.push({
        label: `#${detailRuntime.department_id}`,
        value: detailRuntime.department_id,
      })
    }
    return opts
  }, [departments, detailRuntime])

  const contractorOptions = useMemo(() => {
    const opts = (contractors ?? []).map((c) => ({
      label: c.company_name,
      value: c.user_id,
    }))
    if (
      detailRuntime?.contractor_id &&
      !opts.some((o) => o.value === detailRuntime.contractor_id)
    ) {
      // Prefer the nested company_name the detail response ships so a deleted
      // / paginated-off contractor still reads as a name; fall back to `#<id>`.
      const label =
        detailRuntime.contractor?.contractor?.company_name ??
        `#${detailRuntime.contractor_id}`
      opts.push({ label, value: detailRuntime.contractor_id })
    }
    return opts
  }, [contractors, detailRuntime])

  const roadOptions = useMemo(() => {
    const opts = (roads?.res_data ?? []).map((r) => ({
      label: `${r.road_code}${r.road_name ? ' - ' + r.road_name : ''}`,
      value: r.id as number,
    }))
    // Real API ships `project_roads` (plural) with a nested `road` object.
    // Use the nested road_code for a proper label; fall back to `#<id>` if the
    // nested road isn't present.
    getProjectRoads(detailRuntime).forEach((r) => {
      if (!opts.some((o) => o.value === r.road_id)) {
        const nested = r.road
        const label =
          nested?.road_code
            ? `${nested.road_code}${nested.road_name ? ' - ' + nested.road_name : ''}`
            : `#${r.road_id}`
        opts.push({ label, value: r.road_id })
      }
    })
    return opts
  }, [roads, detailRuntime])

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: YELLOW,
          colorTextPlaceholder: PLACEHOLDER_COLOR,
        },
        components: {
          Modal: {
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            footerBg: '#FFFFFF',
            titleColor: '#111111',
            borderRadiusLG: 16,
          },
          Form: { labelColor: LABEL_COLOR },
          Input: {
            colorText: '#1F1F1F',
            colorBorder: BORDER_DEFAULT,
            colorTextPlaceholder: PLACEHOLDER_COLOR,
            borderRadius: 8,
            controlHeight: 44,
            paddingInline: 14,
            activeBorderColor: YELLOW,
            hoverBorderColor: YELLOW,
          },
          Select: {
            colorText: '#1F1F1F',
            colorBorder: BORDER_DEFAULT,
            colorTextPlaceholder: PLACEHOLDER_COLOR,
            borderRadius: 8,
            controlHeight: 44,
            optionSelectedBg: '#FFF8CC',
          },
          DatePicker: {
            colorText: '#1F1F1F',
            colorBorder: BORDER_DEFAULT,
            colorTextPlaceholder: PLACEHOLDER_COLOR,
            borderRadius: 8,
            controlHeight: 44,
            activeBorderColor: YELLOW,
            hoverBorderColor: YELLOW,
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
        centered
        closable={{ 'aria-label': 'Custom Close Button' }}
        mask={{ closable: !isSubmitting }}
        keyboard={!isSubmitting}
        styles={{
          mask: { background: 'rgba(0,0,0,0.55)' },
          header: { marginBottom: 20, background: '#FFFFFF', padding: '32px 40px 0' },
          body: { padding: '0 40px 32px' },
        }}
        title={
          <div className='flex items-center' style={{ gap: 12 }}>
            <TbClipboardList size={22} color={YELLOW} />
            <span style={{ color: '#111111', fontSize: 20, fontWeight: 600 }}>
              {isEdit ? 'แก้ไขข้อมูลโครงการ' : 'เพิ่มข้อมูลโครงการ'}
            </span>
          </div>
        }
      >
        {isEdit && detailLoading ? (
          <div className='flex items-center justify-center py-12'>
            <Spin />
          </div>
        ) : (
          <Form<FormShape>
            key={isEdit ? `edit-${editingId}-${detail ? 'ready' : 'wait'}` : 'create'}
            form={form}
            layout='vertical'
            onFinish={handleFinish}
            initialValues={initialValues}
            disabled={isSubmitting}
            requiredMark={false}
          >
            <Form.Item
              label={<RequiredLabel>ชื่อโครงการ</RequiredLabel>}
              name='name'
              rules={[{ required: true, message: 'กรุณาระบุชื่อโครงการ' }]}
              style={{ marginBottom: 16 }}
            >
              <Input placeholder='กรุณาระบุชื่อโครงการ...' />
            </Form.Item>

            <Form.Item
              label={<RequiredLabel>ปีงบประมาณ</RequiredLabel>}
              name='budgetYear'
              rules={[{ required: true, message: 'กรุณาเลือกปีงบประมาณ' }]}
              style={{ marginBottom: 16 }}
            >
              <Select
                placeholder='กรุณาระบุปีงบประมาณ...'
                options={yearOptions}
              classNames={{ popup: { root: 'light-modal-popup' } }} />
            </Form.Item>

            <div className='grid grid-cols-2' style={{ columnGap: 20 }}>
              <Form.Item
                label={<RequiredLabel>เลขที่สัญญา</RequiredLabel>}
                name='contractNo'
                rules={[{ required: true, message: 'กรุณาระบุเลขที่สัญญา' }]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder='กรุณาระบุเลขที่สัญญา...' />
              </Form.Item>
              <Form.Item
                label={<PlainLabel>รหัสโครงการ</PlainLabel>}
                name='code'
                rules={[{ required: true, message: 'กรุณาระบุรหัสโครงการ' }]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder='กรุณาระบุรหัสโครงการ...' />
              </Form.Item>
            </div>

            <div className='grid grid-cols-2' style={{ columnGap: 20 }}>
              <Form.Item
                label={<PlainLabel>ผู้ว่าจ้าง</PlainLabel>}
                name='owner'
                rules={[{ required: true, message: 'กรุณาเลือกผู้ว่าจ้าง' }]}
                style={{ marginBottom: 16 }}
              >
                <Select
                  placeholder='กรุณาเลือกผู้ว่าจ้าง...'
                  showSearch
                  optionFilterProp='label'
                  options={ownerOptions}
                classNames={{ popup: { root: 'light-modal-popup' } }} />
              </Form.Item>
              <Form.Item
                label={<PlainLabel>ผู้รับจ้าง</PlainLabel>}
                name='contractor'
                rules={[{ required: true, message: 'กรุณาเลือกผู้รับจ้าง' }]}
                style={{ marginBottom: 16 }}
              >
                <Select
                  placeholder='กรุณาเลือกผู้รับจ้าง...'
                  showSearch
                  optionFilterProp='label'
                  options={contractorOptions}
                classNames={{ popup: { root: 'light-modal-popup' } }} />
              </Form.Item>
            </div>

            <Form.List
              name='roads'
              rules={[
                {
                  validator: async (_, value) => {
                    const hasAny =
                      Array.isArray(value) &&
                      value.some(
                        (v: { roadId: number | null } | undefined) =>
                          v && v.roadId != null,
                      )
                    if (!hasAny) {
                      return Promise.reject(new Error('กรุณาเลือกสายทางอย่างน้อย 1 รายการ'))
                    }
                  },
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <div>
                  {fields.map((field, idx) => (
                    <div key={field.key} className='flex items-end' style={{ gap: 8, marginBottom: 8 }}>
                      <Form.Item
                        className='flex-1'
                        style={{ marginBottom: 0 }}
                        label={
                          idx === 0 ? (
                            <RequiredLabel>สายทาง</RequiredLabel>
                          ) : (
                            <span style={{ visibility: 'hidden' }}>&nbsp;</span>
                          )
                        }
                        name={[field.name, 'roadId']}
                        rules={idx === 0 ? [{ required: true, message: 'กรุณาเลือกสายทาง' }] : []}
                      >
                        <Select
                          placeholder='กรุณาเลือกสายทาง...'
                          options={roadOptions}
                          loading={roadsLoading}
                          showSearch
                          optionFilterProp='label'
                        classNames={{ popup: { root: 'light-modal-popup' } }} />
                      </Form.Item>
                      {fields.length > 1 && (
                        <Button
                          onClick={() => remove(field.name)}
                          icon={<TbTrash />}
                          danger
                          disabled={isSubmitting}
                          style={{ height: 44, marginBottom: 0 }}
                        />
                      )}
                    </div>
                  ))}
                  <Form.ErrorList errors={errors} />
                  <Button
                    block
                    onClick={() => add({ roadId: null })}
                    icon={<TbPlus />}
                    disabled={isSubmitting}
                    style={{
                      background: YELLOW,
                      color: '#1A1A1A',
                      borderColor: YELLOW,
                      fontWeight: 500,
                      borderRadius: 8,
                      height: 40,
                      marginTop: 4,
                    }}
                  >
                    เพิ่มสายทาง
                  </Button>
                </div>
              )}
            </Form.List>

            <div className='grid grid-cols-2' style={{ columnGap: 20, marginTop: 16 }}>
              <Form.Item
                label={<RequiredLabel>วันที่เริ่มต้นค้ำประกัน</RequiredLabel>}
                name='warrantyStart'
                rules={[{ required: true, message: 'กรุณาระบุวันที่เริ่มต้นค้ำประกัน' }]}
                style={{ marginBottom: 16 }}
              >
                <BuddhistDatePicker
                  className='w-full'
                  size='large'
                  format='DD/MM/BBBB'
                  placeholder='กรุณาระบุวันที่เริ่มต้นค้ำประกัน...'
                  classNames={{ popup: { root: 'light-modal-popup' } }}
                />
              </Form.Item>
              <Form.Item
                label={<RequiredLabel>วันที่สิ้นสุดค้ำประกัน</RequiredLabel>}
                name='warrantyEnd'
                rules={[{ required: true, message: 'กรุณาระบุวันที่สิ้นสุดค้ำประกัน' }]}
                style={{ marginBottom: 16 }}
              >
                <BuddhistDatePicker
                  className='w-full'
                  size='large'
                  format='DD/MM/BBBB'
                  placeholder='กรุณาระบุวันที่สิ้นสุดค้ำประกัน...'
                  classNames={{ popup: { root: 'light-modal-popup' } }}
                />
              </Form.Item>
            </div>

            <div className='flex justify-end' style={{ gap: 12, marginTop: 8 }}>
              <Button
                onClick={handleCancel}
                disabled={isSubmitting}
                style={{
                  background: CANCEL_BG,
                  color: CANCEL_FG,
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
                loading={isSubmitting}
                style={{
                  background: YELLOW,
                  color: '#1A1A1A',
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
        )}
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ProjectModal)
