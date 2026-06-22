import { getVMSMediaAPI } from '@/services/routes/ControlVMSService'
import { useAppSelector } from '@/stores/hooks'
import { VMSMediaList } from '@/types/control-vms/vms-api'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Col, Empty, Image, Row, Skeleton } from 'antd'
import React, { useEffect, useMemo, useRef } from 'react'
import { useControlVMSContext } from '../../../context'

const PAGE_SIZE = 12

interface Props {
  tabKey: string
}

interface ContentProps {
  items: VMSMediaList[]
  isAddMode: boolean
}

const Content: React.FC<ContentProps> = ({ items, isAddMode }) => {
  if (!items.length) return <Empty description="ไม่พบข้อมูล" className='w-full!' />

  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col
          key={item.id}
          xs={24} sm={24} md={12} lg={12}
          xl={isAddMode ? 12 : 6} xxl={isAddMode ? 12 : 6} xxxl={isAddMode ? 12 : 6}
        >
          <figure className='h-52 overflow-hidden rounded-lg'>
            <Image
              src={item.media_url}
              alt={item.type_name}
              width={'100%'}
              height={'100%'}
              className='object-center object-cover'
            />
          </figure>
        </Col>
      ))}
    </Row>
  )
}

const ContentSetting: React.FC<Props> = ({ tabKey }) => {
  const { media } = useAppSelector(state => state.control_vms)
  const { isAddMode } = useControlVMSContext()
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['media_list', tabKey, media.search],
    queryFn: ({ pageParam }) => getVMSMediaAPI({
      ...media.search,
      ...(tabKey !== '0' && { setting_type_id: Number(tabKey) }),
      page: pageParam,
      limit: PAGE_SIZE,
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.data.meta_data
      return page < total_pages ? page + 1 : undefined
    },
    enabled: !!tabKey,
    gcTime: 0,
  })

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) fetchNextPage() },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, fetchNextPage])

  const allItems = useMemo(
    () => data?.pages.flatMap(p => p.data.res_data) ?? [],
    [data]
  )

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />
  if (isError) return <Empty description="ไม่พบข้อมูล" />

  return (
    <div>
      <Content items={allItems} isAddMode={isAddMode} />

      {/* Scroll sentinel */}
      <div ref={sentinelRef} className='h-4' />

      {isFetchingNextPage && (
        <Skeleton active paragraph={{ rows: 3 }} className='mt-4' />
      )}
    </div>
  )
}

export default React.memo<Props>(ContentSetting)
