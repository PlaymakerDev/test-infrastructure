import { PlusOutlined } from '@ant-design/icons'
import { Button, Input } from 'antd'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { TbTrash } from 'react-icons/tb'
import { VMSSettingType } from '@/types/control-vms/vms-api'
import { usePostVMSSettingType } from '../../../hooks/usePostVMSSettingType'
import { usePutVMSSettingType } from '../../../hooks/usePutVMSSettingType'
import { useDeleteVMSSettingType } from '../../../hooks/useDeleteVMSSettingType'

interface Props {
  data?: VMSSettingType[]
}

interface SettingListItem {
  id: number | null
  name: string
  original: string
}

interface FormUpdateTypeProps {
  setting_list: SettingListItem[]
}

const INIT_SETTING_ITEM: SettingListItem = {
  id: null,
  name: '',
  original: ''
}

const FormUpdateType: React.FC<Props> = (props) => {
  const { data } = props
  const postType = usePostVMSSettingType()
  const putType = usePutVMSSettingType()
  const deleteType = useDeleteVMSSettingType()

  const form = useForm<FormUpdateTypeProps>({
    defaultValues: {
      setting_list: (data ?? []).map((item) => ({ id: item.id, name: item.name, original: item.name }))
    }
  })

  const { control, getValues } = form

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'setting_list',
    keyName: 'key'
  })

  // AVOID STALE INDEX WHEN THE ARRAY SHIFTS WHILE A ROW'S MUTATION IS STILL IN FLIGHT
  const fieldsRef = useRef(fields)
  fieldsRef.current = fields

  const resolveIndex = useCallback((key: string) => {
    return fieldsRef.current.findIndex((item) => item.key === key)
  }, [])

  // PICK UP NEWLY-CREATED/CHANGED SERVER ITEMS (AFTER A MUTATION INVALIDATES THE QUERY)
  // WITHOUT CLOBBERING LOCAL DRAFT ROWS OR IN-PROGRESS EDITS, AND PRUNE ROWS DELETED ELSEWHERE
  useEffect(() => {
    const serverItems = data ?? []
    const current = getValues('setting_list') ?? []
    serverItems.forEach((item) => {
      const idx = current.findIndex((row) => row.id === item.id)
      if (idx === -1) {
        append({ id: item.id, name: item.name, original: item.name })
      } else if (current[idx].name === current[idx].original && current[idx].name !== item.name) {
        update(idx, { id: item.id, name: item.name, original: item.name })
      }
    })

    const serverIds = new Set(serverItems.map((item) => item.id))
    const afterSync = getValues('setting_list') ?? []
    const staleIndices = afterSync
      .map((row, idx) => (row.id !== null && !serverIds.has(row.id) ? idx : -1))
      .filter((idx) => idx !== -1)
    if (staleIndices.length) remove(staleIndices)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // KEYED BY THE ROW'S STABLE FIELD KEY, NOT THE SUBMITTED VALUE — TWO DRAFT ROWS WITH
  // IDENTICAL TEXT MUST NOT BOTH APPEAR PENDING WHEN ONLY ONE IS ACTUALLY IN FLIGHT
  const [addingKey, setAddingKey] = useState<string | null>(null)

  const handleAdd = useCallback((key: string, name: string) => {
    setAddingKey(key)
    postType.mutate({ name }, {
      onSuccess: () => {
        const idx = resolveIndex(key)
        if (idx !== -1) remove(idx)
      }
    })
  }, [postType, remove, resolveIndex])

  const handleEdit = useCallback((key: string, id: number, name: string) => {
    putType.mutate({ id, data: { name } }, {
      onSuccess: () => {
        const idx = resolveIndex(key)
        if (idx !== -1) update(idx, { id, name, original: name })
      }
    })
  }, [putType, update, resolveIndex])

  const handleDelete = useCallback((key: string, id: number) => {
    deleteType.mutate(id, {
      onSuccess: () => {
        const idx = resolveIndex(key)
        if (idx !== -1) remove(idx)
      }
    })
  }, [deleteType, remove, resolveIndex])

  return (
    <div>
      {fields.map((field, index) => (
        <section className='mb-5' key={field.key}>
          <Controller
            control={control}
            name={`setting_list.${index}.name`}
            render={({ field: controllerField }) => {
              const isNew = field.id === null
              const trimmed = controllerField.value.trim()
              const isDirty = trimmed !== field.original
              const showAction = isDirty && trimmed.length > 0
              const isPending = isNew
                ? postType.isPending && addingKey === field.key
                : (putType.isPending && putType.variables?.id === field.id) || (deleteType.isPending && deleteType.variables === field.id)

              const commit = () => {
                if (!showAction) return
                if (isNew) handleAdd(field.key, trimmed)
                else if (field.id !== null) handleEdit(field.key, field.id, trimmed)
              }

              return (
                <div className='flex items-end gap-2'>
                  <fieldset className='flex-1'>
                    <label>ชื่อประเภท <span className="text-red-500">*</span></label>
                    <Input
                      {...controllerField}
                      placeholder='กรุณากรอกชื่อประเภท...'
                      // size='large'
                      disabled={isPending}
                      onPressEnter={commit}
                    />
                  </fieldset>
                  {showAction ? (
                    <Button
                      type='primary'
                      htmlType='button'
                      loading={isPending}
                      disabled={isPending}
                      onClick={commit}
                    >
                      {isNew ? 'เพิ่ม' : 'แก้ไข'}
                    </Button>
                  ) : (
                    <TbTrash
                      className={`fs-18 text-red-500 shrink-0 mb-2 ${isPending ? 'opacity-50' : 'cursor-pointer'}`}
                      onClick={() => {
                        if (isPending) return
                        if (isNew) remove(index)
                        else if (field.id !== null) handleDelete(field.key, field.id)
                      }}
                    />
                  )}
                </div>
              )
            }}
          />
        </section>
      ))}

      <Button
        htmlType='button'
        type='primary'
        icon={<PlusOutlined />}
        onClick={() => append({ ...INIT_SETTING_ITEM })}
        className='w-full! lg:w-auto!'
      >
        เพิ่มประเภท
      </Button>
    </div>
  )
}

export default React.memo<Props>(FormUpdateType)
