import { VMSMediaUrlList } from '@/types/control-vms/vms-api'
import { Col, ConfigProvider, Empty, Image, Pagination, Row, Skeleton, Space } from 'antd'
import React, { useState } from 'react'
import { useControlVMSContext } from '../../../context'
import { isVideoUrl } from '../../../data/media'
import { useVMSMediaUrlList } from '../../../hooks/useVMSMediaUrlList'
import ModalMediaPreview from './ModalMediaPreview'
import VMSMedia from './VMSMedia'

interface Props {
  settingTypeId?: number
  /** When provided, clicking any card picks it (instead of previewing) and
   *  never opens ModalMediaPreview — used by the "เลือกไฟล์จากคลังรูปภาพ" picker. */
  onSelect?: (url: string) => void
  /** True when rendered inside a Modal (fixed width) — the isAddMode-based
   *  column widening only makes sense for the inline (non-modal) embed. */
  inModal?: boolean
}

interface ContentProps {
  items: VMSMediaUrlList[]
  isAddMode: boolean
  onCardClick: (url: string) => void
  onSelect?: (url: string) => void
}

const Content: React.FC<ContentProps> = ({ items, isAddMode, onCardClick, onSelect }) => {
  if (!items.length) return <Empty description="ไม่พบข้อมูล" className='w-full!' />

  return (
    <Row gutter={[16, 16]}>
      {items.map(({ media_url }, index) => {
        if (!media_url) return null
        const alt = `สื่อแสดงผล ${index + 1}`
        return (
          <Col
            key={`${index}-${media_url}`}
            xs={24} sm={24} md={12} lg={12}
            xl={isAddMode ? 12 : 6} xxl={isAddMode ? 12 : 6} xxxl={isAddMode ? 12 : 6}
          >
            {isVideoUrl(media_url) ? (
              <figure
                className='group relative h-52 overflow-hidden rounded-lg cursor-pointer'
                onClick={() => onSelect ? onSelect(media_url) : onCardClick(media_url)}
              >
                <VMSMedia url={media_url} alt={alt} variant='thumbnail' />
                {onSelect && (
                  <div className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100'>
                    <Space vertical align="center">
                      <span className='text-white'>เลือกวีดีโอ</span>
                    </Space>
                  </div>
                )}
              </figure>
            ) : (
              <figure className='h-52 overflow-hidden rounded-lg'>
                <ConfigProvider
                  theme={{
                    token: {
                      colorTextLightSolid: '#FFFFFF'
                    }
                  }}
                >
                  <Image
                    src={media_url}
                    alt={alt}
                    width={'100%'}
                    height={'100%'}
                    className='object-center object-cover'
                    preview={onSelect ? {
                      // Preview stays controlled + always closed — clicking the
                      // image tries to open it, which this intercepts to select
                      // instead, while still getting antd's native hover mask.
                      open: false,
                      onOpenChange: (open) => { if (open) onSelect(media_url) },
                      mask: { blur: true },
                      cover: (
                        <Space vertical align="center">
                          เลือกรูปภาพ
                        </Space>
                      ),
                    } : true}
                  />
                </ConfigProvider>
              </figure>
            )}
          </Col>
        )
      })}
    </Row>
  )
}

const ContentSetting: React.FC<Props> = ({ settingTypeId, onSelect, inModal }) => {
  const { isAddMode } = useControlVMSContext()
  const gridIsAddMode = inModal ? false : isAddMode
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, isFetching } = useVMSMediaUrlList(settingTypeId, page)

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />
  if (isError) return <Empty description="ไม่พบข้อมูล" />

  const items = data?.data.res_data ?? []
  const meta = data?.data.meta_data

  return (
    <div>
      <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
        <Content items={items} isAddMode={gridIsAddMode} onCardClick={setPreviewUrl} onSelect={onSelect} />
      </div>

      {meta && (
        <div className='flex justify-center mt-4'>
          <Pagination
            current={meta.page}
            pageSize={meta.limit}
            total={meta.count}
            showSizeChanger={false}
            hideOnSinglePage
            onChange={setPage}
          />
        </div>
      )}

      <ModalMediaPreview
        open={previewUrl !== null}
        url={previewUrl}
        onClose={() => setPreviewUrl(null)}
      />
    </div>
  )
}

export default React.memo<Props>(ContentSetting)
