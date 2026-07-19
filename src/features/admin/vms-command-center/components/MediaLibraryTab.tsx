"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { App, Button, ConfigProvider, Empty, Image, Input, Modal, Popconfirm, Progress, Select, Skeleton, Tooltip } from 'antd'
import { TbAlertTriangle, TbCircleCheckFilled, TbCloudUpload, TbPencil, TbPlus, TbSearch, TbTrash, TbX } from 'react-icons/tb'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'
import { useVMSSettingTypes } from '@/features/admin/control-vms/overall/hooks/useVMSSettingTypes'
import {
  useBulkDeleteVMSMedia,
  useCreateVMSMedia,
  useDeleteVMSMedia,
  useMediaCategoryCounts,
  useMediaLibraryList,
  useUpdateVMSMedia,
} from '../hooks/useMediaLibrary'
import { postUploadVMSAPI } from '@/services/routes/SharedService'
import type { VMSMediaItem } from '@/types/vms/media-library-api'

dayjs.extend(relativeTime)

const isVideoMime = (mime: string) => mime.startsWith('video/')
const isVideoName = (s: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(s)
const ACCEPT = 'image/*,video/mp4,video/webm'
const MAX_MB = 15

interface StagedFile {
  key: string
  file: File
  previewUrl: string
  isVideo: boolean
  status: 'idle' | 'uploading' | 'done' | 'error'
  progress: number
  errorMsg?: string
}

const MediaLibraryTab: React.FC = () => {
  const { message } = App.useApp()
  const { data: typesData } = useVMSSettingTypes()
  const types = typesData?.data ?? []

  const [categoryFilter, setCategoryFilter] = useState<'all' | number>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const listParams = useMemo(
    () => ({
      setting_type_id: categoryFilter === 'all' ? undefined : categoryFilter,
      search: search.trim() || undefined,
      limit: 24,
      page,
    }),
    [categoryFilter, search, page]
  )

  const { data: listData, isLoading, isFetching } = useMediaLibraryList(listParams)
  const rows: VMSMediaItem[] = listData?.data?.res_data ?? []
  const meta = listData?.data?.meta_data
  const { data: countsData } = useMediaCategoryCounts()
  const counts = countsData?.data ?? []
  const totalCount = counts.reduce((acc, c) => acc + c.count, 0)

  const createMedia = useCreateVMSMedia()
  const updateMedia = useUpdateVMSMedia()
  const deleteMedia = useDeleteVMSMedia()
  const bulkDelete = useBulkDeleteVMSMedia()

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const toggleSelected = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const [editing, setEditing] = useState<VMSMediaItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState<number | null>(null)

  const openEdit = (item: VMSMediaItem) => {
    setEditing(item)
    setEditName(item.name)
    setEditCategory(item.setting_type_id ?? null)
  }
  const saveEdit = async () => {
    if (!editing) return
    try {
      await updateMedia.mutateAsync({
        id: editing.id,
        data: {
          name: editName.trim() || editing.name,
          setting_type_id: editCategory === null ? -1 : editCategory,
        },
      })
      message.success('บันทึกเรียบร้อย')
      setEditing(null)
    } catch {
      message.error('บันทึกไม่สำเร็จ')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteMedia.mutateAsync(id)
      message.success('ลบเรียบร้อย')
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch {
      message.error('ลบไม่สำเร็จ')
    }
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    try {
      await bulkDelete.mutateAsync(Array.from(selected))
      message.success(`ลบ ${selected.size} รายการเรียบร้อย`)
      setSelected(new Set())
    } catch {
      message.error('ลบไม่สำเร็จ')
    }
  }

  // ── Upload state ────────────────────────────────────────────────────────
  const [uploadCategory, setUploadCategory] = useState<number | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [staged, setStaged] = useState<StagedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Free blob URLs when the staged list changes/unmounts.
  useEffect(() => {
    return () => {
      staged.forEach((s) => URL.revokeObjectURL(s.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addStagedFiles = (files: FileList | File[]) => {
    const arr = Array.from(files)
    const next: StagedFile[] = []
    for (const f of arr) {
      if (f.size > MAX_MB * 1024 * 1024) {
        message.error(`"${f.name}" ใหญ่เกิน ${MAX_MB}MB — ข้าม`)
        continue
      }
      const isImg = f.type.startsWith('image/')
      const isVid = f.type.startsWith('video/')
      if (!isImg && !isVid) {
        message.error(`"${f.name}" ไม่ใช่รูป/วิดีโอที่รองรับ — ข้าม`)
        continue
      }
      next.push({
        key: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 6)}`,
        file: f,
        previewUrl: URL.createObjectURL(f),
        isVideo: isVid,
        status: 'idle',
        progress: 0,
      })
    }
    if (next.length) setStaged((prev) => [...prev, ...next])
  }

  const removeStaged = (key: string) => {
    setStaged((prev) => {
      const gone = prev.find((s) => s.key === key)
      if (gone) URL.revokeObjectURL(gone.previewUrl)
      return prev.filter((s) => s.key !== key)
    })
  }

  const resetUpload = () => {
    staged.forEach((s) => URL.revokeObjectURL(s.previewUrl))
    setStaged([])
    setUploadCategory(null)
  }

  const closeUploadModal = () => {
    if (uploading) return
    resetUpload()
    setUploadOpen(false)
  }

  const runUpload = async () => {
    if (staged.length === 0 || uploading) return
    setUploading(true)
    // sequential — keeps progress readable + avoids overwhelming small upload service
    let ok = 0
    let fail = 0
    for (const s of staged) {
      if (s.status === 'done') continue
      setStaged((prev) => prev.map((x) => (x.key === s.key ? { ...x, status: 'uploading', progress: 5 } : x)))
      try {
        const form = new FormData()
        form.append('upload', s.file)
        const uploadRes = await postUploadVMSAPI(form, true)
        // simulate progress up to 80 while server processes (axios doesn't expose upload progress w/o config)
        setStaged((prev) => prev.map((x) => (x.key === s.key ? { ...x, progress: 80 } : x)))
        const raw = uploadRes?.data as { path?: string; url?: string } | undefined
        const url = raw?.path ?? raw?.url
        if (!url) throw new Error('no url in response')
        await createMedia.mutateAsync({
          url,
          name: s.file.name,
          filename: s.file.name,
          mime_type: s.file.type,
          setting_type_id: uploadCategory ?? undefined,
        })
        setStaged((prev) => prev.map((x) => (x.key === s.key ? { ...x, status: 'done', progress: 100 } : x)))
        ok++
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'อัปโหลดล้มเหลว'
        setStaged((prev) => prev.map((x) => (x.key === s.key ? { ...x, status: 'error', progress: 0, errorMsg: msg } : x)))
        fail++
      }
    }
    setUploading(false)
    if (ok > 0) message.success(`อัปโหลด ${ok} ไฟล์สำเร็จ`)
    if (fail > 0) message.error(`ล้มเหลว ${fail} ไฟล์ — ลองใหม่ได้`)
    if (fail === 0) {
      // brief pause so user sees the ✓ then close
      setTimeout(() => {
        resetUpload()
        setUploadOpen(false)
      }, 500)
    }
  }

  const [previewing, setPreviewing] = useState<VMSMediaItem | null>(null)

  return (
    <div className="h-full flex flex-col bg-(--dark-black) rounded-xl overflow-hidden text-white/90">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 flex-wrap">
        <div className="text-sm font-semibold text-(--yellow)">คลังสื่อ ({totalCount})</div>
        <Input
          allowClear
          placeholder="ค้นหาชื่อรูป/วิดีโอ..."
          prefix={<TbSearch className="text-(--yellow)" />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          style={{ width: 280 }}
        />
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {selected.size > 0 && (
            <Popconfirm
              title={`ลบ ${selected.size} รายการที่เลือก?`}
              onConfirm={handleBulkDelete}
              okText="ลบ"
              okButtonProps={{ danger: true }}
              cancelText="ยกเลิก"
            >
              <Button danger icon={<TbTrash style={{ verticalAlign: -2 }} />} loading={bulkDelete.isPending}>
                ลบที่เลือก ({selected.size})
              </Button>
            </Popconfirm>
          )}
          <Button
            type="primary"
            icon={<TbCloudUpload style={{ verticalAlign: -2 }} />}
            onClick={() => setUploadOpen(true)}
          >
            อัปโหลดสื่อ
          </Button>
        </div>
      </div>

      {/* Category chips */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2 flex-wrap">
        <Chip
          active={categoryFilter === 'all'}
          onClick={() => {
            setCategoryFilter('all')
            setPage(1)
          }}
          label={`ทั้งหมด (${totalCount})`}
        />
        {counts.map((c) => (
          <Chip
            key={c.setting_type_id ?? 'null'}
            active={categoryFilter === (c.setting_type_id ?? -1)}
            onClick={() => {
              setCategoryFilter(c.setting_type_id ?? -1)
              setPage(1)
            }}
            label={`${c.setting_type_name} (${c.count})`}
          />
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : rows.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Empty description="ยังไม่มีสื่อในหมวดนี้" />
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}
          >
            {rows.map((it) => {
              const isSelected = selected.has(it.id)
              const isVideo = isVideoName(it.filename || it.url)
              return (
                <div
                  key={it.id}
                  className="group relative rounded-lg overflow-hidden border bg-black/40 transition-all"
                  style={{
                    borderColor: isSelected ? '#FCD116' : 'rgba(255,255,255,0.10)',
                    outline: isSelected ? '2px solid #FCD116' : 'none',
                    outlineOffset: -2,
                  }}
                >
                  <div
                    className="cursor-pointer relative"
                    style={{ aspectRatio: '16/10' }}
                    onClick={() => setPreviewing(it)}
                  >
                    {isVideo ? (
                      <video
                        src={it.url}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        muted
                        playsInline
                      />
                    ) : (
                      <Image
                        src={it.url}
                        alt={it.name}
                        preview={false}
                        width="100%"
                        height="100%"
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                    {isVideo && (
                      <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white">
                        VIDEO
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="text-xs truncate text-white/90" title={it.name}>
                      {it.name}
                    </div>
                    <div className="text-[11px] text-white/50 mt-0.5 flex items-center justify-between">
                      <span>{it.setting_type_name || 'อื่นๆ'}</span>
                      <Tooltip title={dayjs(it.uploaded_at).format('YYYY-MM-DD HH:mm')}>
                        <span>{dayjs(it.uploaded_at).locale('th').fromNow()}</span>
                      </Tooltip>
                    </div>
                  </div>
                  {/* Hover action bar */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 rounded bg-black/70 hover:bg-black text-white"
                      title={isSelected ? 'ยกเลิกเลือก' : 'เลือก'}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelected(it.id)
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ pointerEvents: 'none' }}
                      />
                    </button>
                    <button
                      className="p-1.5 rounded bg-black/70 hover:bg-black text-white"
                      title="แก้ไข"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEdit(it)
                      }}
                    >
                      <TbPencil size={14} />
                    </button>
                    <Popconfirm
                      title="ลบสื่อนี้?"
                      description="ประวัติคำสั่งเก่าจะไม่ถูกลบ (เก็บ URL ไว้)"
                      onConfirm={(e) => {
                        e?.stopPropagation?.()
                        handleDelete(it.id)
                      }}
                      onCancel={(e) => e?.stopPropagation?.()}
                      okText="ลบ"
                      okButtonProps={{ danger: true }}
                      cancelText="ยกเลิก"
                    >
                      <button
                        className="p-1.5 rounded bg-black/70 hover:bg-red-600 text-white"
                        title="ลบ"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TbTrash size={14} />
                      </button>
                    </Popconfirm>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Paging */}
      {meta && meta.total_pages > 1 && (
        <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
          <div>
            หน้า {meta.page} / {meta.total_pages} · {meta.count} รายการ
            {isFetching && <span className="ml-2 opacity-70">(กำลังโหลด…)</span>}
          </div>
          <div className="flex gap-2">
            <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ← ก่อนหน้า
            </Button>
            <Button
              size="small"
              disabled={page >= meta.total_pages}
              onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
            >
              ถัดไป →
            </Button>
          </div>
        </div>
      )}

      {/* ─── Upload modal (light-modal, follows settings pattern) ─── */}
      <Modal
        open={uploadOpen}
        onCancel={closeUploadModal}
        title={
          <span>
            อัปโหลดสื่อใหม่ {staged.length > 0 && <span className="text-slate-500 text-sm">({staged.length} ไฟล์)</span>}
          </span>
        }
        okText={uploading ? 'กำลังอัปโหลด…' : `อัปโหลด (${staged.filter((s) => s.status !== 'done').length})`}
        cancelText="ปิด"
        onOk={runUpload}
        confirmLoading={uploading}
        okButtonProps={{ disabled: staged.length === 0 || uploading || staged.every((s) => s.status === 'done') }}
        maskClosable={!uploading}
        closable={!uploading}
        destroyOnHidden
        width={720}
        wrapClassName="light-modal"
        styles={{ mask: { background: 'rgba(0,0,0,0.55)' } }}
      >
        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-500 mb-1">หมวดหมู่ (ไม่บังคับ)</div>
            <Select
              placeholder="ปล่อยว่างไว้ = 'อื่นๆ'"
              allowClear
              value={uploadCategory ?? undefined}
              onChange={(v) => setUploadCategory(v ?? null)}
              disabled={uploading}
              options={types.map((t) => ({ label: t.name, value: t.id }))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Custom drop zone */}
          <div
            className="rounded-lg border-2 border-dashed transition-colors cursor-pointer text-center px-4 py-6"
            style={{
              borderColor: isDragOver ? '#FCD116' : '#D9D9D9',
              background: isDragOver ? 'rgba(252,209,22,0.06)' : '#FAFAFA',
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragOver(false)
              if (uploading) return
              if (e.dataTransfer.files?.length) addStagedFiles(e.dataTransfer.files)
            }}
            onClick={() => {
              if (uploading) return
              fileInputRef.current?.click()
            }}
          >
            <div className="flex items-center justify-center text-slate-500">
              <TbCloudUpload size={36} />
            </div>
            <div className="mt-2 text-sm text-slate-700">ลากไฟล์มาวางที่นี่หรือคลิกเพื่อเลือก</div>
            <div className="text-xs text-slate-500 mt-1">
              รองรับรูปภาพและวิดีโอ (ขนาดไม่เกิน {MAX_MB}MB / ไฟล์)
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT}
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.length) addStagedFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>

          {/* Staged file list */}
          {staged.length > 0 && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {staged.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center gap-3 rounded-md border p-2"
                  style={{
                    borderColor:
                      s.status === 'done'
                        ? '#22c55e'
                        : s.status === 'error'
                        ? '#ef4444'
                        : '#E5E5E5',
                    background: '#FFFFFF',
                  }}
                >
                  <div className="w-16 h-12 rounded overflow-hidden bg-slate-100 shrink-0">
                    {s.isVideo ? (
                      <video src={s.previewUrl} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={s.previewUrl} alt={s.file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-slate-800 truncate" title={s.file.name}>
                      {s.file.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {(s.file.size / 1024 / 1024).toFixed(2)} MB · {isVideoMime(s.file.type) ? 'วิดีโอ' : 'รูป'}
                    </div>
                    {s.status !== 'idle' && (
                      <div className="mt-1">
                        <Progress
                          percent={s.progress}
                          size="small"
                          status={
                            s.status === 'error' ? 'exception' : s.status === 'done' ? 'success' : 'active'
                          }
                          showInfo={false}
                        />
                      </div>
                    )}
                    {s.status === 'error' && (
                      <div className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                        <TbAlertTriangle size={12} /> {s.errorMsg}
                      </div>
                    )}
                  </div>
                  {s.status === 'done' ? (
                    <TbCircleCheckFilled className="text-green-500" size={20} />
                  ) : (
                    <button
                      className="p-1.5 rounded text-slate-500 hover:bg-slate-100"
                      title="ลบออกจากรายการ"
                      onClick={() => removeStaged(s.key)}
                      disabled={uploading}
                    >
                      <TbX size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ─── Edit modal (light-modal, follows settings pattern) ─── */}
      <Modal
        open={!!editing}
        onCancel={() => setEditing(null)}
        title="แก้ไขสื่อ"
        onOk={saveEdit}
        confirmLoading={updateMedia.isPending}
        okText="บันทึก"
        cancelText="ยกเลิก"
        destroyOnHidden
        width={520}
        wrapClassName="light-modal"
        styles={{ mask: { background: 'rgba(0,0,0,0.55)' } }}
      >
        {editing && (
          <div className="space-y-3">
            <div className="rounded overflow-hidden bg-slate-100" style={{ aspectRatio: '16/10' }}>
              {isVideoName(editing.filename || editing.url) ? (
                <video src={editing.url} controls style={{ width: '100%', height: '100%' }} />
              ) : (
                <Image src={editing.url} alt="" preview={false} width="100%" height="100%" style={{ objectFit: 'cover' }} />
              )}
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">ชื่อ</div>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">หมวดหมู่</div>
              <Select
                placeholder="อื่นๆ"
                allowClear
                value={editCategory ?? undefined}
                onChange={(v) => setEditCategory(v ?? null)}
                options={types.map((t) => ({ label: t.name, value: t.id }))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Preview modal — DARK, CCTVModal pattern ─── */}
      <ConfigProvider theme={{ components: { Modal: { colorIcon: '#FFFFFF' } } }}>
        <Modal
          open={!!previewing}
          onCancel={() => setPreviewing(null)}
          footer={null}
          width={900}
          title={previewing?.name}
          closable={{ 'aria-label': 'Close' }}
          destroyOnHidden
          classNames={{ container: 'border-2! border-(--default-blue)!' }}
        >
          {previewing && (
            <div>
              {isVideoName(previewing.filename || previewing.url) ? (
                <video src={previewing.url} controls style={{ width: '100%' }} autoPlay />
              ) : (
                <Image src={previewing.url} alt="" width="100%" preview={false} />
              )}
              <div className="mt-3 text-xs text-white/70 flex items-center gap-3 flex-wrap">
                <span>หมวด: <b className="text-white">{previewing.setting_type_name || 'อื่นๆ'}</b></span>
                <span>อัปโหลด: {dayjs(previewing.uploaded_at).format('DD MMM YYYY HH:mm')} · {dayjs(previewing.uploaded_at).locale('th').fromNow()}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  icon={<TbPencil style={{ verticalAlign: -2 }} />}
                  onClick={() => {
                    const it = previewing
                    setPreviewing(null)
                    openEdit(it)
                  }}
                >
                  แก้ไข
                </Button>
                <Popconfirm
                  title="ลบสื่อนี้?"
                  description="ประวัติคำสั่งเก่าจะไม่ถูกลบ"
                  onConfirm={async () => {
                    const id = previewing.id
                    setPreviewing(null)
                    await handleDelete(id)
                  }}
                  okText="ลบ"
                  okButtonProps={{ danger: true }}
                  cancelText="ยกเลิก"
                >
                  <Button danger icon={<TbTrash style={{ verticalAlign: -2 }} />}>
                    ลบ
                  </Button>
                </Popconfirm>
              </div>
            </div>
          )}
        </Modal>
      </ConfigProvider>
    </div>
  )
}

const Chip: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className="text-xs px-3 py-1 rounded-full transition-colors border"
    style={{
      background: active ? '#FCD116' : 'transparent',
      color: active ? '#191919' : '#FCD116',
      borderColor: '#FCD116',
      fontWeight: active ? 600 : 400,
    }}
  >
    {label}
  </button>
)

export default MediaLibraryTab
