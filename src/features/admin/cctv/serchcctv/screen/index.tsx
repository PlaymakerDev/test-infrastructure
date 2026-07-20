"use client"
import React, { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TitleSection, OverallSection } from '../components'
import { CCTVModal, ProjectInfoModal } from '@/components/modal'

/** The CCTV search page is intentionally NATIONWIDE — the user's ticket
 *  called out that road-code lookup was "search within one bureau only",
 *  and this page is where they expect to type any road_code from any
 *  province and see every CCTV solution on it. We therefore ignore the
 *  URL's dept_id and always fetch with dept 0 + scope=all so the road
 *  dropdown covers the whole country. If the URL doesn't already carry
 *  scope=all, redirect once so subsequent nav shares the same URL shape. */
const SerchCctvScreen: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('scope') !== 'all') {
      const next = new URLSearchParams(searchParams.toString())
      next.set('dept_id', '0')
      next.set('scope', 'all')
      router.replace(`?${next.toString()}`)
    }
  }, [router, searchParams])

  return (
    <div className='main-screen'>
      <TitleSection />
      <section className='mt-5 px-10 pb-8'>
        {/* Force nationwide — every road dropdown / camera list on this page
          * spans every dept, not just whichever landed the user here. */}
        <OverallSection deptId='0' />
      </section>
      {/* Global Project Info modal — opened via Redux from group ⓘ icons. */}
      <ProjectInfoModal />
      {/* Central Live Stream modal — opened via Redux from camera cards. */}
      <CCTVModal />
    </div>
  )
}

export default React.memo(SerchCctvScreen)
