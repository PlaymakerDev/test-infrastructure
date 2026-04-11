"use client"
import React, { useCallback } from 'react'
import { Button, Input, message, Modal } from 'antd';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form';
import menu from '@/configs/menu';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { setTaskSchedule } from '@/stores/reducers/layout/layoutSlice';

interface Props {
  username?: string;
  password?: string;
}

type FormLogin = Props

const AuthScreen: React.FC<Props> = (props) => {
  const { username = 'drr', password = 'P@ssw0rd' } = props
  const router = useRouter()
  const { task_schedules: { loading } } = useAppSelector(state => state.layout)
  const dispatch = useAppDispatch()

  const form = useForm<FormLogin>({
    defaultValues: {
      username: username,
      password: password
    }
  })

  const {
    handleSubmit,
    control,
    formState: { errors }
  } = form

  const onSubmit = useCallback(async (value: FormLogin) => {
    dispatch(setTaskSchedule({
      loading: true,
      status: "LOADING"
    }))
    try {
      const response = await axios.post('/api/auth/login', value)
      if (response.status === 200) {
        // UPON FINISH
        const path = menu['EXAMPLE']
        message.success('Login successful')
        router.push(path[0].path)  // ← just redirect, no modal needed
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data)
        Modal.error({
          title: 'Login failed',
          content: error.response?.data?.res_data?.message,
          onOk: () => Modal.destroyAll(),
          onCancel: () => Modal.destroyAll(),
        })
      } else {
        console.error(error)
      }
    } finally {
      dispatch(setTaskSchedule({
        loading: false,
        status: "SUCCESS"
      }))
    }
  }, [router, dispatch])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name='username'
        rules={{
          required: 'Please enter Username'
        }}
        render={({ field }) => {
          return (
            <fieldset>
              <label>Username</label>
              <Input
                {...field}
                name={field.name}
                placeholder='Username'
              />
              {!!errors.username &&
                <p className='text-red-500'>{errors.username.message}</p>
              }
            </fieldset>
          )
        }}
      />
      <Controller
        control={control}
        name='password'
        rules={{
          required: 'Please enter Password'
        }}
        render={({ field }) => {
          return (
            <fieldset>
              <label>Password</label>
              <Input.Password
                {...field}
                name={field.name}
                placeholder='Password'
              />
              {!!errors.password &&
                <p className='text-red-500'>{errors.password.message}</p>
              }
            </fieldset>
          )
        }}
      />
      <Button
        htmlType='submit'
        type='primary'
        loading={loading}
      >
        Login
      </Button>
    </form>
  )
}

export default React.memo<Props>(AuthScreen)
