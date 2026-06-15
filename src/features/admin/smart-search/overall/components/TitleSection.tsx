"use client"
import { useRouter } from "next/navigation"
import React from "react"
import { TbArrowBigLeftFilled } from "react-icons/tb"

const TitleSection: React.FC = () => {
  const router = useRouter()

  return (
    <div className="px-3">
      <section className="flex items-start gap-3">
        <TbArrowBigLeftFilled
          className="fs-24 text-(--yellow) cursor-pointer mt-2"
          onClick={() => router.back()}
        />
        <div>
          <h1 className="text-(--yellow)">Smart Search</h1>
          <p className="text-(--yellow)">ตัวช่วยค้นหาข้อมูลที่รวดเร็ว</p>
        </div>
      </section>
    </div>
  )
}

export default React.memo(TitleSection)
