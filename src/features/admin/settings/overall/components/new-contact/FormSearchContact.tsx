import { useAppDispatch } from '@/stores/hooks'
import { setContactModalOpen } from '@/stores/reducers/modal/customModalSlice'
import { APIResponseContractorList } from '@/types/manage/contractor-api'
import { fmtNumber } from '@/utils/formatNumber'
import { AppstoreOutlined, BarsOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, ConfigProvider, Input, Segmented } from 'antd'
import React, { useCallback, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TbPrinter, TbSearch } from 'react-icons/tb'

interface Props {
  type: 'TABLE' | 'GRID'
  setType: (type: 'TABLE' | 'GRID') => void
  search: string
  setSearch: (search: string) => void
  onExport: () => void
  data?: APIResponseContractorList
}

interface FormSearchContactForm {
  name: string
}

const FormSearchContact: React.FC<Props> = (props) => {
  const { setType, type, search, setSearch, onExport, data } = props
  const dispatch = useAppDispatch()
  const submitRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const form = useForm<FormSearchContactForm>({
    defaultValues: {
      name: search || ''
    }
  })

  const { control, handleSubmit } = form

  const onSubmit = useCallback((data: FormSearchContactForm) => {
    setSearch(data.name)
  }, [setSearch])

  const onOpenCreateContactModal = useCallback(() => {
    dispatch(setContactModalOpen({ open: true, type: 'CREATE' }))
  }, [dispatch])

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className='flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center'
    >
      <div className='w-full lg:w-100'>
        <Controller
          name="name"
          control={control}
          render={({ field }) => {
            return (
              <Input
                {...field}
                name={field.name}
                placeholder='ค้นหาชื่อบริษัท...'
                size="large"
                className='w-full'
                suffix={<TbSearch className='text-(--yellow)' />}
                onChange={(e) => {
                  field.onChange(e)
                  if (timeoutRef.current) clearTimeout(timeoutRef.current)
                  timeoutRef.current = setTimeout(() => {
                    submitRef.current?.click()
                  }, 700)
                }}
              />
            )
          }}
        />
      </div>

      <div className='flex flex-wrap items-center gap-3 md:flex-nowrap md:w-auto'>
        <div className='shrink-0 rounded-3xl border border-[#B2FF00] text-[#B2FF00] px-5 py-1'>
          <p className='fs-12 whitespace-nowrap'>{fmtNumber(Number(data?.meta_data.count)) || 0} ผู้รับจ้าง</p>
        </div>
        <Button
          htmlType="button"
          type='primary'
          size="large"
          icon={<PlusOutlined />}
          shape='round'
          className='flex-1 min-w-35 md:flex-none md:w-auto!'
          onClick={onOpenCreateContactModal}
        >
          <p className='fs-12 whitespace-nowrap'>เพิ่มผู้รับจ้าง</p>
        </Button>
        <Segmented
          value={type}
          onChange={(value) => setType(value as 'TABLE' | 'GRID')}
          options={[
            { value: 'TABLE', icon: <BarsOutlined /> },
            { value: 'GRID', icon: <AppstoreOutlined /> },
          ]}
          size='large'
          className='shrink-0'
        />
        <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
          <Button
            type="primary"
            size="large"
            shape="round"
            icon={<TbPrinter />}
            className='flex-1 min-w-35 md:flex-none md:w-auto!'
            onClick={onExport}
          >
            <p className='fs-12 whitespace-nowrap'>นำออกเอกสาร</p>
          </Button>
        </ConfigProvider>
      </div>

      <button ref={submitRef} hidden type="submit" />
    </form>
  )
}

export default React.memo<Props>(FormSearchContact)
