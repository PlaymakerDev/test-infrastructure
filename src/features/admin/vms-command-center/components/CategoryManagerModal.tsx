"use client"
import React, { useState } from 'react'
import { App, Button, ConfigProvider, Input, Modal, Popconfirm, Skeleton } from 'antd'
import { TbCheck, TbPencil, TbPlus, TbTrash, TbX } from 'react-icons/tb'
import { useVMSSettingTypes } from '@/features/admin/control-vms/overall/hooks/useVMSSettingTypes'
import { usePostVMSSettingType } from '@/features/admin/control-vms/overall/hooks/usePostVMSSettingType'
import { usePutVMSSettingType } from '@/features/admin/control-vms/overall/hooks/usePutVMSSettingType'
import { useDeleteVMSSettingType } from '@/features/admin/control-vms/overall/hooks/useDeleteVMSSettingType'
import { useQueryClient } from '@tanstack/react-query'

interface Props {
  open: boolean
  onClose: () => void
}

const CategoryManagerModal: React.FC<Props> = ({ open, onClose }) => {
  const { message } = App.useApp()
  const qc = useQueryClient()
  const { data, isLoading } = useVMSSettingTypes()
  const rows = data?.data ?? []
  const post = usePostVMSSettingType()
  const put = usePutVMSSettingType()
  const del = useDeleteVMSSettingType()

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) {
      message.warning('พิมพ์ชื่อหมวดก่อน')
      return
    }
    try {
      await post.mutateAsync({ name })
      setNewName('')
      // media chip counts on library also depend on this list
      qc.invalidateQueries({ queryKey: ['vms-media-library'] })
    } catch {
      /* handled inside hook */
    }
  }

  const startEdit = (id: number, name: string) => {
    setEditingId(id)
    setEditingName(name)
  }
  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }
  const saveEdit = async (id: number) => {
    const name = editingName.trim()
    if (!name) {
      message.warning('พิมพ์ชื่อก่อน')
      return
    }
    try {
      await put.mutateAsync({ id, data: { name } })
      cancelEdit()
      qc.invalidateQueries({ queryKey: ['vms-media-library'] })
    } catch {
      /* handled inside hook */
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await del.mutateAsync(id)
      message.success('ลบหมวดหมู่เรียบร้อย')
      qc.invalidateQueries({ queryKey: ['vms-media-library'] })
    } catch {
      /* del hook handles error toast */
    }
  }

  return (
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
          Popconfirm: {
            colorText: '#1F1F1F',
            colorTextHeading: '#1F1F1F',
          },
        },
      }}
    >
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={<span style={{ color: '#1F1F1F' }}>จัดการหมวดหมู่</span>}
      wrapClassName="light-modal"
      width={520}
      destroyOnHidden
      styles={{ mask: { background: 'rgba(0,0,0,0.55)' } }}
    >
      <div className="space-y-3">
        <div className="text-xs text-slate-500">
          ใช้จัดหมวดสื่อในคลัง เช่น ไว้อาลัย · ซ่อมแซมถนน · เทศกาล เพื่อกรองง่ายเวลาสร้างคำสั่ง
        </div>

        {/* Add row */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="เพิ่มหมวดใหม่ เช่น 'แจ้งเหตุ'"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onPressEnter={handleAdd}
            disabled={post.isPending}
          />
          <Button
            type="primary"
            icon={<TbPlus style={{ verticalAlign: -2 }} />}
            onClick={handleAdd}
            loading={post.isPending}
            disabled={!newName.trim()}
          >
            เพิ่ม
          </Button>
        </div>

        {/* List */}
        <div className="rounded-md border border-[#E5E5E5] max-h-[360px] overflow-y-auto divide-y divide-[#F0F0F0]">
          {isLoading ? (
            <div className="p-4">
              <Skeleton active paragraph={{ rows: 3 }} />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">ยังไม่มีหมวดหมู่ — เพิ่มด้านบน</div>
          ) : (
            rows.map((t) => {
              const isEditing = editingId === t.id
              return (
                <div key={t.id} className="flex items-center gap-2 px-3 py-2">
                  {isEditing ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onPressEnter={() => saveEdit(t.id)}
                        autoFocus
                      />
                      <Button
                        type="primary"
                        icon={<TbCheck style={{ verticalAlign: -2 }} />}
                        onClick={() => saveEdit(t.id)}
                        loading={put.isPending}
                      >
                        บันทึก
                      </Button>
                      <Button icon={<TbX style={{ verticalAlign: -2 }} />} onClick={cancelEdit}>
                        ยกเลิก
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 text-sm text-slate-800 truncate">{t.name}</div>
                      <span className="text-[10px] text-slate-400">#{t.id}</span>
                      <Button
                        size="small"
                        icon={<TbPencil style={{ verticalAlign: -2 }} />}
                        onClick={() => startEdit(t.id, t.name)}
                      >
                        แก้ไข
                      </Button>
                      <Popconfirm
                        title="ลบหมวดนี้?"
                        description="สื่อในคลังที่อยู่ในหมวดนี้จะย้ายไปเป็น 'อื่นๆ' โดยอัตโนมัติ"
                        onConfirm={() => handleDelete(t.id)}
                        okText="ลบ"
                        okButtonProps={{ danger: true }}
                        cancelText="ยกเลิก"
                      >
                        <Button
                          size="small"
                          danger
                          icon={<TbTrash style={{ verticalAlign: -2 }} />}
                          loading={del.isPending}
                        >
                          ลบ
                        </Button>
                      </Popconfirm>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </Modal>
    </ConfigProvider>
  )
}

export default CategoryManagerModal
