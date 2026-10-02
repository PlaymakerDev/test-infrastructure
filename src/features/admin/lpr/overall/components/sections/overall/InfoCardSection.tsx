import React, { useMemo } from 'react'
import { TbShield } from 'react-icons/tb'
import { useDeptId } from '@/hooks/useDeptId'
import { useQuery } from '@tanstack/react-query'
import { getLPRTotalAPI } from '@/services/routes/NewLPRService'
import { Empty, Skeleton } from 'antd'
import { fmtNumber } from '@/utils/formatNumber'
import { IconLPR } from '@/components/icon'

interface Props {
  deptId?: string | string[] | number
}

const InfoCardSection: React.FC<Props> = (props) => {
  const { deptId: deptIdProp } = props
  const deptIdFromUrl = useDeptId()
  const deptId = String(deptIdProp ?? deptIdFromUrl ?? '0')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lpr-total', deptId],
    queryFn: () => getLPRTotalAPI(deptId, {
      scope: 'all',
    }),
    enabled: !!deptId,
  })

  if (isLoading) return <Skeleton loading={isLoading} active />
  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />

  const activePercentage = Number(data?.data.solution.online) / Number(data?.data.solution.total) * 100

  const cardClass = 'min-h-40 border-2 rounded-2xl p-5'

  return (
    <div className='flex flex-col gap-4 md:grid md:grid-cols-3 lg:flex lg:flex-col'>
      <div className={`${cardClass} bg-[#FFB1001A] border-(--yellow)`}>
        <IconLPR size={30} color='var(--yellow)' className='mb-1' />
        <h3 className='text-(--yellow)'>กล้องตรวจจับป้ายทะเบียนในระบบทั้งหมด</h3>
        <p>
          <span className='fs-24 font-bold'>{fmtNumber(Number(data?.data.solution.total)) || 0}</span> จุดติดตั้ง
        </p>
        <p className='fs-12 text-white/50'>
          Active : {fmtNumber(Number(data?.data.solution.online)) || 0} ({activePercentage.toFixed(1)}%)
        </p>
      </div>
      <div className={`${cardClass} bg-[#05F2DB1A] border-[#05F2DB]`}>
        <TbShield className='fs-24 text-[#05F2DB] mb-1' />
        <h3 className='text-[#05F2DB]'>ในค้ำ</h3>
        <p>
          <span className='fs-24 font-bold'>{fmtNumber(Number(data?.data.warranty.active)) || 0}</span> จุดติดตั้ง
        </p>
      </div>
      <div className={`${cardClass} bg-[#9797971A] border-[#979797]`}>
        <TbShield className='fs-24 text-[#979797] mb-1' />
        <h3 className='text-[#979797]'>หมดค้ำ</h3>
        <p>
          <span className='fs-24 font-bold'>{fmtNumber(Number(data?.data.warranty.expired)) || 0}</span> จุดติดตั้ง
        </p>
      </div>
    </div>
  )
}

export default React.memo<Props>(InfoCardSection)
