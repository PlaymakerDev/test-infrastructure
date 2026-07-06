"use client"
import { Button, ConfigProvider, DatePicker, Form, Input, Modal, Select } from 'antd'
import dayjs from 'dayjs'
import React, { useEffect, useMemo } from 'react'
import { TbClipboardList, TbPlus, TbTrash } from 'react-icons/tb'
import { MOCK_BUDGET_YEARS, MOCK_CONTRACTORS, MOCK_OWNERS, MOCK_ROADS } from '../../data/mockProjects'
import { useOverallContext } from '../../context'
import type { Project, ProjectFormValues } from '../../types/project'

interface Props {
  open: boolean
  editing: Project | null
  onClose: () => void
}

interface FormShape {
  name: string
  budgetYear: number | null
  contractNo: string
  code: string
  owner: string
  contractor: string
  roads: { code: string }[]
  warrantyStart: dayjs.Dayjs | null
  warrantyEnd: dayjs.Dayjs | null
}

const ProjectModal: React.FC<Props> = ({ open, editing, onClose }) => {
  const [form] = Form.useForm<FormShape>()
  const { createProject, updateProject } = useOverallContext()

  const isEdit = !!editing

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        budgetYear: editing.budgetYear,
        contractNo: editing.contractNo,
        code: editing.code === '-' ? '' : editing.code,
        owner: editing.owner,
        contractor: editing.contractor,
        roads: editing.roads.map((r) => ({ code: r.code })),
        warrantyStart: editing.warrantyStart ? dayjs(editing.warrantyStart) : null,
        warrantyEnd: editing.warrantyEnd ? dayjs(editing.warrantyEnd) : null,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ roads: [{ code: '' }] })
    }
  }, [open, editing, form])

  const handleFinish = (values: FormShape) => {
    const payload: ProjectFormValues = {
      name: values.name,
      budgetYear: values.budgetYear ?? null,
      contractNo: values.contractNo,
      code: values.code,
      owner: values.owner,
      contractor: values.contractor,
      roads: (values.roads || []).map((r) => r.code).filter(Boolean),
      warrantyStart: values.warrantyStart?.toISOString() ?? '',
      warrantyEnd: values.warrantyEnd?.toISOString() ?? '',
    }
    if (editing) updateProject(editing.id, payload)
    else createProject(payload)
    onClose()
  }

  const roadOptions = useMemo(
    () => MOCK_ROADS.map((r) => ({ label: r.label, value: r.code })),
    [],
  )

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#000000',
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            footerBg: '#FFFFFF',
            titleColor: '#000000',
          },
          Form: { labelColor: '#000000' },
          Input: { colorTextPlaceholder: '#B0B0B0' },
          Select: { colorTextPlaceholder: '#B0B0B0' },
          DatePicker: { colorTextPlaceholder: '#B0B0B0' },
        },
      }}
    >
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnHidden
        width={720}
        title={
          <div className='flex items-center gap-2 text-black'>
            <TbClipboardList size={22} />
            <span className='font-bold text-lg'>
              {isEdit ? 'แก้ไขข้อมูลโครงการ' : 'เพิ่มข้อมูลโครงการ'}
            </span>
          </div>
        }
      >
        <Form<FormShape>
          form={form}
          layout='vertical'
          onFinish={handleFinish}
          initialValues={{ roads: [{ code: '' }] }}
        >
          <Form.Item
            label={<span className='text-black'>ชื่อโครงการ<span className='text-red-500'>*</span></span>}
            name='name'
            rules={[{ required: true, message: 'กรุณาระบุชื่อโครงการ' }]}
          >
            <Input placeholder='กรุณาระบุชื่อโครงการ...' />
          </Form.Item>

          <Form.Item
            label={<span className='text-black'>ปีงบประมาณ<span className='text-red-500'>*</span></span>}
            name='budgetYear'
            rules={[{ required: true, message: 'กรุณาเลือกปีงบประมาณ' }]}
          >
            <Select
              placeholder='กรุณาระบุปีงบประมาณ...'
              options={MOCK_BUDGET_YEARS.map((y) => ({ label: y.toString(), value: y }))}
            />
          </Form.Item>

          <div className='grid grid-cols-2 gap-4'>
            <Form.Item
              label={<span className='text-black'>เลขที่สัญญา<span className='text-red-500'>*</span></span>}
              name='contractNo'
              rules={[{ required: true, message: 'กรุณาระบุเลขที่สัญญา' }]}
            >
              <Input placeholder='กรุณาระบุเลขที่สัญญา...' />
            </Form.Item>
            <Form.Item label={<span className='text-black'>รหัสโครงการ</span>} name='code'>
              <Input placeholder='กรุณาระบุรหัสโครงการ...' />
            </Form.Item>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <Form.Item label={<span className='text-black'>ผู้ว่าจ้าง</span>} name='owner'>
              <Select
                placeholder='กรุณาเลือกผู้ว่าจ้าง...'
                allowClear
                options={MOCK_OWNERS.map((o) => ({ label: o, value: o }))}
              />
            </Form.Item>
            <Form.Item label={<span className='text-black'>ผู้รับจ้าง</span>} name='contractor'>
              <Select
                placeholder='กรุณาเลือกผู้รับจ้าง...'
                allowClear
                options={MOCK_CONTRACTORS.map((c) => ({ label: c, value: c }))}
              />
            </Form.Item>
          </div>

          <Form.List name='roads'>
            {(fields, { add, remove }) => (
              <div className='space-y-2'>
                {fields.map((field, idx) => (
                  <div key={field.key} className='flex items-end gap-2'>
                    <Form.Item
                      className='flex-1 mb-0'
                      label={
                        idx === 0 ? (
                          <span className='text-black'>สายทาง<span className='text-red-500'>*</span></span>
                        ) : (
                          <span className='text-black'>&nbsp;</span>
                        )
                      }
                      name={[field.name, 'code']}
                      rules={idx === 0 ? [{ required: true, message: 'กรุณาเลือกสายทาง' }] : []}
                    >
                      <Select placeholder='กรุณาเลือกสายทาง...' options={roadOptions} />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button
                        onClick={() => remove(field.name)}
                        icon={<TbTrash />}
                        danger
                        style={{ marginBottom: 0 }}
                      />
                    )}
                  </div>
                ))}
                <Button
                  block
                  onClick={() => add({ code: '' })}
                  icon={<TbPlus />}
                  style={{
                    background: 'var(--yellow)',
                    color: '#000',
                    borderColor: 'var(--yellow)',
                    fontWeight: 600,
                  }}
                >
                  เพิ่มสายทาง
                </Button>
              </div>
            )}
          </Form.List>

          <div className='grid grid-cols-2 gap-4 mt-4'>
            <Form.Item
              label={<span className='text-black'>วันที่เริ่มต้นค้ำประกัน<span className='text-red-500'>*</span></span>}
              name='warrantyStart'
              rules={[{ required: true, message: 'กรุณาระบุวันที่เริ่มต้นค้ำประกัน' }]}
            >
              <DatePicker className='w-full' placeholder='กรุณาระบุวันที่เริ่มต้นค้ำประกัน...' format='DD/MM/YYYY' />
            </Form.Item>
            <Form.Item
              label={<span className='text-black'>วันที่สิ้นสุดค้ำประกัน<span className='text-red-500'>*</span></span>}
              name='warrantyEnd'
              rules={[{ required: true, message: 'กรุณาระบุวันที่สิ้นสุดค้ำประกัน' }]}
            >
              <DatePicker className='w-full' placeholder='กรุณาระบุวันที่สิ้นสุดค้ำประกัน...' format='DD/MM/YYYY' />
            </Form.Item>
          </div>

          <div className='flex justify-end gap-2 mt-2'>
            <Button size='large' shape='round' onClick={onClose}>
              ยกเลิก
            </Button>
            <Button
              size='large'
              shape='round'
              htmlType='submit'
              style={{
                background: 'var(--yellow)',
                color: '#000',
                borderColor: 'var(--yellow)',
                fontWeight: 700,
              }}
            >
              ยืนยัน
            </Button>
          </div>
        </Form>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ProjectModal)
