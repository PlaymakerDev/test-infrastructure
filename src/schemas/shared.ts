import { z } from 'zod'
import type { APIResponseContactDetail, APIResponsePost, MetaData, UploadResponse } from '@/types/shared'

export const metaDataSchema = z.object({
  count: z.number(),
  page: z.number(),
  limit: z.number(),
  total_pages: z.number(),
}) satisfies z.ZodType<MetaData>

export const apiResponsePostSchema = z.object({
  res_code: z.number(),
  res_data: z.string(),
}) satisfies z.ZodType<APIResponsePost>

export const uploadResponseSchema = z.object({
  path: z.string(),
}) satisfies z.ZodType<UploadResponse>

export const apiResponseContactDetailSchema = z.object({
  id: z.number(),
  project_name: z.string(),
  contract_no: z.string(),
  department_name: z.string(),
  warranty_start_date: z.string(),
  warranty_end_date: z.string(),
  warranty_date: z.number(),
  warranty_status: z.string(),
  company_name: z.string(),
}) satisfies z.ZodType<APIResponseContactDetail>
