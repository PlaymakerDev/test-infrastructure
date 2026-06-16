"use client"
import { useRouter } from "next/navigation"
import React from "react"
import { TbArrowBigLeftFilled } from "react-icons/tb"
import ActiveChatHeader from "./ActiveChatHeader"

const TitleSection: React.FC = () => {
  const router = useRouter()

  return (
    <div className="px-4 md:px-8 flex items-start gap-3">
      <section className="flex items-start gap-3 shrink-0">
        <TbArrowBigLeftFilled
          className="fs-24 text-(--yellow) cursor-pointer mt-2"
          onClick={() => router.back()}
        />
        <div>
          <h1 className="text-(--yellow)">Smart Search</h1>
          <p className="text-(--yellow)">ตัวช่วยค้นหาข้อมูลที่รวดเร็ว</p>
        </div>
      </section>
      <div className="flex-1 min-w-0 flex justify-end pt-2">
        <ActiveChatHeader />
      </div>
    </div>
  )
}

export default React.memo(TitleSection)
