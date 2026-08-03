"use client"
import { Button, ConfigProvider, Input, Modal, Spin } from 'antd'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { TbSearch } from 'react-icons/tb'
import { useSsoSearch } from '@/hooks/queries/manage'
import type { APIResponseSSOUser } from '@/types/manage/sso-search-api'

const LDAP_SEARCH_DEBOUNCE_MS = 500

// Figma tokens mirrored from UserModal so the two dialogs read as a set.
const LABEL_COLOR = '#1F1F1F'
const BORDER_DEFAULT = '#E5E5E5'
const BORDER_FOCUS = '#FCD116'
const PLACEHOLDER = '#B8B8B8'
const CANCEL_BG = '#E5E5E5'
const CANCEL_TEXT = '#4A4A4A'
const CONFIRM_BG = '#FCD116'
const MUTED = '#8A8A8A'

interface Props {
  open: boolean
  onCancel: () => void
  onSelect: (user: APIResponseSSOUser) => void
}

/** First step of the "+ เพิ่มผู้ใช้งาน LDAP" flow.
 *  Owns nothing but a debounced keyword state — the parent (UserSection)
 *  drives the transition into UserModal once a row is picked. */
const LDAPSearchModal: React.FC<Props> = ({ open, onCancel, onSelect }) => {
  // `input` mirrors the raw text (instant render); `keyword` is the debounced
  // value fed into the query hook so we don't flood the proxy while typing.
  const [input, setInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: results, isFetching } = useSsoSearch(keyword)
  const trimmed = keyword.trim()

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  // Reset keyword state on every false→true `open` transition so a stale
  // query result from a previous session never bleeds into the next open.
  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setInput('')
      setKeyword('')
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
    prevOpenRef.current = open
  }, [open])

  const onInputChange = useCallback((value: string) => {
    setInput(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setKeyword(value), LDAP_SEARCH_DEBOUNCE_MS)
  }, [])

  const showIdle = trimmed.length < 2
  const showLoading = !showIdle && isFetching
  const showEmpty = !showIdle && !isFetching && (!results || results.length === 0)
  const showResults = !showIdle && !isFetching && !!results && results.length > 0

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: LABEL_COLOR,
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            footerBg: '#FFFFFF',
            titleColor: '#111111',
            borderRadiusLG: 16,
            paddingContentHorizontalLG: 40,
            paddingMD: 32,
          },
          Input: {
            colorTextPlaceholder: PLACEHOLDER,
            colorBorder: BORDER_DEFAULT,
            activeBorderColor: BORDER_FOCUS,
            hoverBorderColor: BORDER_FOCUS,
            controlHeight: 44,
            borderRadius: 8,
            paddingInline: 14,
            colorText: LABEL_COLOR,
          },
        },
      }}
    >
      <Modal
        wrapClassName='light-modal'
        open={open}
        onCancel={onCancel}
        footer={null}
        destroyOnHidden
        width={640}
        closable={{ 'aria-label': 'Custom Close Button' }}
        styles={{
          mask: { background: 'rgba(0,0,0,0.55)' },
          container: { padding: '32px 40px', borderRadius: 16 },
          header: { marginBottom: 12 },
        }}
        title={
          <div>
            <div className='flex items-center' style={{ gap: 12 }}>
              <TbSearch size={22} color={CONFIRM_BG} />
              <span style={{ color: '#111', fontSize: 20, fontWeight: 600 }}>
                ค้นหาผู้ใช้ใน LDAP AD
              </span>
            </div>
            <div style={{ color: MUTED, fontSize: "var(--fs-12)", marginTop: 6, fontWeight: 400 }}>
              พิมพ์ชื่อ / นามสกุล / username แล้วเลือกรายการที่ต้องการเพิ่ม
            </div>
          </div>
        }
      >
        <div className='light-modal-popup'>
          <Input
            prefix={<TbSearch style={{ color: PLACEHOLDER }} />}
            placeholder='เช่น kanyanut, สุวรรณ, drr.admin'
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            allowClear
            autoComplete='off'
            autoFocus
          />

          <div
            style={{
              marginTop: 12,
              border: `1px solid ${BORDER_DEFAULT}`,
              borderRadius: 8,
              background: '#FFFFFF',
              maxHeight: 360,
              overflowY: 'auto',
            }}
          >
            {showIdle && (
              <div
                style={{
                  padding: 24,
                  color: MUTED,
                  fontSize: "var(--fs-12)",
                  textAlign: 'center',
                }}
              >
                เริ่มพิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา
              </div>
            )}
            {showLoading && (
              <div
                className='flex items-center justify-center'
                style={{ padding: 24 }}
              >
                <Spin size='small' />
              </div>
            )}
            {showEmpty && (
              <div
                style={{
                  padding: 24,
                  color: MUTED,
                  fontSize: "var(--fs-12)",
                  textAlign: 'center',
                }}
              >
                ไม่พบผู้ใช้ใน LDAP
              </div>
            )}
            {showResults &&
              results!.map((r, idx) => {
                const key =
                  r.Username || r.UserPrincipalName || `${r.FirstName}-${r.LastName}-${idx}`
                const primary =
                  `${r.FirstName ?? ''} ${r.LastName ?? ''}`.trim() || r.Username
                // Description ~= Thai display name (นายxxx / นางxxx). UPN is the
                // AD login shape (user@drr.local). Falling back to Username if
                // neither is present.
                const secondary = r.Description || r.UserPrincipalName || r.Username
                const isLast = idx === results!.length - 1
                return (
                  <div
                    key={key}
                    role='button'
                    tabIndex={0}
                    onClick={() => onSelect(r)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(r)
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F5F5F5'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderBottom: isLast ? 'none' : `1px solid ${BORDER_DEFAULT}`,
                      color: LABEL_COLOR,
                      transition: 'background 120ms ease',
                    }}
                  >
                    <div className='flex items-center' style={{ gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: "var(--fs-12)", fontWeight: 500 }}>{primary}</span>
                      {r.Username && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '1px 8px',
                            fontSize: "var(--fs-12)",
                            fontWeight: 600,
                            borderRadius: 999,
                            background: '#F5F5F5',
                            color: '#4A4A4A',
                            border: `1px solid ${BORDER_DEFAULT}`,
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                          }}
                        >
                          @{r.Username}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "var(--fs-12)", color: MUTED, marginTop: 2 }}>{secondary}</div>
                  </div>
                )
              })}
          </div>

          <div className='flex justify-end' style={{ gap: 12, marginTop: 20 }}>
            <Button
              shape='round'
              onClick={onCancel}
              style={{
                background: CANCEL_BG,
                color: CANCEL_TEXT,
                borderColor: CANCEL_BG,
                padding: '10px 28px',
                height: 'auto',
                fontWeight: 500,
              }}
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(LDAPSearchModal)
