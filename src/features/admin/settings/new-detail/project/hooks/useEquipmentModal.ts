import { useCallback, useMemo } from 'react'
import { useSolutionCameras } from '@/hooks/queries/manage'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetEquipmentModalData, setLiveStreamModalOpen } from '@/stores/reducers/modal/customModalSlice'
import type { APIResponseCamera } from '@/types/manage/solution-api'
import type { EquipmentModalType } from '../data/equipmentModal'

/** Shared plumbing for the four "รายการอุปกรณ์" modals: they all read the one
 *  `equipment_modal` Redux slot and each renders only for its own `type`.
 *  Cameras are read live (not stashed in Redux) so the list refreshes after
 *  add / delete / attach; the query is only enabled while this modal is the
 *  active one, so the three idle modals never fetch. */
export const useEquipmentModal = (type: EquipmentModalType) => {
  const state = useAppSelector((s) => s.custom_modal.equipment_modal)
  const dispatch = useAppDispatch()

  const open = state.open && state.type === type
  const { item, record, solutions } = state

  const camerasQuery = useSolutionCameras(open ? item?.solution_location_id : null)
  const cameras = useMemo(() => camerasQuery.data ?? [], [camerasQuery.data])

  const close = useCallback(() => {
    dispatch(resetEquipmentModalData())
  }, [dispatch])

  const openLiveStream = useCallback(
    (camera: APIResponseCamera) => {
      dispatch(setLiveStreamModalOpen({ open: true, data: camera, item }))
    },
    [dispatch, item],
  )

  return {
    open,
    item,
    record,
    solutions: solutions ?? [],
    cameras,
    camerasLoading: camerasQuery.isLoading,
    close,
    openLiveStream,
  }
}
