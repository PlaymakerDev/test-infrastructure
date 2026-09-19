import React, { RefObject, useCallback } from 'react'
import { SolutionLocation } from '@/types/manage/project-detail-api'
import { Controller, useForm } from 'react-hook-form'
import { Input, message } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { putSolutionLocationAPI } from '@/services/routes/ProjectDetailService'
import { useProjectContext } from '../context'

/** Best-effort extractor for the backend's Thai error message — mirrors
 *  FormCreateITSUser's own helper. */
const readErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const withResponse = error as {
      response?: { data?: { message?: string } }
      message?: string
    }
    return (
      withResponse.response?.data?.message ??
      withResponse.message ??
      fallback
    )
  }
  return fallback
}

interface Props {
  item?: SolutionLocation | null
  type?: 'CREATE' | 'UPDATE' | 'EDIT_SOLUTION_NAME'
  submitRef: RefObject<HTMLButtonElement | null>
  onSuccess?: () => void
}

export interface FormUpdateSolutionLocationValues {
  location_name: string
}

const FormUpdateSolutionLocation: React.FC<Props> = (props) => {
  const { item, submitRef, onSuccess } = props
  const { roadSolution, refreshRoadSolution } = useProjectContext()

  const form = useForm<FormUpdateSolutionLocationValues>({
    defaultValues: {
      location_name: item?.location_name || ''
    }
  })

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = form

  const { mutate: updateSolutionLocation, isPending } = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormUpdateSolutionLocationValues }) =>
      putSolutionLocationAPI(id, data).then((r) => r.data),
  })

  const onSubmit = useCallback((values: FormUpdateSolutionLocationValues) => {
    if (!item?.solution_location_id) return

    updateSolutionLocation({ id: item.solution_location_id, data: values }, {
      onSuccess: async () => {
        message.success('แก้ไขชื่อจุดติดตั้งสำเร็จ')
        await refreshRoadSolution(roadSolution.project_road_id)
        onSuccess?.()
      },
      onError: (error) => {
        message.error(readErrorMessage(error, 'เกิดข้อผิดพลาดในการแก้ไขชื่อจุดติดตั้ง'))
      },
    })
  }, [item, updateSolutionLocation, refreshRoadSolution, roadSolution.project_road_id, onSuccess])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="location_name"
        rules={{ required: 'กรุณากรอกชื่อจุดติดตั้ง' }}
        render={({ field }) => {
          return (
            <fieldset>
              <label className='text-(--yellow)'>ชื่อจุดติดตั้ง <span className="text-red-500">*</span></label>
              <Input
                {...field}
                name={field.name}
                placeholder='ชื่อจุดติดตั้ง...'
                size='large'
              />
              {errors.location_name && <p className="text-red-500">{errors.location_name.message}</p>}
            </fieldset>
          )
        }}
      />
      <button
        ref={submitRef}
        type='submit'
        hidden
        disabled={isPending}
      />
    </form>
  )
}

export default React.memo<Props>(FormUpdateSolutionLocation)
