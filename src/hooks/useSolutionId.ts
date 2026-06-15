"use client"
import { useSearchParams } from 'next/navigation'

/** Returns the solution ID from the URL query (`?solution_id=`).
 *  Returns `null` when no param is set — caller decides how to fall back
 *  (e.g., "show all" vs. "redirect to default"). */
export const useSolutionId = (): string | null => {
  const params = useSearchParams()
  return params.get('solution_id')
}
