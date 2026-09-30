"use client"
import { App, Button, ConfigProvider, Empty, Modal, Select, Spin } from 'antd'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { TbPencilMinus, TbRoad } from 'react-icons/tb'
import { useQueryClient } from '@tanstack/react-query'
import { useProjectDetail, useUpdateProject } from '@/hooks/queries/manage'
import { useRoadsInfinite } from '@/hooks/queries/shared/useRoadsInfinite'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectModalOpen } from '@/stores/reducers/modal/customModalSlice'
import { errText, useProjectContext } from '../context'
import {
  buildAddRoadBody,
  missingFieldsFromError,
  missingProjectFields,
  projectRoadLinks,
  roadLabel,
  type ProjectDetailWithRoads,
} from '../data/projectRoads'

interface Props {
  open: boolean
  onClose: () => void
  /** After the road is in — TitleSection switches to its tab. */
  onAdded?: (roadId: number) => void
}

/** เพิ่มสายทาง — one road per save (user 2026-09-29), next to the road tabs and
 *  on a project that has none yet. The backend has no add-one-road call, so
 *  this re-sends the project with the road appended (see buildAddRoadBody);
 *  the full project form stays the place to change several roads at once. */
const ModalAddRoad: React.FC<Props> = (props) => {
  const { open, onClose, onAdded } = props
  const { id } = useProjectContext()
  const projectId = typeof id === 'string' && id ? Number(id) : null
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const [roadId, setRoadId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setChecking] = useState(false)

  const {
    data: detailData,
    isLoading: isDetailLoading,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useProjectDetail(open ? projectId : null)
  const detail = detailData as ProjectDetailWithRoads | undefined
  const missing = useMemo(() => (detail ? missingProjectFields(detail) : []), [detail])
  const linkedRoadIds = useMemo(
    () => new Set((detail ? projectRoadLinks(detail) : []).map((link) => link.road_id)),
    [detail],
  )

  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject()
  const isBusy = isChecking || isUpdating

  // Server-searched, infinite-scrolled — same road list as the project form.
  const [roadSearch, setRoadSearch] = useState('')
  const roadSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const {
    data: roadPages,
    isLoading: isRoadsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useRoadsInfinite(roadSearch, { enabled: open })

  const handleRoadSearch = useCallback((value: string) => {
    if (roadSearchTimerRef.current) clearTimeout(roadSearchTimerRef.current)
    roadSearchTimerRef.current = setTimeout(() => setRoadSearch(value), 400)
  }, [])

  const handleRoadPopupScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // A road the project already has stays listed, greyed out, so searching for
  // it explains itself instead of coming up empty.
  const roadOptions = useMemo(() => {
    const rows = roadPages?.pages.flatMap((page) => page.data.res_data ?? []) ?? []
    return rows.map((road) => {
      const isLinked = linkedRoadIds.has(road.id as number)
      return {
        value: road.id as number,
        label: isLinked ? `${roadLabel(road)} (มีในโครงการแล้ว)` : roadLabel(road),
        disabled: isLinked,
      }
    })
  }, [roadPages, linkedRoadIds])

  const handleClose = useCallback(() => {
    if (roadSearchTimerRef.current) clearTimeout(roadSearchTimerRef.current)
    setRoadId(null)
    setError(null)
    setRoadSearch('')
    onClose()
  }, [onClose])

  // The fields the backend wants are edited in the full project form, which
  // this page already mounts (ModalCreateProject).
  const openProjectForm = useCallback(() => {
    if (projectId == null) return
    handleClose()
    dispatch(setProjectModalOpen({ open: true, type: 'UPDATE', data: { id: projectId } }))
  }, [dispatch, handleClose, projectId])

  const handleSubmit = useCallback(async () => {
    if (roadId == null) {
      setError('กรุณาเลือกสายทาง')
      return
    }
    // Re-read the project right before writing: the PUT replaces the road
    // list, so a road someone else added in the meantime must go back too.
    setChecking(true)
    const fresh = await refetchDetail()
    setChecking(false)
    const current = fresh.data as ProjectDetailWithRoads | undefined
    if (!current) {
      message.error('โหลดข้อมูลโครงการไม่สำเร็จ กรุณาลองอีกครั้ง')
      return
    }
    // Missing fields show the notice in place of the picker from here on.
    if (missingProjectFields(current).length) return
    if (projectRoadLinks(current).some((link) => link.road_id === roadId)) {
      setError('สายทางนี้อยู่ในโครงการแล้ว')
      return
    }
    updateProject(buildAddRoadBody(current, roadId), {
      onSuccess: () => {
        message.success('เพิ่มสายทางสำเร็จ')
        // TitleSection/EmptyRoadSolution read these under hand-written keys
        // that useUpdateProject's invalidation doesn't reach.
        queryClient.invalidateQueries({ queryKey: ['project', id] })
        queryClient.invalidateQueries({ queryKey: ['roadSolution', id] })
        handleClose()
        onAdded?.(roadId)
      },
      onError: (err) => {
        const fields = missingFieldsFromError(err)
        message.error(fields.length ? `ข้อมูลโครงการยังไม่ครบ: ${fields.join(', ')}` : errText(err, 'เพิ่มสายทางไม่สำเร็จ'))
      },
    })
  }, [roadId, refetchDetail, updateProject, message, queryClient, id, handleClose, onAdded])

  const renderBody = () => {
    if (isDetailLoading) {
      return <div className='flex justify-center py-10'><Spin /></div>
    }
    if (isDetailError || !detail) {
      return <Empty description='โหลดข้อมูลโครงการไม่สำเร็จ' />
    }
    if (missing.length) {
      return (
        <div className='rounded-lg border border-(--default-orange) bg-(--default-orange)/20 p-5 text-center'>
          <h4>ยังเพิ่มสายทางไม่ได้</h4>
          <p>
            โครงการนี้ยังไม่มี <span className='font-semibold text-(--yellow)'>{missing.join(', ')}</span>
          </p>
          <p>ซึ่งระบบต้องใช้ทุกครั้งที่บันทึกการแก้ไขโครงการ</p>
          <p>กรุณาเพิ่มในหน้าแก้ไขข้อมูลโครงการก่อน</p>
          <Button
            type='primary'
            shape='round'
            className='mt-4'
            icon={<TbPencilMinus />}
            onClick={openProjectForm}
          >
            <p className='fs-12'>แก้ไขข้อมูลโครงการ</p>
          </Button>
        </div>
      )
    }
    return (
      <fieldset>
        <label className='text-(--yellow)'>สายทาง <span className='text-red-500'>*</span></label>
        <Select
          value={roadId ?? undefined}
          placeholder='กรุณาเลือกสายทาง...'
          size='large'
          className='w-full!'
          options={roadOptions}
          loading={isRoadsLoading}
          status={error ? 'error' : undefined}
          showSearch={{ filterOption: false, onSearch: handleRoadSearch }}
          onPopupScroll={handleRoadPopupScroll}
          notFoundContent={isRoadsLoading ? <Spin size='small' /> : 'ไม่พบสายทาง'}
          onChange={(value) => {
            setRoadId(value ?? null)
            setError(null)
          }}
        />
        {error && <p className='fs-12 text-red-500'>{error}</p>}
      </fieldset>
    )
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#FFFFFF',
            borderRadiusLG: 20,
          },
        },
      }}
    >
      <Modal
        title={
          <div className='flex items-center flex-wrap gap-3'>
            <TbRoad className='fs-24 text-(--default-blue)' />
            <h3 className='text-(--default-blue)'>เพิ่มสายทาง</h3>
          </div>
        }
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        okText='ยืนยัน'
        cancelText='ยกเลิก'
        okButtonProps={{
          shape: 'round',
          loading: isBusy,
          disabled: isDetailLoading || isDetailError || !detail || missing.length > 0,
        }}
        cancelButtonProps={{
          shape: 'round',
          disabled: isBusy,
        }}
        onOk={handleSubmit}
        onCancel={handleClose}
        destroyOnHidden
        width={600}
      >
        <div className='mt-5'>{renderBody()}</div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalAddRoad)
