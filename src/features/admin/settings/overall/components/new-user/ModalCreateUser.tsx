import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetUserModalData } from '@/stores/reducers/modal/customModalSlice'
import { APIResponseGeneralUser } from '@/types/manage/general-user-api'
import { ConfigProvider, Modal, Segmented } from 'antd'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { FormCreateITSUser, FormCreateLDAPUser, FormUpdatePassword } from '../../components'
import type { RefObject } from 'react'
import { TbUsersPlus } from 'react-icons/tb'
import { useCreateUser, useUpdateUser, useUpdateUserPassword } from '@/hooks/queries/manage'

interface Props {

}

interface ContentProps {
  data?: APIResponseGeneralUser | null
  submitRef: RefObject<HTMLButtonElement | null>
  onSuccess?: () => void
  type?: 'CREATE' | 'UPDATE' | 'DELETE' | 'UPDATE_PASSWORD'
}

const Content: React.FC<ContentProps> = (props) => {
  const { data, submitRef, onSuccess, type: modalType } = props
  const [type, setType] = useState(data?.is_ldap ? 'LDAP' : 'DRR_ITS')

  const renderFormContent = useMemo(() => {
    if (modalType === 'UPDATE_PASSWORD') {
      return <FormUpdatePassword data={data} submitRef={submitRef} onSuccess={onSuccess} />
    } else {
      switch (type) {
        case 'DRR_ITS':
          return <FormCreateITSUser data={data} submitRef={submitRef} onSuccess={onSuccess} />
        case 'LDAP':
          return <FormCreateLDAPUser data={data} submitRef={submitRef} onSuccess={onSuccess} />
        default:
          return null
      }
    }
  }, [type, submitRef, onSuccess, data, modalType])

  const renderSegmented = useMemo(() => {
    if (data?.user_id) return
    return (
      <section>
        <Segmented
          defaultValue={type || 'DRR_ITS'}
          options={[
            {
              label: "DRR ITS",
              value: "DRR_ITS"
            },
            {
              label: "LDAP",
              value: "LDAP"
            }
          ]}
          onChange={setType}
          styles={{
            root: {
              border: '1px solid var(--yellow)',
            }
          }}
        />
      </section>
    )
  }, [data, type])

  return (
    <div className='mt-5'>
      {renderSegmented}
      <section className={data?.user_id ? '' : 'mt-3'}>
        {renderFormContent}
      </section>
    </div>
  )
}

const ModalCreateUser: React.FC<Props> = (props) => {
  const { } = props
  const submitRef = useRef<HTMLButtonElement | null>(null)
  const { open, type, data } = useAppSelector((state) => state.custom_modal.user_modal)
  const dispatch = useAppDispatch()

  const { isPending: isCreatePending } = useCreateUser()
  const { isPending: isUpdatePending } = useUpdateUser()
  const { isPending: isUpdatePasswordPending } = useUpdateUserPassword()

  const handleClose = useCallback(() => {
    dispatch(resetUserModalData())
  }, [dispatch])

  const renderTitle = useMemo(() => {
    return (
      <div className='flex items-center flex-wrap gap-3'>
        <TbUsersPlus className='fs-24 text-(--default-blue)' />
        <h3 className='text-(--default-blue)'>
          {data?.user_id ? (type === 'UPDATE_PASSWORD' ? "เปลี่ยนรหัสผ่านผู้ใช้งาน" : "แก้ไขข้อมูลผู้ใช้งาน") : "เพิ่มข้อมูลผู้ใช้งาน"}
        </h3>
      </div>
    )
  }, [data?.user_id, type])

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#FFFFFF',
            borderRadiusLG: 20,
          }
        }
      }}
    >
      <Modal
        title={renderTitle}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={type === 'DELETE' ? false : open}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        okButtonProps={{
          loading: isCreatePending || isUpdatePending || isUpdatePasswordPending,
          shape: 'round'
        }}
        cancelButtonProps={{
          loading: isCreatePending || isUpdatePending || isUpdatePasswordPending,
          shape: 'round'
        }}
        onOk={() => submitRef.current?.click()}
        onCancel={handleClose}
        destroyOnHidden
        width={type === 'UPDATE_PASSWORD' ? 600 : 800}
      >
        <Content
          data={data}
          submitRef={submitRef}
          onSuccess={handleClose}
          type={type}
        />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalCreateUser)
