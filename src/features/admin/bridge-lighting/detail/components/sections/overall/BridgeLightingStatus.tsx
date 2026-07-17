import { ArrowDownOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { AnimatePresence, motion } from 'motion/react'
import React, { useState } from 'react'
import { TbSparkles } from 'react-icons/tb'
import FormUpdateBridgeLightingStatus from './FormUpdateBridgeLightingStatus'

const BridgeLightingStatus: React.FC = () => {
  const [editMode, setEditMode] = useState(false)

  return (
    <div className='flex-1 min-h-0 flex flex-col bg-(--dark-black)/80 backdrop-blur-xs rounded-[20px] p-5'>
      <section>
        <div className='flex-1 min-h-0 flex flex-col bg-[#66AEFF1A] border-2 border-white rounded-[20px] p-5'>
          <div className='flex items-start gap-2 mb-3'>
            <TbSparkles className='fs-22 shrink-0' />
            <h4 className='mb-0'>สถานะการทำงาน</h4>
          </div>
          <div>
            <h3>ปิดไฟประดับสะพาน</h3>
            <p className='fs-12'>อัพเดตล่าสุด : 15 เม.ย. 2569 18:35:29 น.</p>
          </div>
        </div>
      </section>
      <section className='mt-5'>
        <div className='mb-3'>
          <h3 className='text-(--yellow)'>คำสั่งเปิด-ปิดระยะไกล</h3>
          <p className='fs-12 text-gray-400'>การสั่งงานนี้อาจส่งผลต่ออุปกรณ์ไฟฟ้าและผู้ใช้งานในพื้นที่ กรุณาตรวจสอบความปลอดภัยก่อนดำเนินการทุกครั้ง</p>
        </div>

        <AnimatePresence mode='wait'>
          {!editMode ? (
            <motion.div
              key='toggle-btn'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                htmlType='button'
                type='primary'
                shape='circle'
                icon={<ArrowDownOutlined />}
                ghost
                onClick={() => setEditMode(true)}
              />
            </motion.div>
          ) : (
            <motion.div
              key='form'
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <FormUpdateBridgeLightingStatus editMode={editMode} setEditMode={setEditMode} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}

export default React.memo(BridgeLightingStatus)
