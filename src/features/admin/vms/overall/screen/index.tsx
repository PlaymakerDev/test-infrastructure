"use client"
import React from 'react'
import { ModalVMSScreen, OverallSection, TitleSection } from '../components'
import { OverallProvider } from '../context'
import { useSearchParams } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'


const queryClient = new QueryClient()

interface Props { }

const VMSScreen: React.FC<Props> = (props) => {
  const { } = props
  const searchParams = useSearchParams()
  const deptId = searchParams.get('dept_id')

  return (
    <QueryClientProvider client={queryClient}>
      <OverallProvider>
        <div className='main-screen px-5 lg:px-10'>
          <TitleSection />
          <section className='mt-8 pb-8'>
            <OverallSection
              deptId={deptId!}
            />
          </section>
        </div>
        <CCTVModal />
        <ProjectInfoModal />
        <ModalVMSScreen />
      </OverallProvider>
    </QueryClientProvider>
  )
}

export default React.memo(VMSScreen)
