"use client"
import React, { useCallback, useEffect, useState } from 'react'
import { App, Button, Checkbox, Input, Modal } from 'antd'
import axios, { AxiosError } from 'axios'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import {
  TbCar,
  TbZoomScan,
  TbWeight,
  TbUser,
  TbLock,
  TbEye,
  TbEyeOff,
} from 'react-icons/tb'
import { MdOutlineMonitorHeart } from 'react-icons/md'
import type { IconType } from 'react-icons'
import menu from '@/configs/menu'
import { getDepartmentsAPI } from '@/services/routes/ManageService'
import { resolveHomeDeptId } from '@/hooks/queries/manage'
import { useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { setLoading } from '@/stores/reducers/layout/layoutSlice'

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
const LOGO_SRC = `${BASE_PATH}/images/login/drr-logo.png`
const HERO_SRC = `${BASE_PATH}/images/login/login-hero.png`

const REMEMBER_KEY = 'drr_remember_username'

// Figma palette (Login.svg): ITS gradient = yellow→blue (paint2); card border =
// #212121→#66AEFF→#FCD116 (paint9); accents blue #66AEFF + yellow #FCD116;
// secondary text grey #A2A2A2; button text near-black #0D0D0D.
const YELLOW = '#FCD116'
const BLUE = '#66AEFF'
const GREY = '#A2A2A2'

// Custom "Analytic Report" icon from the design (Frame.svg) — no matching
// react-icon exists. Inline so it accepts size/color like react-icons do.
const IconAnalytic: IconType = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 50 50'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M7.47039 17.5296C6.68899 16.7482 6.25 15.6884 6.25 14.5833C6.25 13.4782 6.68899 12.4184 7.47039 11.637C8.25179 10.8556 9.3116 10.4166 10.4167 10.4166C11.5217 10.4166 12.5815 10.8556 13.3629 11.637C14.1443 12.4184 14.5833 13.4782 14.5833 14.5833C14.5833 15.6884 14.1443 16.7482 13.3629 17.5296C12.5815 18.311 11.5217 18.75 10.4167 18.75C9.3116 18.75 8.25179 18.311 7.47039 17.5296Z' stroke={color} strokeWidth={3} strokeLinecap='round' strokeLinejoin='round' />
    <path d='M29.1665 31.25C29.1665 32.3551 29.6055 33.4149 30.3869 34.1963C31.1683 34.9777 32.2281 35.4167 33.3332 35.4167C34.4382 35.4167 35.498 34.9777 36.2794 34.1963C37.0608 33.4149 37.4998 32.3551 37.4998 31.25C37.4998 30.145 37.0608 29.0852 36.2794 28.3038C35.498 27.5224 34.4382 27.0834 33.3332 27.0834C32.2281 27.0834 31.1683 27.5224 30.3869 28.3038C29.6055 29.0852 29.1665 30.145 29.1665 31.25Z' stroke={color} strokeWidth={3} strokeLinecap='round' strokeLinejoin='round' />
    <path d='M33.0806 16.9194C31.9085 15.7473 31.25 14.1576 31.25 12.5C31.25 10.8424 31.9085 9.25269 33.0806 8.08058C34.2527 6.90848 35.8424 6.25 37.5 6.25C39.1576 6.25 40.7473 6.90848 41.9194 8.08058C43.0915 9.25269 43.75 10.8424 43.75 12.5C43.75 14.1576 43.0915 15.7473 41.9194 16.9194C40.7473 18.0915 39.1576 18.75 37.5 18.75C35.8424 18.75 34.2527 18.0915 33.0806 16.9194Z' stroke={color} strokeWidth={3} strokeLinecap='round' strokeLinejoin='round' />
    <path d='M8.08058 41.9194C6.90848 40.7473 6.25 39.1576 6.25 37.5C6.25 35.8424 6.90848 34.2527 8.08058 33.0806C9.25269 31.9085 10.8424 31.25 12.5 31.25C14.1576 31.25 15.7473 31.9085 16.9194 33.0806C18.0915 34.2527 18.75 35.8424 18.75 37.5C18.75 39.1576 18.0915 40.7473 16.9194 41.9194C15.7473 43.0915 14.1576 43.75 12.5 43.75C10.8424 43.75 9.25269 43.0915 8.08058 41.9194Z' stroke={color} strokeWidth={3} strokeLinecap='round' strokeLinejoin='round' />
    <path d='M18.75 35.4166L29.1667 32.2916' stroke={color} strokeWidth={3} strokeLinecap='round' strokeLinejoin='round' />
    <path d='M13.5415 17.7084L29.8123 28.8959' stroke={color} strokeWidth={3} strokeLinecap='round' strokeLinejoin='round' />
    <path d='M14.5835 14.5833L31.2502 12.5' stroke={color} strokeWidth={3} strokeLinecap='round' strokeLinejoin='round' />
  </svg>
)

const FEATURES: { icon: IconType; label: string }[] = [
  { icon: TbCar, label: 'Traffic Monitoring' },
  { icon: MdOutlineMonitorHeart, label: 'VMS Control' },
  { icon: TbZoomScan, label: 'GPS Tracking' },
  { icon: TbWeight, label: 'WIM Monitoring' },
  { icon: IconAnalytic, label: 'Analytic Report' },
]

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

  const onSubmit = useCallback(
    async (value: FormLogin) => {
      dispatch(setLoading({ loading: true }))
      try {
        const response = await axios.post('/api/auth/login', value)
        if (response.status === 200) {
          // Drop any cached data from a previous user so this session's
          // token-scoped queries (departments, etc.) refetch fresh.
          queryClient.clear()
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
            target = `${path[0].path}?dept_id=${resolveHomeDeptId(depts.data)}`
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
              <p className='mt-1' style={{ fontSize: 'clamp(13px,1.1vw,19px)', color: GREY }}>
                Intelligent transport control and monitoring
              </p>
            </div>
          </div>

          {/* yellow eyebrow + rule (paint3: transparent → grey → yellow) */}
          <div className='mt-8 flex items-center gap-4 max-w-2xl'>
            <span className='whitespace-nowrap font-medium' style={{ color: YELLOW, fontSize: 15 }}>
              National transport monitoring and control
            </span>
            <span
              className='h-0.5 flex-1'
              style={{
                background: `linear-gradient(to right,rgba(82,82,82,0) 0%,#525252 29%,${YELLOW} 100%)`,
              }}
            />
          </div>

          {/* feature circles (paint4-8: grey sheen gradient) */}
          <div className='mt-10 flex flex-wrap gap-x-10 gap-y-6'>
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className='flex flex-col items-center gap-3'>
                <span
                  className='w-19 h-19 rounded-full flex items-center justify-center backdrop-blur-sm'
                  style={{
                    background:
                      'linear-gradient(to top right,rgba(151,151,151,0.22),rgba(60,60,60,0))',
                    border: `1px solid rgba(162,162,162,0.45)`,
                  }}
                >
                  <Icon size={32} color='#fff' />
                </span>
                <span className='font-semibold text-white text-center' style={{ fontSize: 13 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT — login card */}
        <section className='flex items-center justify-center w-full p-6 xl:w-auto xl:pr-16 2xl:pr-28 h-screen'>
          {/* gradient border wrapper (paint9: bottom-left #212121 → blue → yellow top-right) */}
          <div
            className='w-full max-w-145 xl:w-120 2xl:w-145 rounded-[20px] p-0.5'
            style={{
              background: `linear-gradient(to top right,#212121 11%,${BLUE} 72%,${YELLOW} 100%)`,
              boxShadow: '0 24px 60px -20px rgba(0,0,0,0.7)',
            }}
          >
            {/* Card bg = #000000B2 (semi-transparent black over the hero, no
                backdrop blur — mirrors Login.svg). Compact, content-height. */}
            <div className='rounded-[18px] bg-[#000000B2] px-7 py-8 sm:px-9 xl:px-12 2xl:px-16'>
              {/* logo + org name */}
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
                <p style={{ fontSize: 14, color: GREY }}>Department of Rural Roads</p>
              </div>

              {/* divider (paint10: yellow centre → blue ends) */}
              <div className='my-5 flex justify-center'>
                <span
                  className='h-0.5 w-3/5'
                  style={{
                    background: `linear-gradient(90deg,${BLUE} 0%,${YELLOW} 50%,${BLUE} 100%)`,
                  }}
                />
              </div>

              <div className='text-center'>
                <p className='font-bold' style={{ color: BLUE, fontSize: 22 }}>
                  เข้าสู่ระบบ
                </p>
                <p className='mt-1' style={{ fontSize: 13, color: GREY }}>
                  กรุณาเข้าระบบเพื่อใช้งานศูนย์ควบคุม
                </p>
              </div>

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
