"use client"
import { Button } from 'antd'
import React, { useState } from 'react'
import { TbLayoutGrid, TbList, TbPlus, TbPrinter } from 'react-icons/tb'
import { useContainerHeight } from '@/hooks/useContainerHeight'
import { useOverallContext } from '../context'
import { calcTableScrollY } from '../hooks/useTableScrollY'
import type { Project } from '../types/project'
import DeleteProjectModal from './project/DeleteProjectModal'
import FormSearchProject from './project/FormSearchProject'
import ProjectModal from './project/ProjectModal'
import TableProject from './project/TableProject'

const ProjectSection: React.FC = () => {
  const { viewMode, setViewMode } = useOverallContext()
  const [projectModal, setProjectModal] = useState<{ open: boolean; editing: Project | null }>({
    open: false,
    editing: null,
  })
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [attachContainer, containerH] = useContainerHeight<HTMLDivElement>()

  const openCreate = () => setProjectModal({ open: true, editing: null })
  const openEdit = (project: Project) => setProjectModal({ open: true, editing: project })
  const closeProject = () => setProjectModal({ open: false, editing: null })

  return (
    <div
      ref={attachContainer}
      className='rounded-2xl p-5 flex flex-col h-full'
      style={{ background: '#191919', border: '1px solid var(--light-gray-2)' }}
    >
      <div className='shrink-0 flex flex-col lg:flex-row lg:items-end gap-4'>
        <div className='flex-1 min-w-0'>
          <FormSearchProject />
        </div>
        <div className='flex items-center gap-2 flex-wrap'>
          <Button
            size='large'
            shape='round'
            icon={<TbPlus />}
            onClick={openCreate}
            style={{
              background: 'var(--yellow)',
              color: '#000',
              borderColor: 'var(--yellow)',
              fontWeight: 700,
            }}
          >
            เพิ่มโครงการ
          </Button>
          <Button
            size='large'
            shape='circle'
            icon={<TbList size={18} />}
            onClick={() => setViewMode('list')}
            type={viewMode === 'list' ? 'primary' : 'default'}
            ghost={viewMode !== 'list'}
            title='ตาราง'
          />
          <Button
            size='large'
            shape='circle'
            icon={<TbLayoutGrid size={18} />}
            onClick={() => setViewMode('grid')}
            type={viewMode === 'grid' ? 'primary' : 'default'}
            ghost={viewMode !== 'grid'}
            title='กริด'
          />
          <Button
            size='large'
            shape='round'
            icon={<TbPrinter />}
            style={{
              background: '#66AEFF',
              color: '#000',
              borderColor: '#66AEFF',
              fontWeight: 600,
            }}
          >
            นำออกเอกสาร
          </Button>
        </div>
      </div>

      <div className='flex-1 min-h-0 mt-5'>
        <TableProject
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          scrollY={calcTableScrollY(containerH)}
        />
      </div>

      <ProjectModal open={projectModal.open} editing={projectModal.editing} onClose={closeProject} />
      <DeleteProjectModal
        open={!!deleteTarget}
        project={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default React.memo(ProjectSection)
