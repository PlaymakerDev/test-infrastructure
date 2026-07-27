"use client"
import React, { useCallback, useEffect, useState } from 'react'
import { App, Button, Checkbox, Input, Modal } from 'antd'
import axios, { AxiosError } from 'axios'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import {
  TbUser,
  TbLock,
  TbEye,
  TbEyeOff,
} from 'react-icons/tb'
import menu from '@/configs/menu'
import { getDepartmentsAPI } from '@/services/routes/ManageService'
import { getAuthInfoAPI } from '@/services/routes/AdminService'
import { resolveHomeDeptId, deptQuery } from '@/hooks/queries/manage'
import { useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { setLoading } from '@/stores/reducers/layout/layoutSlice'
import { setAuthInfoState } from '@/stores/reducers/auth/authSlice'
import { syncAuthTokenToStore } from '@/services/BaseService'

interface Props {
  username?: string
  password?: string
}

type FormLogin = {
  username?: string
  password?: string
}

// basePath ('/atlas' in prod, '' in dev) — inlined by Next at build time. Public
// assets (<img>/CSS background) are NOT prefixed automatically like next/link, so
// we prepend it manually to keep the logo + hero image working under /atlas.
const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? ''
const HERO_SRC = `${BASE_PATH}/images/login/login-hero.png`
const LOGO_SRC = `${BASE_PATH}/images/login/drr-logo.png`

const REMEMBER_KEY = 'drr_remember_username'

// Figma palette (Login.svg): ITS gradient = yellow→blue (paint2); card border =
// #212121→#66AEFF→#FCD116 (paint9); accents blue #66AEFF + yellow #FCD116;
// secondary text grey #A2A2A2; button text near-black #0D0D0D.
const YELLOW = '#FCD116'
const BLUE = '#66AEFF'
const GREY = '#A2A2A2'

const AuthScreen: React.FC<Props> = (props) => {
  const { username = '', password = '' } = props
  const router = useRouter()
  const { loading } = useAppSelector((state) => state.layout)
  const dispatch = useAppDispatch()
  const { message } = App.useApp()
  const [modal, contextHolder] = Modal.useModal()
  const [remember, setRemember] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<FormLogin>({
    defaultValues: { username, password },
  })

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = form

  // Restore a remembered username (client-side only).
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) {
      setValue('username', saved)
      setRemember(true)
    }
  }, [setValue])

  // Notice when BaseService redirected here on session expiry (?session_expired=1).
  // Read location.search (not useSearchParams) to avoid a Suspense requirement.
  const [sessionExpired, setSessionExpired] = useState(false)
  useEffect(() => {
    setSessionExpired(
      new URLSearchParams(window.location.search).get('session_expired') === '1'
    )
  }, [])

  const onSubmit = useCallback(
    async (value: FormLogin) => {
      dispatch(setLoading({ loading: true }))
      try {
        const response = await axios.post(`${BASE_PATH}/api/auth/login`, value)
        if (response.status === 200) {
          // Drop any cached data from a previous user so this session's
          // token-scoped queries (departments, etc.) refetch fresh.
          queryClient.clear()
          // Populate `authSlice` right after the session cookie is set — token
          // first (so it's never stale), then the profile info. Non-fatal: a
          // failed info fetch shouldn't block the user from reaching the app.
          await syncAuthTokenToStore()
          try {
            const info = await getAuthInfoAPI()
            dispatch(setAuthInfoState(info.data))
          } catch {
            // profile info fetch failed — keep going, info stays at initialState
          }
          if (remember && value.username) {
            localStorage.setItem(REMEMBER_KEY, value.username)
          } else {
            localStorage.removeItem(REMEMBER_KEY)
          }
          const path = menu['ADMIN']
          message.success('เข้าสู่ระบบสำเร็จ')
          // Land on the user's own department (สำนัก → whole bureau, แขวง → that
          // แขวง, ส่วนกลาง → 0). Falls back to the plain dashboard on failure.
          let target = path[0].path
          try {
            const depts = await getDepartmentsAPI()
            target = `${path[0].path}?${deptQuery(resolveHomeDeptId(depts.data))}`
          } catch {
            // department lookup failed — keep the default landing
          }
          router.push(target)
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          modal.error({
            title: 'เข้าสู่ระบบไม่สำเร็จ',
            content:
              error.response?.data?.res_data?.message ??
              'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง',
            okText: 'ตกลง',
            onOk: () => Modal.destroyAll(),
            onCancel: () => Modal.destroyAll(),
          })
        } else {
          console.error(error)
        }
      } finally {
        dispatch(setLoading({ loading: false }))
      }
    },
    [router, dispatch, modal, message, remember, queryClient]
  )

  const onForgotPassword = useCallback(() => {
    message.info('กรุณาติดต่อผู้ดูแลระบบเพื่อขอรีเซ็ตรหัสผ่าน')
  }, [message])

  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    borderColor: GREY,
    height: 49,
    borderRadius: 10,
    color: '#fff',
  }

  return (
    <div className='relative min-h-dvh w-full overflow-hidden bg-black'>
      {/* ── Background: hero interchange image + techy dark fallback ── */}
      <div
        className='absolute inset-0 bg-cover bg-center'
        style={{
          backgroundImage: `linear-gradient(115deg,#050a12 0%,#0a1220 45%,#0d2035 100%)`,
        }}
      />
      <div
        className='absolute inset-0 bg-cover bg-center'
        style={{ backgroundImage: `url(${HERO_SRC})` }}
      />
      {/* Two stacked vertical black gradients (dark top → clear bottom), each at
          0.8 — matches Login.svg paint0/paint1 exactly. */}
      <div
        className='absolute inset-0'
        style={{
          background:
            'linear-gradient(180deg,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0) 100%)',
        }}
      />
      <div
        className='absolute inset-0'
        style={{
          background:
            'linear-gradient(180deg,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0) 100%)',
        }}
      />

      {/* ── Content ── */}
      <div className='relative z-10 min-h-dvh flex flex-col lg:flex-row'>
        {/* LEFT — branding / feature highlights (desktop only) */}
        <section className='hidden xl:flex flex-1 min-w-0 flex-col justify-center px-8 2xl:px-16'>
          <div className='flex items-end gap-5'>
            <span
              className='font-extrabold leading-none tracking-tight'
              style={{
                fontSize: 'clamp(72px,7vw,148px)',
                background: `linear-gradient(to right,${YELLOW} 0%,${BLUE} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              ITS
            </span>
            <div className='pb-3'>
              <h1
                className='text-white leading-none'
                style={{ fontSize: 'clamp(32px,3.1vw,64px)', fontWeight: 500 }}
              >
                Central Platform
              </h1>
              <p
                className='text-white mt-2'
                style={{ fontSize: 'clamp(16px,1.5vw,26px)' }}
              >
                ระบบบริหารจัดการจราจรอัจฉริยะส่วนกลาง
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT — login card */}
        <section className='flex items-center justify-center w-full p-6 xl:w-auto xl:pr-16 2xl:pr-28 h-screen'>
          {/* gradient border wrapper (paint9: bottom-left #212121 → blue → yellow top-right) */}
          <div
            className='w-full max-w-145 xl:w-120 2xl:w-145 rounded-2xl p-0.5'
            style={{
              background: `linear-gradient(to top right,#212121 11%,${BLUE} 72%,${YELLOW} 100%)`,
              boxShadow: '0 24px 60px -20px rgba(0,0,0,0.7)',
            }}
          >
            {/* Card bg = #000000B2 (semi-transparent black over the hero, no
                backdrop blur — mirrors Login.svg). Compact, content-height. */}
            <div className='rounded-[18px] bg-[#000000B2] px-7 py-10 sm:px-9 xl:px-12 2xl:px-16'>
              {/* logo + org name — restored 2026-07-24 (was accidentally
                * dropped with the left-side icons during the hero simplification). */}
              <div className='flex flex-col items-center text-center'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={LOGO_SRC}
                  alt='กรมทางหลวงชนบท'
                  width={124}
                  height={124}
                  className='select-none'
                  draggable={false}
                />
                <h2 className='font-bold text-white mt-3' style={{ fontSize: 26 }}>
                  กรมทางหลวงชนบท
                </h2>
                <p className='text-white' style={{ fontSize: 14 }}>Department of Rural Roads</p>
              </div>

              {/* divider (paint10: yellow centre → blue ends) — a crisp line
                * over a blurred copy of itself, mirroring Figma's "line + Layer
                * blur 4" glow. */}
              <div className='my-5 flex justify-center'>
                <div className='relative w-3/5'>
                  <span
                    aria-hidden
                    className='absolute inset-x-0 top-1/2 -translate-y-1/2 h-1'
                    style={{
                      background: `linear-gradient(90deg,${BLUE} 0%,${YELLOW} 50%,${BLUE} 100%)`,
                      filter: 'blur(4px)',
                    }}
                  />
                  <span
                    className='relative block h-0.5'
                    style={{
                      background: `linear-gradient(90deg,${BLUE} 0%,${YELLOW} 50%,${BLUE} 100%)`,
                    }}
                  />
                </div>
              </div>

              <div className='text-center'>
                <p className='font-bold' style={{ color: BLUE, fontSize: 22 }}>
                  เข้าสู่ระบบ
                </p>
                <p className='mt-1' style={{ fontSize: 13, color: GREY }}>
                  กรุณาเข้าระบบเพื่อใช้งานศูนย์ควบคุม
                </p>
              </div>

              {sessionExpired && (
                <div
                  className='mt-4 rounded-lg px-3 py-2 text-center'
                  style={{
                    background: 'rgba(252,209,22,0.10)',
                    border: `1px solid ${YELLOW}`,
                    color: YELLOW,
                    fontSize: 13,
                  }}
                >
                  เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className='mt-6'>
                <Controller
                  control={control}
                  name='username'
                  rules={{ required: 'กรุณากรอกชื่อผู้ใช้งาน' }}
                  render={({ field }) => (
                    <div className='mb-4'>
                      <Input
                        {...field}
                        size='large'
                        style={inputStyle}
                        prefix={<TbUser size={18} color={GREY} className='mr-1' />}
                        placeholder='ชื่อผู้ใช้งาน (Username)'
                        status={errors.username ? 'error' : undefined}
                      />
                      {!!errors.username && (
                        <span className='text-red-400 text-xs mt-1 block'>
                          {errors.username.message}
                        </span>
                      )}
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name='password'
                  rules={{ required: 'กรุณากรอกรหัสผ่าน' }}
                  render={({ field }) => (
                    <div className='mb-4'>
                      <Input.Password
                        {...field}
                        size='large'
                        style={inputStyle}
                        prefix={<TbLock size={18} color={GREY} className='mr-1' />}
                        placeholder='รหัสผ่าน (Password)'
                        status={errors.password ? 'error' : undefined}
                        iconRender={(visible) =>
                          visible ? (
                            <TbEye size={18} color='rgba(255,255,255,0.7)' />
                          ) : (
                            <TbEyeOff size={18} color='rgba(255,255,255,0.7)' />
                          )
                        }
                      />
                      {!!errors.password && (
                        <span className='text-red-400 text-xs mt-1 block'>
                          {errors.password.message}
                        </span>
                      )}
                    </div>
                  )}
                />

                <div className='flex items-center justify-between mb-6'>
                  <Checkbox
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  >
                    <span style={{ color: GREY, fontSize: 13 }}>จดจำการเข้าสู่ระบบ</span>
                  </Checkbox>
                  <button
                    type='button'
                    onClick={onForgotPassword}
                    className='font-semibold hover:underline'
                    style={{ color: YELLOW, fontSize: 13 }}
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>

                <Button
                  htmlType='submit'
                  type='primary'
                  loading={loading}
                  block
                  style={{
                    height: 50,
                    borderRadius: 10,
                    background: BLUE,
                    borderColor: BLUE,
                    color: '#0D0D0D',
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  เข้าสู่ระบบ
                </Button>
              </form>

              <p className='text-center mt-6' style={{ fontSize: 12, color: GREY }}>
                Version 1.0.0 &nbsp;|&nbsp; © Department of Rural Roads
              </p>
            </div>
          </div>
        </section>
      </div>
      {contextHolder}
    </div>
  )
}

export default React.memo<Props>(AuthScreen)
