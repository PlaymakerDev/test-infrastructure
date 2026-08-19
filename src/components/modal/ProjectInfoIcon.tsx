"use client"
import React from 'react'
import { TbInfoSquareRoundedFilled } from 'react-icons/tb'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'

interface Props {
  projectId?: number | string | null
  /** Only fills "หน่วยงานรับผิดชอบ" in the modal — omit when the row has no road. */
  roadId?: number | string | null
  /** Override the clickable state. Defaults to "there is a projectId". */
  enabled?: boolean
  size?: number
}

/** The ⓘ that opens the central Project Info modal, as used after the
 *  เลขที่สัญญา text in every overall table. Greyed-out + unclickable when
 *  there's no project record to show.
 *
 *  The screen rendering this must mount `<ProjectInfoModal />` once — the icon
 *  only dispatches the Redux open action. */
const ProjectInfoIcon: React.FC<Props> = ({ projectId, roadId, enabled, size = 18 }) => {
  const dispatch = useAppDispatch()
  const active = enabled ?? projectId != null

  return (
    <TbInfoSquareRoundedFilled
      size={size}
      className={active ? 'cursor-pointer hover:text-(--yellow)' : 'cursor-not-allowed'}
      style={{ color: active ? '#fff' : '#555' }}
      title={active ? 'ดูข้อมูลโครงการ' : 'ไม่มีข้อมูลโครงการ'}
      onClick={
        active
          ? () =>
              dispatch(
                setProjectInfoModalOpen({
                  open: true,
                  project_id: projectId != null ? Number(projectId) : null,
                  road_id: roadId != null ? Number(roadId) : null,
                }),
              )
          : undefined
      }
    />
  )
}

export default React.memo<Props>(ProjectInfoIcon)
