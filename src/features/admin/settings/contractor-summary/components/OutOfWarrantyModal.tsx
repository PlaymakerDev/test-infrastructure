"use client"
import React, { useMemo, useState } from 'react'
import {
  App,
  Button,
  ConfigProvider,
  Empty,
  Input,
  Modal,
  Pagination,
  Select,
  Spin,
  Table,
  Upload,
  type PaginationProps,
  type TableProps,
} from 'antd'
import {
  TbArrowNarrowLeft,
  TbArrowNarrowRight,
  TbCalendarEvent,
  TbClipboardText,
  TbFileDescription,
  TbHourglass,
  TbInfoSquareRoundedFilled,
  TbPlus,
  TbTool,
  TbTrash,
  TbUser,
  TbUserShield,
} from 'react-icons/tb'
import { compressImage } from '@/features/admin/maintenance/data/compressImage'
import { useUserRole } from '@/hooks/useUserRole'
import { thaiDateBE } from '@/utils/thaiDate'
import type { OutOfWarrantyDeviceType, ProjectDeviceStatusBase } from '@/types/manage/device-status-api'
import {
  addEntry,
  candidateDevices,
  clearEntry,
  deviceOrder,
  droppedRecords,
  entryErrors,
  failedItem,
  filledDeviceIds,
  initialEntries,
  initialTypeKey,
  OUT_OF_WARRANTY_MAX_PHOTOS,
  OUT_OF_WARRANTY_PHOTO_EDGE,
  OUT_OF_WARRANTY_TABLE_PAGE_SIZE,
  OUT_OF_WARRANTY_TYPES,
  pickDevice,
  recordDevices,
  recordEntries,
  recordsToSave,
  updateEntry,
  validateEntries,
  type DevicesByType,
  type EntriesState,
  type EntryErrors,
  type OutOfWarrantyDevice,
  type OutOfWarrantyEntries,
  type OutOfWarrantyPhoto,
} from '../data/outOfWarranty'
import {
  OutOfWarrantySaveError,
  useOutOfWarrantyCandidates,
  useOutOfWarrantyRecords,
  useSaveOutOfWarranty,
  type SaveFailure,
} from '../hooks/useOutOfWarranty'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// The Live modal's offline red and the app's in-warranty teal. The left panel
// is blue as in the Figma (the maintenance case page's device table); the
// form on the right keeps the app's yellow inputs.
const OFFLINE_COLOR = '#E94C4C'
const IN_WARRANTY_COLOR = '#05F2DB'
const BLUE = '#66AEFF'
const YELLOW = '#FCD116'
const PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

interface Props {
  /** The project whose button was pressed; null = closed. */
  project: ProjectDeviceStatusBase | null
  onClose: () => void
  onOpenProjectInfo: (project: ProjectDeviceStatusBase) => void
}

const formatDate = (value: string | null | undefined) => (value ? thaiDateBE(value) : '-')

/** "← ก่อนหน้า 1 2 3 … ถัดไป →" in one colour — blue under the table, yellow
 *  under the form, the active page a filled circle. */
const ModalPagination: React.FC<{
  current: number
  total: number
  pageSize: number
  accent: string
  onChange: (page: number) => void
  label: string
}> = ({ current, total, pageSize, accent, onChange, label }) => {
  const itemRender: PaginationProps['itemRender'] = (page, type, element) => {
    if (type === 'page') return <a rel='nofollow' className='fs-12'>{page}</a>
    if ((type === 'prev' || type === 'next') && React.isValidElement(element)) {
      const content = type === 'prev'
        ? <><TbArrowNarrowLeft className='fs-18' /><span className='max-sm:hidden'>ก่อนหน้า</span></>
        : <><span className='max-sm:hidden'>ถัดไป</span><TbArrowNarrowRight className='fs-18' /></>
      return React.cloneElement(
        element as React.ReactElement<{ children?: React.ReactNode }>,
        undefined,
        <span className='inline-flex items-center gap-1.5 px-1 fs-12'>{content}</span>,
      )
    }
    return element
  }
  return (
    <ConfigProvider
      theme={{
        components: {
          Pagination: {
            itemActiveBg: accent,
            itemActiveColor: '#0A0A0A',
            // antd turns the active number colorPrimaryHover under the mouse —
            // the accent on an accent circle, i.e. gone.
            itemActiveColorHover: '#0A0A0A',
            itemBg: 'transparent',
            colorPrimary: accent,
            colorPrimaryHover: accent,
            colorText: accent,
            borderRadius: 999,
          },
        },
      }}
    >
      <nav aria-label={label}>
        <Pagination
          current={current}
          total={total}
          pageSize={pageSize}
          onChange={onChange}
          showSizeChanger={false}
          itemRender={itemRender}
        />
      </nav>
    </ConfigProvider>
  )
}

const SectionTitle: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <p className='flex items-center gap-2 fs-14 text-(--default-blue)'>
    <span className='inline-flex fs-22'>{icon}</span>
    {children}
  </p>
)

/** ข้อมูลโครงการ — the row's own fields, laid out like the ⓘ dialogs. */
const ProjectFacts: React.FC<{ project: ProjectDeviceStatusBase }> = ({ project }) => {
  const facts: { icon: React.ReactNode; label: string; value: string; color?: string }[] = [
    { icon: <TbUser />, label: 'ผู้รับจ้าง', value: project.contractor?.short_name || project.contractor?.company_name || '-' },
    { icon: <TbUserShield />, label: 'หน่วยงานรับผิดชอบ', value: project.department?.department_short_name || '-' },
    { icon: <TbFileDescription />, label: 'เลขที่สัญญา', value: project.contract_no?.trim() || '-' },
    { icon: <TbCalendarEvent />, label: 'เริ่มต้นการรับประกัน', value: formatDate(project.warranty_start_date) },
    { icon: <TbCalendarEvent />, label: 'สิ้นสุดการรับประกัน', value: formatDate(project.warranty_end_date) },
    {
      icon: <TbHourglass />,
      label: 'สถานะค้ำประกัน',
      value: project.is_warranty ? 'ในค้ำ' : 'หมดค้ำ',
      color: project.is_warranty ? IN_WARRANTY_COLOR : OFFLINE_COLOR,
    },
  ]
  // One row of six when the card is wide enough for every label whole (the
  // Figma's layout), otherwise three — never a label split mid-word.
  return (
    <div className='grid grid-cols-2 @lg:grid-cols-3 @2xl:grid-cols-[repeat(6,auto)] @2xl:justify-between gap-x-4 gap-y-5 mt-4'>
      {facts.map((fact) => (
        <div key={fact.label} className='flex flex-col items-center text-center min-w-0'>
          <span className='inline-flex fs-22 text-white mb-1'>{fact.icon}</span>
          <p className='fs-12 text-(--light-gray-3) leading-snug whitespace-nowrap'>{fact.label}</p>
          <p className='fs-12 leading-snug wrap-break-word max-w-full' style={{ color: fact.color ?? '#FFFFFF' }}>{fact.value}</p>
        </div>
      ))}
    </div>
  )
}

/** The project's offline devices of the chosen type — a row click puts that
 *  device on the form. Same blue header as the maintenance case page's
 *  ข้อมูลอุปกรณ์ table (CaseDeviceTable). A device with something written
 *  for it has its ลำดับ in blue (user 2026-11-16) — the main table's blue
 *  for "recorded". */
const DeviceTable: React.FC<{
  devices: OutOfWarrantyDevice[]
  typeLabel: string
  page: number
  selectedId: string | null
  filledIds: ReadonlySet<string>
  emptyText: string
  onPick: (device: OutOfWarrantyDevice) => void
}> = ({ devices, typeLabel, page, selectedId, filledIds, emptyText, onPick }) => {
  const start = (page - 1) * OUT_OF_WARRANTY_TABLE_PAGE_SIZE
  const red = (text: string) => <span className='fs-12' style={{ color: OFFLINE_COLOR }}>{text}</span>
  // Fixed widths fit the card at 1400 px; Hostname takes what is left and
  // wraps a long name instead of pushing the last columns out of sight.
  const columns: TableProps<OutOfWarrantyDevice>['columns'] = [
    {
      title: <span className='fs-12'>ลำดับ</span>,
      key: 'no',
      width: 56,
      align: 'center',
      render: (_, device, index) =>
        filledIds.has(device.id)
          ? <span className='fs-12 font-bold' style={{ color: BLUE }} title='กรอกข้อมูลแล้ว'>{start + index + 1}</span>
          : <span className='fs-12'>{start + index + 1}</span>,
    },
    { title: <span className='fs-12'>ประเภท</span>, key: 'type', width: 96, render: () => <span className='fs-12'>{typeLabel}</span> },
    { title: <span className='fs-12'>Hostname</span>, dataIndex: 'hostname', key: 'hostname', render: (value: string) => <span className='fs-12 wrap-break-word'>{value || '-'}</span> },
    { title: <span className='fs-12'>IP Address</span>, dataIndex: 'ipAddress', key: 'ip', width: 112, render: (value: string) => <span className='fs-12'>{value || '-'}</span> },
    { title: <span className='fs-12'>วันที่เริ่มออฟไลน์</span>, dataIndex: 'offlineSince', key: 'since', width: 122, align: 'center', render: (value: string | null) => red(formatDate(value)) },
    {
      title: <span className='fs-12'>จำนวนวันออฟไลน์</span>,
      dataIndex: 'offlineDays',
      key: 'days',
      width: 128,
      align: 'center',
      render: (value: number | null) => red(value != null ? `${value} วัน` : '-'),
    },
  ]
  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerBg: BLUE,
            headerColor: '#1A1A1A',
            headerSplitColor: 'transparent',
            colorBgContainer: 'transparent',
            colorText: '#FFFFFF',
            borderColor: 'rgba(102,174,255,0.35)',
            rowHoverBg: 'rgba(255,255,255,0.06)',
          },
        },
      }}
    >
      <Table<OutOfWarrantyDevice>
        rowKey='id'
        size='middle'
        columns={columns}
        dataSource={devices.slice(start, start + OUT_OF_WARRANTY_TABLE_PAGE_SIZE)}
        pagination={false}
        // Scrolls sideways only below this (a phone); wider, the columns fit.
        scroll={{ x: 640 }}
        rowClassName={(device) => (device.id === selectedId ? '[&>td]:bg-(--mid-gray)!' : '')}
        onRow={(device) => ({ onClick: () => onPick(device), style: { cursor: 'pointer' } })}
        locale={{ emptyText: <Empty description={<span className='fs-12'>{emptyText}</span>} /> }}
      />
    </ConfigProvider>
  )
}

const FieldLabel: React.FC<{ children: React.ReactNode; error?: boolean; required?: boolean }> = ({ children, error, required = true }) => (
  <p className='fs-12 mb-2' style={{ color: error ? OFFLINE_COLOR : YELLOW }}>
    {children}
    {required && <span style={{ color: OFFLINE_COLOR }}>*</span>}
  </p>
)

const FieldError: React.FC<{ show?: boolean; children: React.ReactNode }> = ({ show, children }) =>
  show ? <p className='fs-12 mt-1' style={{ color: OFFLINE_COLOR }}>{children}</p> : null

/** A photo: opens full size in a new tab once it has a picture; the corner
 *  bin (always there — a phone has no hover) takes it off the record. */
const PhotoThumb: React.FC<{ photo: OutOfWarrantyPhoto; onRemove?: () => void }> = ({ photo, onRemove }) => (
  <div className='relative w-16 h-16 rounded-lg overflow-hidden bg-(--light-gray-2) shrink-0'>
    {photo.processing || !photo.url ? (
      <div className='flex w-full h-full items-center justify-center'><Spin size='small' /></div>
    ) : (
      <a href={photo.url} target='_blank' rel='noreferrer' title={`เปิดรูป ${photo.name}`} className='block w-full h-full'>
        {/* eslint-disable-next-line @next/next/no-img-element -- a stored or object URL, not an optimisable asset */}
        <img src={photo.url} alt={photo.name} className='w-full h-full object-cover' />
      </a>
    )}
    {onRemove && (
      <button
        type='button'
        aria-label={`ลบรูป ${photo.name}`}
        title='ลบรูป'
        onClick={onRemove}
        className='absolute top-1 right-1 flex items-center justify-center w-6 h-6 rounded-full border-none cursor-pointer bg-[#191919CC] hover:bg-(--red)'
      >
        <TbTrash size={14} color='#FFFFFF' />
      </button>
    )}
  </div>
)

/** What the form says when a save fails. */
const SAVE_FAILURE_MESSAGE: Record<SaveFailure['kind'], string> = {
  upload: 'อัปโหลดรูปไม่สำเร็จ กรุณาลองอีกครั้ง',
  conflict: 'บันทึกของโครงการนี้เพิ่งเปลี่ยนจากที่อื่น กรุณาปิดแล้วเปิดใหม่อีกครั้ง',
  forbidden: 'บัญชีนี้ไม่มีสิทธิ์บันทึกโครงการนี้',
  invalid: 'บันทึกไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง',
  other: 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง',
}

interface FormProps {
  project: ProjectDeviceStatusBase
  devices: DevicesByType
  /** The project's records as they stood when the modal opened. */
  saved: OutOfWarrantyEntries
  /** A role-user account: sees the records, changes nothing. */
  readOnly: boolean
  onDone: () => void
}

/** The modal's body. Mounted per open (the modal destroys it on close), so
 *  every open starts from the project's records as they are. */
const OutOfWarrantyForm: React.FC<FormProps> = ({ project, devices: devicesByType, saved, readOnly, onDone }) => {
  const { message, modal } = App.useApp()
  const save = useSaveOutOfWarranty(project.project_id)
  // The records the form opened on — what a save that leaves one out closes.
  const [openedWith] = useState(saved)
  const hadRecords = useMemo(() => Object.values(openedWith).some((entries) => !!entries?.length), [openedWith])
  // The first type with a record, else CCTV.
  const [typeKey, setTypeKey] = useState<OutOfWarrantyDeviceType>(() => initialTypeKey(saved))
  // One set of pages per type, in that type's table order.
  const [forms, setForms] = useState(() =>
    Object.fromEntries(
      OUT_OF_WARRANTY_TYPES.map((type) => [type.key, initialEntries(saved[type.key], devicesByType[type.key])]),
    ) as Record<OutOfWarrantyDeviceType, EntriesState>,
  )
  // The table page the user turned to (for this type); null = follow the
  // device on the form.
  const [tablePage, setTablePage] = useState<{ typeKey: OutOfWarrantyDeviceType; page: number } | null>(null)
  // The page whose missing fields are shown — set by a failed บันทึก, then
  // re-checked live as the user fills them in.
  const [checkKey, setCheckKey] = useState<string | null>(null)

  const devices = devicesByType[typeKey]
  const type = OUT_OF_WARRANTY_TYPES.find((option) => option.key === typeKey) ?? OUT_OF_WARRANTY_TYPES[0]
  const form = forms[typeKey]
  const current = form.entries.find((entry) => entry.key === form.currentKey) ?? form.entries[0]
  const currentIndex = form.entries.indexOf(current)
  const errors: EntryErrors = checkKey === current.key ? entryErrors(current) : {}
  const processing = Object.values(forms).some((state) => state.entries.some((entry) => entry.photos.some((photo) => photo.processing)))
  // Read-only and nothing recorded of this type: no page to show.
  const nothingToShow = readOnly && !current.deviceId

  const tablePages = Math.max(1, Math.ceil(devices.length / OUT_OF_WARRANTY_TABLE_PAGE_SIZE))
  const followPage = Math.ceil((deviceOrder(devices, current.deviceId) ?? 1) / OUT_OF_WARRANTY_TABLE_PAGE_SIZE)
  const page = Math.min(tablePage?.typeKey === typeKey ? tablePage.page : followPage, tablePages)

  const setForm = (key: OutOfWarrantyDeviceType, next: (state: EntriesState) => EntriesState) =>
    setForms((prev) => ({ ...prev, [key]: next(prev[key]) }))

  const onTypeChange = (next: OutOfWarrantyDeviceType) => {
    setTypeKey(next)
    setTablePage(null)
  }

  // Read-only: a row opens its record's page, if it has one.
  const onPick = (device: OutOfWarrantyDevice) =>
    setForm(typeKey, (state) => {
      if (!readOnly) return pickDevice(state, device.id, devices)
      const owner = state.entries.find((entry) => entry.deviceId === device.id)
      return owner ? { ...state, currentKey: owner.key } : state
    })

  const onEntryPage = (entryPage: number) => {
    setForm(typeKey, (state) => ({ ...state, currentKey: state.entries[entryPage - 1]?.key ?? state.currentKey }))
    setTablePage(null)
  }

  const showEntry = (key: OutOfWarrantyDeviceType, entryKey: string) => {
    setTypeKey(key)
    setForm(key, (state) => ({ ...state, currentKey: entryKey }))
    setTablePage(null)
  }

  const onAddPhotos = async (files: File[]) => {
    const entryKey = current.key
    const formKey = typeKey
    const images = files.filter((file) => PHOTO_TYPES.includes(file.type))
    if (images.length < files.length) message.error('รองรับเฉพาะไฟล์ JPEG, JPG, PNG')
    const slots = OUT_OF_WARRANTY_MAX_PHOTOS - current.photos.length
    if (images.length > slots) message.warning(`แนบรูปได้ไม่เกิน ${OUT_OF_WARRANTY_MAX_PHOTOS} รูป`)
    // Placeholders first, so a second drop while these shrink can't go past
    // the limit.
    const added = images.slice(0, Math.max(0, slots)).map((file, index) => ({
      photo: { uid: `${Date.now()}-${index}-${file.name}`, name: file.name, url: '', processing: true } as OutOfWarrantyPhoto,
      file,
    }))
    if (!added.length) return
    setForm(formKey, (state) => updateEntry(state, entryKey, (entry) => ({ photos: [...entry.photos, ...added.map((item) => item.photo)] })))
    await Promise.all(added.map(async ({ photo, file }) => {
      const shrunk = await compressImage(file, { maxEdge: OUT_OF_WARRANTY_PHOTO_EDGE })
      const ready = { ...photo, url: URL.createObjectURL(shrunk), file: shrunk, processing: false }
      setForm(formKey, (state) => updateEntry(state, entryKey, (entry) => ({
        photos: entry.photos.map((item) => (item.uid === photo.uid ? ready : item)),
      })))
    }))
  }

  const onRemovePhoto = (uid: string) =>
    setForm(typeKey, (state) => updateEntry(state, current.key, (entry) => ({ photos: entry.photos.filter((photo) => photo.uid !== uid) })))

  const onSubmit = async () => {
    const all: OutOfWarrantyEntries = Object.fromEntries(Object.entries(forms).map(([key, state]) => [key, state.entries]))
    const result = validateEntries(all, { typeKey, entryKey: current.key }, { allowEmpty: hadRecords })
    if (!result.ok) {
      showEntry(result.typeKey, result.entryKey)
      setCheckKey(result.entryKey)
      message.error('กรุณากรอกข้อมูลให้ครบทุกช่อง')
      return
    }
    // A record left out is closed — ask first.
    const dropped = droppedRecords(openedWith, result.records)
    if (dropped > 0) {
      const confirmed = await modal.confirm({
        title: 'ยืนยันการลบบันทึก',
        content: `บันทึกครั้งนี้จะลบบันทึกเดิม ${dropped} รายการที่ถูกล้างข้อมูลออก ต้องการบันทึกต่อหรือไม่`,
        okText: 'บันทึก',
        cancelText: 'ยกเลิก',
        centered: true,
      })
      if (!confirmed) return
    }
    const sent = recordsToSave(result.records)
    try {
      await save.mutateAsync(sent)
      message.success('บันทึกเงื่อนไขนอกค้ำประกันแล้ว')
      onDone()
    } catch (error) {
      const failure: SaveFailure = error instanceof OutOfWarrantySaveError ? error.failure : { kind: 'other' }
      // A 400 names the item it refused — open its page (most often a device
      // that came back online meanwhile).
      const item = failure.kind === 'invalid' ? failedItem(failure.message, sent) : null
      if (item) {
        showEntry(item.typeKey, item.entryKey)
        message.error('บันทึกอุปกรณ์หน้านี้ไม่ได้ — อุปกรณ์อาจกลับมาออนไลน์แล้ว กรุณาตรวจสอบอีกครั้ง')
        return
      }
      message.error(SAVE_FAILURE_MESSAGE[failure.kind])
    }
  }

  const full = current.photos.length >= OUT_OF_WARRANTY_MAX_PHOTOS

  return (
    <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6 lg:gap-8'>
      <section className='@container min-w-0 rounded-2xl bg-(--dark-black) p-4 lg:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.35)]'>
        <SectionTitle icon={<TbClipboardText />}>ข้อมูลโครงการ</SectionTitle>
        <ProjectFacts project={project} />

        <div className='flex flex-wrap items-center justify-between gap-3 mt-8 mb-4'>
          <SectionTitle icon={<TbTool />}>ข้อมูลอุปกรณ์</SectionTitle>
          <div className='flex items-center gap-3 w-full sm:w-auto'>
            <span
              className='inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 fs-12 shrink-0'
              style={{ borderColor: OFFLINE_COLOR, color: OFFLINE_COLOR }}
              title={readOnly ? `อุปกรณ์ ${type.label} ที่บันทึกไว้` : `อุปกรณ์ ${type.label} ที่ออฟไลน์`}
            >
              <TbTool className='fs-16' />
              {devices.length.toLocaleString('en-US')}
            </span>
            <ConfigProvider
              theme={{ components: { Select: { colorBorder: BLUE, hoverBorderColor: BLUE, activeBorderColor: BLUE, colorIcon: BLUE } } }}
            >
              <Select
                value={typeKey}
                onChange={onTypeChange}
                // How many of each type have something written — records of
                // another type are a switch away otherwise. Plain text: the
                // chosen option sits on yellow, where blue would not read.
                options={OUT_OF_WARRANTY_TYPES.map((option) => {
                  const filled = filledDeviceIds(forms[option.key].entries).size
                  return { value: option.key, label: filled > 0 ? `${option.label} (${filled})` : option.label }
                })}
                aria-label='ประเภทอุปกรณ์'
                className='flex-1 sm:flex-none sm:w-52'
              />
            </ConfigProvider>
          </div>
        </div>

        <DeviceTable
          devices={devices}
          typeLabel={type.label}
          page={page}
          selectedId={current.deviceId}
          filledIds={filledDeviceIds(form.entries)}
          emptyText={readOnly ? 'ไม่มีอุปกรณ์ที่บันทึกไว้' : 'ไม่มีอุปกรณ์ออฟไลน์'}
          onPick={onPick}
        />
        {devices.length > OUT_OF_WARRANTY_TABLE_PAGE_SIZE && (
          <div className='mt-4 flex justify-center'>
            <ModalPagination
              label='หน้าของตารางอุปกรณ์'
              current={page}
              total={devices.length}
              pageSize={OUT_OF_WARRANTY_TABLE_PAGE_SIZE}
              accent={BLUE}
              onChange={(next) => setTablePage({ typeKey, page: next })}
            />
          </div>
        )}
      </section>

      <section className='min-w-0 flex flex-col'>
        {nothingToShow ? (
          <Empty className='my-auto' description={<span className='fs-12'>{`ยังไม่มีบันทึกของ ${type.label}`}</span>} />
        ) : (
          <>
            <FieldLabel error={errors.device} required={!readOnly}>อุปกรณ์ออฟไลน์</FieldLabel>
            <Input
              size='large'
              readOnly
              value={current.deviceName}
              placeholder={`เลือกอุปกรณ์ ${type.label} จากตาราง`}
              status={errors.device ? 'error' : undefined}
            />
            <FieldError show={errors.device}>กรุณาเลือกอุปกรณ์จากตาราง</FieldError>

            <div className='mt-5'>
              <FieldLabel error={errors.cause} required={!readOnly}>ผลการตรวจสอบ / สาเหตุ</FieldLabel>
              <Input.TextArea
                size='large'
                value={current.cause}
                readOnly={readOnly}
                placeholder='กรุณาระบุผลการตรวจสอบ / สาเหตุ...'
                autoSize={{ minRows: 1, maxRows: 4 }}
                maxLength={500}
                status={errors.cause ? 'error' : undefined}
                onChange={(e) => {
                  const cause = e.target.value
                  setForm(typeKey, (state) => updateEntry(state, current.key, () => ({ cause })))
                }}
              />
              <FieldError show={errors.cause}>กรุณาระบุผลการตรวจสอบ / สาเหตุ</FieldError>
            </div>

            {/* antd sizes the drop box height:100% (its wrapper is an inline
                span), which in this flex column resolves against this whole
                field — thumbnails included — so the box spilled over + เพิ่ม
                อุปกรณ์. Dragger's own `style.height` is overwritten by its
                `height` prop, hence the class. */}
            <div className='mt-5 [&_.ant-upload-drag]:h-auto!'>
              <FieldLabel error={errors.photos} required={!readOnly}>รูปภาพความเสียหาย จำกัดไม่เกิน {OUT_OF_WARRANTY_MAX_PHOTOS} รูป</FieldLabel>
              {!readOnly && (
                <Upload.Dragger
                  accept='.jpg,.jpeg,.png'
                  multiple
                  disabled={full}
                  showUploadList={false}
                  fileList={[]}
                  // The whole drop at once (first file of the batch), so the
                  // two-photo limit is counted across it.
                  beforeUpload={(file, batch) => {
                    if (file === batch[0]) void onAddPhotos(batch)
                    return Upload.LIST_IGNORE
                  }}
                  style={{
                    background: 'transparent',
                    border: `1px dashed ${errors.photos ? OFFLINE_COLOR : '#FFFFFF66'}`,
                    borderRadius: 10,
                    opacity: full ? 0.5 : 1,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- same static icon as the maintenance uploads */}
                  <img src={`${BASE_PATH}/images/Maintenance/cloud-upload.png`} alt='' width={40} height={40} className='block mx-auto' />
                  <p className='fs-12 text-white mt-1'>{full ? `แนบครบ ${OUT_OF_WARRANTY_MAX_PHOTOS} รูปแล้ว` : 'ลากหรือวางไฟล์'}</p>
                  <p className='fs-12 text-(--light-gray-3)'>ไฟล์ JPEG, JPG, PNG</p>
                </Upload.Dragger>
              )}
              {current.photos.length > 0 ? (
                <div className='flex flex-wrap gap-2 mt-3'>
                  {current.photos.map((photo) => (
                    <PhotoThumb key={photo.uid} photo={photo} onRemove={readOnly ? undefined : () => onRemovePhoto(photo.uid)} />
                  ))}
                </div>
              ) : readOnly ? (
                <p className='fs-12 text-(--light-gray-3)'>ไม่มีรูป</p>
              ) : null}
              <FieldError show={errors.photos}>กรุณาแนบรูปความเสียหายอย่างน้อย 1 รูป</FieldError>
            </div>

            {!readOnly && (
              <Button type='primary' block icon={<TbPlus />} className='mt-5' onClick={() => setForm(typeKey, addEntry)}>
                <span className='fs-12'>เพิ่มอุปกรณ์</span>
              </Button>
            )}
          </>
        )}

        <div className='mt-auto pt-6 flex flex-wrap items-center justify-between gap-3'>
          {!nothingToShow && (
            <ModalPagination
              label='หน้าของรายการที่บันทึก'
              current={currentIndex + 1}
              total={form.entries.length}
              pageSize={1}
              accent={YELLOW}
              onChange={onEntryPage}
            />
          )}
          {!readOnly && (
            <div className='flex items-center gap-3 ml-auto'>
              <Button
                shape='round'
                disabled={save.isPending}
                onClick={() => setForm(typeKey, clearEntry)}
                className='border-none! bg-(--light-gray-3)! text-(--dark-black)! hover:opacity-85'
              >
                <span className='fs-12'>ล้างข้อมูล</span>
              </Button>
              <Button type='primary' shape='round' loading={save.isPending} disabled={processing} onClick={onSubmit}>
                <span className='fs-12'>บันทึก</span>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

/** Reads what the form needs — the project's records, and (for an account
 *  that may record) the devices it can record — then hands over. */
const OutOfWarrantyBody: React.FC<{ project: ProjectDeviceStatusBase; onDone: () => void }> = ({ project, onDone }) => {
  const { isAdmin, isContractor } = useUserRole()
  const canRecord = isAdmin || isContractor
  const records = useOutOfWarrantyRecords(project.project_id)
  const candidates = useOutOfWarrantyCandidates(project.project_id, canRecord)

  const view = useMemo(() => {
    if (!records.data || (canRecord && !candidates.data)) return null
    return {
      devices: canRecord && candidates.data ? candidateDevices(candidates.data) : recordDevices(records.data),
      saved: recordEntries(records.data),
    }
  }, [records.data, candidates.data, canRecord])

  if (records.isError || (canRecord && candidates.isError)) {
    return (
      <Empty
        className='py-16'
        description={<span className='fs-12'>โหลดข้อมูลอุปกรณ์ไม่สำเร็จ</span>}
      >
        <Button
          shape='round'
          onClick={() => {
            void records.refetch()
            if (canRecord) void candidates.refetch()
          }}
        >
          <span className='fs-12'>ลองอีกครั้ง</span>
        </Button>
      </Empty>
    )
  }
  if (!view) {
    return (
      <div className='flex justify-center py-24'>
        <Spin size='large' />
      </div>
    )
  }
  return <OutOfWarrantyForm project={project} devices={view.devices} saved={view.saved} readOnly={!canRecord} onDone={onDone} />
}

/** บันทึกเงื่อนไขนอกค้ำประกัน (Figma, user 2026-11-16) — the officer records,
 *  device by device, what took an offline device down when the warranty
 *  doesn't cover it (a car hit it, a cable cut or stolen, another accident):
 *  the inspection result and up to two photos. Left: the project and its
 *  offline devices of one type (the first with a record, else CCTV); right:
 *  one page per device — + เพิ่มอุปกรณ์ adds a page, the pages run in table
 *  order. A project with records opens on them, to add to or change. */
const OutOfWarrantyModal: React.FC<Props> = ({ project, onClose, onOpenProjectInfo }) => (
  <ConfigProvider
    theme={{ components: { Modal: { colorIcon: '#FFFFFF', contentBg: 'var(--light-black)', headerBg: 'var(--light-black)' } } }}
  >
    <Modal
      title={project && (
        <div className='pr-10'>
          <p className='fs-22 font-bold'>บันทึกเงื่อนไขนอกค้ำประกัน</p>
          <div className='flex items-start gap-2 mt-2 font-normal'>
            <span className='fs-12 text-(--light-gray-3)'>{project.project_name}</span>
            <TbInfoSquareRoundedFilled
              size={22}
              title='ดูข้อมูลโครงการ'
              className='shrink-0 text-white cursor-pointer hover:text-(--yellow)'
              onClick={() => onOpenProjectInfo(project)}
            />
          </div>
        </div>
      )}
      open={project !== null}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      width={{ xs: '96vw', xl: 1400 }}
      closable={{ 'aria-label': 'ปิด' }}
      styles={{ body: { maxHeight: '78vh', overflowY: 'auto', overflowX: 'hidden', paddingRight: 4 } }}
    >
      {project && <OutOfWarrantyBody project={project} onDone={onClose} />}
    </Modal>
  </ConfigProvider>
)

export default React.memo<Props>(OutOfWarrantyModal)
