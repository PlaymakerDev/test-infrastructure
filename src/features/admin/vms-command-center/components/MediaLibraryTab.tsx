"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { App, Button, ConfigProvider, Empty, Image, Input, Modal, Popconfirm, Progress, Select, Skeleton, Tooltip } from 'antd'
import { TbAlertTriangle, TbCategory2, TbCircleCheckFilled, TbCloudUpload, TbPencil, TbSearch, TbTrash, TbX } from 'react-icons/tb'
import CategoryManagerModal from './CategoryManagerModal'
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
import { getThumbUrl } from '../utils/thumbnail'

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
  const [editCategory, setEditCategory] = useState<number | null>(null)

  const openEdit = (item: VMSMediaItem) => {
    setEditing(item)
    setEditCategory(item.setting_type_id ?? null)
  }
  const saveEdit = async () => {
    if (!editing) return
    try {
      await updateMedia.mutateAsync({
        id: editing.id,
        data: { setting_type_id: editCategory === null ? -1 : editCategory },
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

  // Single-file mode: pick just the first valid file, replacing any prior
  // staged item (its blob URL is revoked so we don't leak).
  const addStagedFiles = (files: FileList | File[]) => {
    const arr = Array.from(files)
    if (arr.length === 0) return
    const f = arr[0]
    if (f.size > MAX_MB * 1024 * 1024) {
      message.error(`ไฟล์ใหญ่เกิน ${MAX_MB}MB`)
      return
    }
    const isImg = f.type.startsWith('image/')
    const isVid = f.type.startsWith('video/')
    if (!isImg && !isVid) {
      message.error('รองรับเฉพาะไฟล์รูปและวิดีโอ')
      return
    }
    setStaged((prev) => {
      prev.forEach((s) => URL.revokeObjectURL(s.previewUrl))
      return [
        {
          key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file: f,
          previewUrl: URL.createObjectURL(f),
          isVideo: isVid,
          status: 'idle',
          progress: 0,
        },
      ]
    })
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
        // Derive a stable, non-user-facing display name from the URL (server
        // already renamed the file to a UUID like 019f26d4-….png). We store
        // the original filename in `filename` for search, but never expose it.
        const derived = (() => {
          const p = url.split('/').pop() || url
          return p.replace(/\.[^.]+$/, '')
        })()
        await createMedia.mutateAsync({
          url,
          name: derived,
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
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)

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
            icon={<TbCategory2 style={{ verticalAlign: -2 }} />}
            onClick={() => setCategoryManagerOpen(true)}
          >
            จัดการหมวดหมู่
          </Button>
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
                    className="cursor-pointer relative bg-black"
                    style={{ aspectRatio: '16/9' }}
                    onClick={() => setPreviewing(it)}
                  >
                    {/* Grid uses the .thumb.jpg sibling for BOTH images
                        and videos — backend ffmpeg-extracts the first
                        frame at upload. Videos fall back to a solid
                        placeholder if the thumb generation failed,
                        rather than loading a whole MP4 as a poster. */}
                    <img
                      src={getThumbUrl(it.url)}
                      alt={it.name}
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget
                        if (img.dataset.fallback !== '1') {
                          img.dataset.fallback = '1'
                          // For videos with no thumb, blank the src so
                          // the play badge overlay speaks for itself.
                          img.src = isVideo ? '' : it.url
                        }
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    {isVideo && (
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-lg">▶</span>
                      </span>
                    )}
                    {isVideo && (
                      <span className="absolute top-2 left-2 fs-12 px-1.5 py-0.5 rounded bg-black/70 text-white">
                        VIDEO
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="fs-12 flex items-center justify-between gap-2">
                      <span
                        className="px-1.5 py-0.5 rounded fs-12 font-medium truncate"
                        style={{
                          background: it.setting_type_name ? '#FCD11622' : 'rgba(255,255,255,0.08)',
                          color: it.setting_type_name ? '#FCD116' : 'rgba(255,255,255,0.6)',
                        }}
                      >
                        {it.setting_type_name || 'อื่นๆ'}
                      </span>
                      <Tooltip title={dayjs(it.uploaded_at).format('YYYY-MM-DD HH:mm')}>
                        <span className="text-white/50 fs-12">
                          {dayjs(it.uploaded_at).locale('th').fromNow()}
                        </span>
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
        <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between fs-12 text-white/60">
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
      <ConfigProvider
        theme={{
          components: {
            Modal: {
              contentBg: '#FFFFFF',
              headerBg: '#FFFFFF',
              footerBg: '#FFFFFF',
              colorIcon: '#1F1F1F',
              colorText: '#1F1F1F',
              titleColor: '#1F1F1F',
              borderRadiusLG: 12,
            },
            // Force Select + Input value/placeholder to render dark on the
            // white light-modal background — the app root sets colorText=white
            // globally, so without this the typed text and selected value are
            // white-on-white in these fields.
            Input: { colorText: '#1F1F1F', colorTextPlaceholder: '#B8B8B8' },
            Select: { colorText: '#1F1F1F', colorTextPlaceholder: '#B8B8B8' },
          },
        }}
      >
      <Modal
        open={uploadOpen}
        onCancel={closeUploadModal}
        title={<span style={{ color: '#1F1F1F' }}>อัปโหลดสื่อใหม่</span>}
        okText={uploading ? 'กำลังอัปโหลด…' : 'อัปโหลด'}
        cancelText="ปิด"
        onOk={runUpload}
        confirmLoading={uploading}
        okButtonProps={{ disabled: staged.length === 0 || uploading || staged[0]?.status === 'done' }}
        maskClosable={!uploading}
        closable={!uploading}
        destroyOnHidden
        width={640}
        wrapClassName="light-modal"
        styles={{ mask: { background: 'rgba(0,0,0,0.55)' } }}
      >
        <div className="space-y-3">
          <div>
            <div className="fs-12 text-slate-500 mb-1">หมวดหมู่ (ไม่บังคับ)</div>
            <Select
              placeholder="ปล่อยว่างไว้ = 'อื่นๆ'"
              allowClear
              value={uploadCategory ?? undefined}
              onChange={(v) => setUploadCategory(v ?? null)}
              disabled={uploading}
              options={types.map((t) => ({ label: t.name, value: t.id }))}
              classNames={{ popup: { root: 'light-modal-popup' } }}
              style={{ width: '100%' }}
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.length) addStagedFiles(e.target.files)
              e.target.value = ''
            }}
          />

          {staged.length === 0 ? (
            // Empty dropzone
            <div
              className="rounded-lg border-2 border-dashed transition-colors cursor-pointer text-center px-4 py-10"
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
                <TbCloudUpload size={48} />
              </div>
              <div className="mt-2 text-sm text-slate-700">ลากไฟล์มาวางที่นี่หรือคลิกเพื่อเลือก</div>
              <div className="fs-12 text-slate-500 mt-1">
                รองรับรูปภาพและวิดีโอ · 1 ไฟล์ต่อครั้ง · ขนาดไม่เกิน {MAX_MB}MB
              </div>
            </div>
          ) : (
            // Big preview of the selected file
            (() => {
              const s = staged[0]
              const border =
                s.status === 'done' ? '#22c55e' : s.status === 'error' ? '#ef4444' : '#E5E5E5'
              return (
                <div className="space-y-2">
                  <div
                    className="relative rounded-lg overflow-hidden border bg-black"
                    style={{ borderColor: border, aspectRatio: '16/9' }}
                  >
                    {s.isVideo ? (
                      <video
                        src={s.previewUrl}
                        controls
                        muted
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <img
                        src={s.previewUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    )}
                    {s.status === 'done' && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500 text-white fs-12 px-2 py-1 rounded">
                        <TbCircleCheckFilled size={14} /> อัปโหลดสำเร็จ
                      </div>
                    )}
                    {s.status === 'idle' && (
                      <button
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded"
                        title="ลบออก"
                        onClick={() => removeStaged(s.key)}
                      >
                        <TbX size={16} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between fs-12 text-slate-500">
                    <span>
                      {(s.file.size / 1024 / 1024).toFixed(2)} MB · {isVideoMime(s.file.type) ? 'วิดีโอ' : 'รูปภาพ'}
                    </span>
                    {s.status === 'idle' && (
                      <button
                        className="text-slate-700 hover:text-(--yellow) underline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        เปลี่ยนไฟล์
                      </button>
                    )}
                  </div>

                  {s.status !== 'idle' && (
                    <Progress
                      percent={s.progress}
                      status={s.status === 'error' ? 'exception' : s.status === 'done' ? 'success' : 'active'}
                      strokeColor="#FCD116"
                    />
                  )}
                  {s.status === 'error' && (
                    <div className="fs-12 text-red-500 mt-0.5 flex items-center gap-1">
                      <TbAlertTriangle size={12} /> {s.errorMsg}
                    </div>
                  )}
                </div>
              )
            })()
          )}
        </div>
      </Modal>
      </ConfigProvider>

      {/* ─── Edit modal (light-modal, follows settings pattern) ─── */}
      <ConfigProvider
        theme={{
          components: {
            Modal: {
              contentBg: '#FFFFFF',
              headerBg: '#FFFFFF',
              footerBg: '#FFFFFF',
              colorIcon: '#1F1F1F',
              colorText: '#1F1F1F',
              titleColor: '#1F1F1F',
              borderRadiusLG: 12,
            },
            // Force Select + Input value/placeholder to render dark on the
            // white light-modal background — the app root sets colorText=white
            // globally, so without this the typed text and selected value are
            // white-on-white in these fields.
            Input: { colorText: '#1F1F1F', colorTextPlaceholder: '#B8B8B8' },
            Select: { colorText: '#1F1F1F', colorTextPlaceholder: '#B8B8B8' },
          },
        }}
      >
      <Modal
        open={!!editing}
        onCancel={() => setEditing(null)}
        title={<span style={{ color: '#1F1F1F' }}>แก้ไขสื่อ</span>}
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
            <div className="rounded overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
              {isVideoName(editing.filename || editing.url) ? (
                <video src={editing.url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Image src={editing.url} alt="" preview={false} width="100%" height="100%" style={{ objectFit: 'contain' }} />
              )}
            </div>
            <div>
              <div className="fs-12 text-slate-500 mb-1">หมวดหมู่</div>
              <Select
                placeholder="อื่นๆ"
                allowClear
                value={editCategory ?? undefined}
                onChange={(v) => setEditCategory(v ?? null)}
                options={types.map((t) => ({ label: t.name, value: t.id }))}
                classNames={{ popup: { root: 'light-modal-popup' } }}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </Modal>
      </ConfigProvider>

      {/* ─── Preview modal — DARK, CCTVModal pattern ─── */}
      <ConfigProvider theme={{ components: { Modal: { colorIcon: '#FFFFFF' } } }}>
        <Modal
          open={!!previewing}
          onCancel={() => setPreviewing(null)}
          footer={null}
          width={900}
          title={previewing?.setting_type_name || 'สื่อ'}
          closable={{ 'aria-label': 'Close' }}
          destroyOnHidden
          classNames={{ container: 'border-2! border-(--default-blue)!' }}
        >
          {previewing && (
            <div>
              <div className="bg-black rounded overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {isVideoName(previewing.filename || previewing.url) ? (
                  <video
                    src={previewing.url}
                    controls
                    autoPlay
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <Image
                    src={previewing.url}
                    alt=""
                    width="100%"
                    height="100%"
                    preview={false}
                    style={{ objectFit: 'contain' }}
                  />
                )}
              </div>
              <div className="mt-3 fs-12 text-white/70 flex items-center gap-3 flex-wrap">
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

      {/* Category CRUD */}
      <CategoryManagerModal open={categoryManagerOpen} onClose={() => setCategoryManagerOpen(false)} />
    </div>
  )
}

const Chip: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className="fs-12 px-3 py-1 rounded-full transition-colors border"
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
