"use client"
import React, { useState } from 'react'
import CaseFormSection, { CaseFormState } from '../components/CaseFormSection'
import CaseInfoSidebar from '../components/CaseInfoSidebar'
import CaseStatusCards from '../components/CaseStatusCards'
import ModalSaveSuccess from '../components/ModalSaveSuccess'
import { TitleSection } from '../components'
import { CASE_MOCK, DEFAULT_CASE_DATA } from '../data/mockData'

interface Props {
  id: string
}

const MaintenanceCaseScreen: React.FC<Props> = ({ id }) => {
  const caseData = CASE_MOCK[id] ?? DEFAULT_CASE_DATA
  const { project, device, form } = caseData

  const [modalOpen, setModalOpen] = useState(false)
  const [closeCaseAfterSave, setCloseCaseAfterSave] = useState(false)
  const [formData, setFormData] = useState<CaseFormState>({ ...form })

  const handleFormChange = (patch: Partial<CaseFormState>) => {
    setFormData(prev => ({ ...prev, ...patch }))
  }

  return (
    <div className='main-screen'>
      <style>{`
        .maintenance-upload-dragger .ant-upload { padding: 8px !important; }
        .maintenance-upload-dragger .ant-upload-drag { min-height: unset !important; }
      `}</style>
      <TitleSection caseId={id} />
      <CaseStatusCards repairStatus={caseData.repairStatus} problemCategory={caseData.problemCategory} />
      <section className='mt-4 px-10 flex gap-4'>
        <CaseFormSection
          formData={formData}
          closeCaseAfterSave={closeCaseAfterSave}
          onFormChange={handleFormChange}
          onToggleCloseCase={() => setCloseCaseAfterSave(prev => !prev)}
          onSave={() => setModalOpen(true)}
        />
        <CaseInfoSidebar project={project} device={device} />
      </section>
      <ModalSaveSuccess
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isClosingCase={Boolean(
          formData.category || formData.agency || formData.problem ||
          formData.solution || formData.reportDate || formData.inspectDate,
        )}
        data={{
          caseNo: id,
          deviceName: device.deviceName,
          agency: project.agency,
          warrantyStatus: project.warrantyStatus === 'expired' ? 'หมดค้ำ' : 'ในค้ำ',
          repairDate: formData.reportDate || '-',
        }}
      />
    </div>
  )
}

export default React.memo<Props>(MaintenanceCaseScreen)
