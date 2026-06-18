"use client"

import React from 'react'



const PHASE_METRICS = [

  { label: 'Volt', value: '240.2' },

  { label: 'Amp', value: '35.2' },

  { label: 'Watt', value: '50.27' },

  { label: 'Pf', value: '0.97' },

  { label: 'kWh', value: '3.02' },

  { label: 'Hz', value: '50.03' },

] as const



/** Electrical system card — 3 Phase metrics grid with expand trigger. */

const ElectricalSystemCard: React.FC = () => {

  return (

    <div

      className='relative w-full h-[350px] rounded-[20px] p-4 flex flex-col border-2 border-white/70 overflow-hidden'

      style={{ background: '#191919CC' }}

    >

      <div

        className='pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[220px] h-[160px]'

        style={{

          background: 'radial-gradient(ellipse at center, rgba(102, 174, 255, 0.28) 0%, transparent 68%)',

        }}

      />



      <button

        type='button'

        aria-label='ดูรายละเอียดระบบไฟฟ้า'

        className='absolute top-3 right-3 z-10 border-0 cursor-pointer hover:brightness-110 transition-all p-0 bg-transparent'

      >

        <img src='/images/Lighting/arrowdown.png' alt='' width={32} height={32} className='shrink-0' />

      </button>



      <div className='relative z-10 flex flex-row items-start gap-2 pr-10'>

        <img src='/images/Lighting/icelt1.png' alt='' width={32} height={32} className='shrink-0' />

        <p className='text-[14px] font-bold m-0 text-white leading-tight'>ระบบไฟฟ้า</p>

      </div>



      <div className='relative z-10 flex-1 flex flex-col items-center justify-center text-center'>

        <p className='text-[24px] font-bold m-0 text-white leading-none'>3 Phase</p>

        <p className='text-[12px] font-normal m-0 mt-1' style={{ color: '#66AEFF' }}>

          Three Phase

        </p>

      </div>



      <div className='relative z-10 w-full'>

        <p className='text-[11px] font-normal m-0 mb-1.5 text-left' style={{ color: '#979797' }}>

          Average

        </p>

        <div className='grid grid-cols-3 gap-1.5 w-full'>

          {PHASE_METRICS.map((metric) => (

            <div

              key={metric.label}

              className='flex flex-col items-center justify-center rounded-[10px] w-full h-[54px]'

              style={{

                background: '#191919',

                border: '1px solid #66AEFF',

              }}

            >

              <span className='text-[10px] font-normal m-0' style={{ color: '#66AEFF' }}>

                {metric.label}

              </span>

              <span className='text-[12px] font-bold m-0 mt-0.5 text-white'>{metric.value}</span>

            </div>

          ))}

        </div>

      </div>

    </div>

  )

}



export default React.memo(ElectricalSystemCard)


