"use client"
import React, { useMemo, useRef, useState } from 'react'
import { App, Button, Empty, Image, Input, Modal, Popconfirm, Select, Skeleton, Upload, Tooltip } from 'antd'
import type { UploadFile, RcFile } from 'antd/es/upload/interface'
import { TbCloudUpload, TbPencil, TbSearch, TbTrash, TbX } from 'react-icons/tb'
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

const isVideoName = (s: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(s)

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
          name: editName,
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

  // Upload handler — accept multiple files, upload each via /upload/vms,
  // then register with /vms/media.
  const [uploadCategory, setUploadCategory] = useState<number | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)

  const runUpload = async () => {
    if (uploadFiles.length === 0) return
    setUploading(true)
    let ok = 0
    let fail = 0
    for (const f of uploadFiles) {
      try {
        const form = new FormData()
        // upload service expects the form field to be named "upload".
        form.append('upload', f.originFileObj as RcFile)
        const uploadRes = await postUploadVMSAPI(form, true)
        const raw = uploadRes?.data as { path?: string; url?: string } | undefined
        const url = raw?.path ?? raw?.url
        if (!url) throw new Error('no url in response')
        await createMedia.mutateAsync({
          url,
          name: f.name,
          filename: f.name,
          mime_type: (f.originFileObj as RcFile).type,
          setting_type_id: uploadCategory ?? undefined,
        })
        ok++
      } catch {
        fail++
      }
    }
    setUploading(false)
    if (ok > 0) message.success(`อัปโหลด ${ok} ไฟล์สำเร็จ`)
    if (fail > 0) message.error(`ล้มเหลว ${fail} ไฟล์`)
    setUploadFiles([])
    if (fail === 0) setUploadOpen(false)
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

      {/* Upload modal */}
      <Modal
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        title="อัปโหลดสื่อใหม่"
        onOk={runUpload}
        okText={uploading ? 'กำลังอัปโหลด…' : 'อัปโหลด'}
        cancelText="ยกเลิก"
        confirmLoading={uploading}
        okButtonProps={{ disabled: uploadFiles.length === 0 }}
        classNames={{ wrapper: 'light-modal-popup' }}
      >
        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-500 mb-1">หมวดหมู่ (ไม่บังคับ)</div>
            <Select
              placeholder="เลือกหมวด — ว่างไว้ = 'อื่นๆ'"
              allowClear
              value={uploadCategory}
              onChange={(v) => setUploadCategory(v ?? null)}
              options={types.map((t) => ({ label: t.name, value: t.id }))}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">ไฟล์ (เลือกหลายไฟล์พร้อมกันได้)</div>
            <Upload.Dragger
              multiple
              beforeUpload={() => false}
              fileList={uploadFiles}
              onChange={({ fileList }) => setUploadFiles(fileList)}
              accept="image/*,video/mp4,video/webm"
            >
              <p className="ant-upload-drag-icon">
                <TbCloudUpload size={36} />
              </p>
              <p className="ant-upload-text">ลากไฟล์มาวางที่นี่หรือคลิกเพื่อเลือก</p>
              <p className="ant-upload-hint">รองรับรูปภาพและวิดีโอ</p>
            </Upload.Dragger>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onCancel={() => setEditing(null)}
        title="แก้ไขสื่อ"
        onOk={saveEdit}
        confirmLoading={updateMedia.isPending}
        okText="บันทึก"
        cancelText="ยกเลิก"
        classNames={{ wrapper: 'light-modal-popup' }}
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

      {/* Preview modal */}
      <Modal
        open={!!previewing}
        onCancel={() => setPreviewing(null)}
        footer={null}
        width={720}
        title={previewing?.name}
        closeIcon={<TbX />}
        classNames={{ wrapper: 'light-modal-popup' }}
      >
        {previewing &&
          (isVideoName(previewing.filename || previewing.url) ? (
            <video src={previewing.url} controls style={{ width: '100%' }} autoPlay />
          ) : (
            <Image src={previewing.url} alt="" width="100%" preview={false} />
          ))}
      </Modal>
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
