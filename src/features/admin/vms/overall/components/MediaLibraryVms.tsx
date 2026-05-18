"use client"
import React, { useState } from 'react'
import styles from './vms.module.css'
import { useVmsContext } from '../context'
import { MdOutlineWindow } from "react-icons/md";

const CATEGORIES = ['ทั้งหมด', 'เส้นทาง', 'เทศกาล', 'แผ่นดินไหว']

const MEDIA_ITEMS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=400&q=80',
    content: null,
  },
  {
    id: 2,
    image: '',
    content: (
      <div style={{ textAlign: 'center', color: '#F8C318', fontSize: 11, lineHeight: 1.5, padding: '0 8px' }}>
        <b>พบเห็นการกระทำผิดกฎหมาย<br />ว่าด้วยทางหลวง</b>
        <br />
        <b>โปรดแจ้งสายด่วน <span style={{ fontSize: 18 }}>1146</span></b>
      </div>
    ),
  },
  {
    id: 3,
    image: '',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px' }}>
        <div style={{ background: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📵</div>
        <div style={{ color: '#fff', fontSize: 10, textAlign: 'center', lineHeight: 1.5 }}>
          <b>ขับขี่ปลอดภัย<br />ไม่เล่นโทรศัพท์<br />ขณะขับขี่ยานพาหนะ</b>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    image: '',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px' }}>
        <div style={{ background: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💺</div>
        <div style={{ color: '#fff', fontSize: 10, textAlign: 'center', lineHeight: 1.5 }}>
          <b>ขับขี่ปลอดภัย<br />คาดเข็มขัดนิรภัย<br />ทุกครั้งที่ขับขี่</b>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    image: '',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px' }}>
        <div style={{ background: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🚗</div>
        <div style={{ color: '#fff', fontSize: 10, textAlign: 'center', lineHeight: 1.5 }}>
          <b>ขับขี่ปลอดภัย<br />ชะลอความเร็ว<br />ในเขตชุมชน</b>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
    content: null,
  },
]

interface Props {
  variant?: 'carousel' | 'grid'
}

const MediaLibraryVms: React.FC<Props> = ({ variant = 'carousel' }) => {
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด')
  const { setMediaExpanded } = useVmsContext()

  /* ── Grid variant (right panel) ── */
  if (variant === 'grid') {
    return (
      <div className={styles.mediaPanelRight}>
        <div className={styles.panelHeader} style={{ marginBottom: 20 }}>
          <span className={styles.panelIcon} style={{ marginBottom: 10 }}>
            <MdOutlineWindow size={30} />
          </span>
          <div>
            <div className={styles.panelTitle}>คลังรูปภาพและวิดีโอ</div>
            <div className={styles.panelSubtitle}>รวบรวมรูปภาพและวิดีโอที่มีการแสดงผลในปัจจุบัน</div>
          </div>
        </div>

        <div className={styles.mediaCategoryTabs}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`${styles.mediaCatTab} ${activeCategory === cat ? styles.mediaCatTabActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.mediaGridRight}>
          {MEDIA_ITEMS.map(item => (
            <div key={item.id} className={styles.mediaItemRight}>
              <div
                className={styles.mediaThumb}
                style={{
                  backgroundImage: item.image ? `url(${item.image})` : 'none',
                  backgroundColor: item.image ? 'transparent' : '#0d0e13',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!item.image && item.content}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.mediaViewAllWrap}>
          <button className={styles.btnViewAll} onClick={() => setMediaExpanded(false)}>
            ย่อกลับ
          </button>
        </div>
      </div>
    )
  }

  /* ── Carousel variant (center panel, default) ── */
  return (
    <div className={styles.mediaPanel}>
      <div className={styles.mediaPanelHeader}>
        <div className={styles.panelHeader} style={{ marginBottom: 20 }}>
          <span className={styles.panelIcon} style={{ marginBottom: 10 }}>
            <MdOutlineWindow size={30} />
          </span>
          <div>
            <div className={styles.panelTitle}>คลังรูปภาพและวิดีโอ</div>
            <div className={styles.panelSubtitle}>รวบรวมรูปภาพและวิดีโอที่มีการแสดงผลในปัจจุบัน</div>
          </div>
        </div>
        <button className={styles.btnViewAll}>ดูเพิ่มเติม</button>
      </div>

      <div className={styles.mediaCategoryTabs}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`${styles.mediaCatTab} ${activeCategory === cat ? styles.mediaCatTabActive : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className={styles.mediaCarouselRow}>
        {MEDIA_ITEMS.map(item => (
          <div key={item.id} className={styles.mediaCarouselItem}>
            <div
              className={styles.mediaThumb}
              style={{
                backgroundImage: item.image ? `url(${item.image})` : 'none',
                backgroundColor: item.image ? 'transparent' : '#0d0e13',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!item.image && item.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(MediaLibraryVms)
