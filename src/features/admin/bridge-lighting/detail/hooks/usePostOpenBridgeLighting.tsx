import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, message } from 'antd'
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import { AxiosError } from 'axios'
import { postOpenBridgeLightingAPI } from '@/services/routes/BridgeLightingService'
import { bridgeLightingDetailKeys } from '../data/queryKeys'

/** Sends the remote open/close command. On success: dedicated Modal (matches
 *  dashvue's SweetAlert "เปิด/ปิดเรียบร้อยแล้ว") + invalidates the shelly-status
 *  and pm-chart caches so the detail page picks up the new state without an
 *  F5. On failure: error Modal with the upstream message + a toast fallback
 *  in case the modal blur wasn't clear enough. */
export const usePostOpenBridgeLighting = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postOpenBridgeLightingAPI,
    onSuccess: (_res, vars) => {
      const isOn = vars.send === '1'
      // Modal.success is a STATIC method → it doesn't read the ConfigProvider
      // theme, so force the app font (IBM Plex Sans Thai) + 14px on the text
      // spans / body / button to match the confirm popup and the rest of the app.
      const FONT = 'var(--font-ibm-plex-sans-thai)'
      Modal.success({
        title: (
          <span className='fs-12! font-normal! block' style={{ fontFamily: FONT }}>
            {isOn ? 'เปิดไฟประดับสะพานสำเร็จ' : 'ปิดไฟประดับสะพานสำเร็จ'}
          </span>
        ),
        icon: <CheckCircleFilled style={{ color: '#66AEFF' }} />,
        content: (
          <span className='fs-12! block' style={{ fontFamily: FONT }}>
            ระบบส่งคำสั่งไปยังอุปกรณ์เรียบร้อยแล้ว สถานะจะอัพเดตอัตโนมัติภายในไม่กี่วินาที
          </span>
        ),
        styles: { body: { fontFamily: FONT } },
        okText: 'ตกลง',
        okButtonProps: {
          style: {
            background: '#66AEFF',
            borderColor: '#66AEFF',
            color: '#fff',
            fontFamily: FONT,
          },
        },
        centered: true,
      })
      queryClient.invalidateQueries({ queryKey: bridgeLightingDetailKeys.shellyStatus() })
      queryClient.invalidateQueries({ queryKey: bridgeLightingDetailKeys.pmChart() })
    },
    onError: (error) => {
      const detail =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? error.message)
          : 'เกิดข้อผิดพลาดในการส่งคำสั่งเปิด-ปิดไฟประดับสะพาน'
      Modal.error({
        title: 'ส่งคำสั่งไม่สำเร็จ',
        icon: <CloseCircleFilled style={{ color: '#E94C4C' }} />,
        content: detail,
        okText: 'ปิด',
        centered: true,
      })
      message.error(detail)
    },
  })
}
