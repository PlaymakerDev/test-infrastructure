import { VMSMediaList } from '@/types/control-vms/vms-api'
import { Col, Empty, Image, Row, Skeleton } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useControlVMSContext } from '../../../context'
import { isVideoUrl, ScheduleCard } from '../../../data/media'
import { useVMSMediaList } from '../../../hooks/useVMSMediaList'
import ModalMediaPreview from './ModalMediaPreview'
import VMSMedia from './VMSMedia'

interface Props {
  settingTypeId?: number
}

interface ContentProps {
  items: VMSMediaList[]
  isAddMode: boolean
  onCardClick: (card: ScheduleCard) => void
}

const Content: React.FC<ContentProps> = ({ items, isAddMode, onCardClick }) => {
  const cards = items.flatMap((item) => item.schedules.map((schedule) => ({ item, schedule })))
  if (!cards.length) return <Empty description="ไม่พบข้อมูล" className='w-full!' />

  return (
    <Row gutter={[16, 16]}>
      {cards.map(({ item, schedule }) => {
        const mediaUrl = schedule.media_url
        const alt = schedule.schedule_name || item.type_name
        return (
          <Col
            key={`${item.id}-${schedule.id}`}
            xs={24} sm={24} md={12} lg={12}
            xl={isAddMode ? 12 : 6} xxl={isAddMode ? 12 : 6} xxxl={isAddMode ? 12 : 6}
          >
            {!mediaUrl ? (
              <figure className='h-52 rounded-lg bg-(--dark-black) flex items-center justify-center'>
                <Empty description="ข้อความ" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </figure>
            ) : isVideoUrl(mediaUrl) ? (
              <figure
                className='h-52 overflow-hidden rounded-lg cursor-pointer'
                onClick={() => onCardClick({ item, schedule })}
              >
                <VMSMedia url={mediaUrl} alt={alt} variant='thumbnail' />
              </figure>
            ) : (
              <figure className='h-52 overflow-hidden rounded-lg'>
                <Image
                  src={mediaUrl}
                  alt={alt}
                  width={'100%'}
                  height={'100%'}
                  className='object-center object-cover'
                />
              </figure>
            )}
          </Col>
        )
      })}
    </Row>
  )
}

const ContentSetting: React.FC<Props> = ({ settingTypeId }) => {
  const { isAddMode } = useControlVMSContext()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [previewCard, setPreviewCard] = useState<ScheduleCard | null>(null)

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useVMSMediaList(settingTypeId)

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
    () => data?.pages.flatMap(p => p.data.res_data ?? []) ?? [],
    [data]
  )

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />
  if (isError) return <Empty description="ไม่พบข้อมูล" />

  return (
    <div>
      <Content items={allItems} isAddMode={isAddMode} onCardClick={setPreviewCard} />

      {/* Scroll sentinel */}
      <div ref={sentinelRef} className='h-4' />

      {isFetchingNextPage && (
        <Skeleton active paragraph={{ rows: 3 }} className='mt-4' />
      )}

      <ModalMediaPreview
        open={previewCard !== null}
        data={previewCard}
        onClose={() => setPreviewCard(null)}
      />
    </div>
  )
}

export default React.memo<Props>(ContentSetting)
