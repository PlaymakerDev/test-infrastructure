/** รหัสโครงการ is optional — a project can be filed before it has one (user
 *  2026-09-26, again 2026-10-02). PUT /manage/project still refuses an empty
 *  project_no though (400 40010 keys ["project_no"]; POST takes it), so a
 *  project without a code is saved as "-": the mark the app already reads as
 *  "no code" — the forms show it as an empty field and every table prints "-"
 *  for a missing code anyway. Codes needn't be unique (several are shared on
 *  prod), so many projects can carry it. Drop the stand-in once the backend's
 *  PUT stops requiring the field. */
export const NO_PROJECT_NO = '-'

/** The project_no to send: what was typed, or the stand-in. */
export const projectNoForSave = (code: string | null | undefined): string =>
  code?.trim() || NO_PROJECT_NO

/** The project_no as the form shows it — the stand-in reads as empty. */
export const projectNoForForm = (stored: string | null | undefined): string =>
  stored && stored.trim() !== NO_PROJECT_NO ? stored : ''
