"use client"
import React, { useCallback, useMemo, useState } from 'react'
import {
  App,
  Badge,
  Button,
  ConfigProvider,
  Input,
  Skeleton,
  Switch,
  Table,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  TbAlertTriangle,
  TbCheck,
  TbExternalLink,
  TbRefresh,
  TbSearch,
  TbWifi,
  TbWifiOff,
  TbHelpCircle,
} from 'react-icons/tb'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'
import type { BureauSelection } from '@/types/control-vms/bureau'
import type { ScreenInfoItem } from '@/types/vms/screen-info-api'
import ScopePicker from './ScopePicker'
import { useCentralizeVMSScreenInfo, useScreenInfo } from '../hooks/useScreenInfo'

dayjs.extend(relativeTime)

interface Props {
  onOpenSignDetail?: (vmsId: number) => void
}

const emptySelection: BureauSelection = {
  keys: [],
  bureaus: [],
  states: [],
  routes: [],
  signs: [],
}

// Version comparison — dotted-integer, left-to-right (26.7.19.1 style).
// Falls back to string compare if any segment is non-numeric so we don't
// blow up on unexpected agent strings; anything unparseable is treated as
// "lower" than the target so we still surface it as out-of-date.
const cmpVersion = (a: string | null | undefined, b: string): number => {
  if (!a) return -1
  const av = a.split('.').map((x) => Number.parseInt(x, 10))
  const bv = b.split('.').map((x) => Number.parseInt(x, 10))
  const n = Math.max(av.length, bv.length)
  for (let i = 0; i < n; i++) {
    const ai = Number.isFinite(av[i]) ? av[i] : -1
    const bi = Number.isFinite(bv[i]) ? bv[i] : -1
    if (ai !== bi) return ai - bi
  }
  return 0
}

const relTime = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  const d = dayjs(iso)
  return d.isValid() ? d.locale('th').fromNow() : '—'
}

// ---------------------------------------------------------------------------
// Pill components — small enough that inlining is cleaner than a shared file
// ---------------------------------------------------------------------------

type StatusKind = 'online' | 'offline' | 'never'

const statusMeta = (item: ScreenInfoItem): { kind: StatusKind; color: string; label: string } => {
  if (!item.is_reported) return { kind: 'never', color: '#9ca3af', label: 'ยังไม่รายงาน' }
  if (item.is_online) return { kind: 'online', color: '#22c55e', label: 'Online' }
  return { kind: 'offline', color: '#ef4444', label: 'Offline' }
}

const Pill: React.FC<{
  color: string
  label: React.ReactNode
  icon?: React.ReactNode
  tooltip?: React.ReactNode
}> = ({ color, label, icon, tooltip }) => {
  const el = (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap"
      style={{
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 999,
        color,
        background: `${color}22`,
        border: `1px solid ${color}55`,
        fontWeight: 600,
        lineHeight: 1.4,
      }}
    >
      {icon}
      {label}
    </span>
  )
  return tooltip !== undefined ? <Tooltip title={tooltip}>{el}</Tooltip> : el
}

const Chip: React.FC<{ active: boolean; label: React.ReactNode; onClick: () => void }> = ({
  active,
  label,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="text-[11px] px-2.5 py-0.5 rounded-full transition-colors border"
    style={{
      background: active ? '#FCD116' : 'transparent',
      color: active ? '#191919' : '#FCD116',
      borderColor: '#FCD116',
      fontWeight: active ? 600 : 400,
    }}
  >
    {label}
  </button>
)

// AntD's copyable Text wrapped in a mono span so IPs / IDs stay aligned. Empty
// values render as a dash so the column doesn't collapse.
const Mono: React.FC<{ value: string | null | undefined; copyable?: boolean }> = ({
  value,
  copyable = false,
}) => {
  if (!value) return <span className="text-white/30">—</span>
  return (
    <Typography.Text
      className="text-white/85"
      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}
      copyable={copyable ? { text: value } : false}
    >
      <span>{value}</span>
    </Typography.Text>
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type StatusFilter = 'all' | 'reported' | 'online' | 'offline' | 'never'

const StatusTable: React.FC<Props> = ({ onOpenSignDetail }) => {
  const { message, modal } = App.useApp()
  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useScreenInfo({
    refetchIntervalMs: 30_000,
  })
  const centralize = useCentralizeVMSScreenInfo()

  // useMemo the derived array — the `?? []` fallback creates a fresh literal
  // on every render otherwise, and downstream memos depend on `rows`.
  const rows: ScreenInfoItem[] = useMemo(() => data?.data?.data ?? [], [data])
  const summary = data?.data?.summary

  // ScopePicker filter — empty selection means "show all"
  const [selection, setSelection] = useState<BureauSelection>(emptySelection)
  const selectedVmsIds = useMemo(
    () => new Set(selection.signs.map((s) => s.vms_id)),
    [selection.signs]
  )

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [controllableOnly, setControllableOnly] = useState(false)

  // Filter pipeline — cheap enough (<1000 rows) to run inline; memoized so
  // sorting/hovering doesn't re-run the whole chain.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((it) => {
      if (selectedVmsIds.size > 0 && !selectedVmsIds.has(it.vms_id)) return false
      if (controllableOnly && !it.is_controllable) return false
      if (statusFilter !== 'all') {
        const meta = statusMeta(it)
        if (statusFilter === 'reported' && !it.is_reported) return false
        if (statusFilter === 'online' && meta.kind !== 'online') return false
        if (statusFilter === 'offline' && meta.kind !== 'offline') return false
        if (statusFilter === 'never' && meta.kind !== 'never') return false
      }
      if (q) {
        const hay = [
          String(it.wid),
          it.solution_name,
          it.road_code,
          it.machine_name,
          it.anydesk_id,
          it.zt_ip,
          it.tailscale_ip,
          it.local_ip,
          it.project_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [rows, selectedVmsIds, search, statusFilter, controllableOnly])

  const handleCentralize = useCallback(
    async (wid: number, next: boolean) => {
      try {
        await centralize.mutateAsync({ wid, data: { is_centralized: next } })
        message.success(next ? 'เข้ากลุ่มควบคุมรวมแล้ว' : 'ถอดออกจากกลุ่มควบคุมรวมแล้ว')
      } catch {
        message.error('อัพเดตสถานะไม่สำเร็จ')
      }
    },
    [centralize, message]
  )

  // Switch handler — bare toggle for opt-in, imperative Modal.confirm for the
  // destructive opt-out (matches the Composer / cancel patterns in the app).
  const handleToggleCentralize = useCallback(
    (row: ScreenInfoItem, next: boolean) => {
      if (next) {
        void handleCentralize(row.wid, true)
        return
      }
      modal.confirm({
        title: 'ถอด wid ออกจากการควบคุมรวม?',
        content: `ป้าย WID ${row.wid} (${row.solution_name || '-'}) จะไม่ถูก dispatch จาก Command Center จนกว่าจะเปิดใหม่`,
        okText: 'ยืนยันถอด',
        okButtonProps: { danger: true },
        cancelText: 'ยกเลิก',
        onOk: () => handleCentralize(row.wid, false),
      })
    },
    [handleCentralize, modal]
  )

  const lastUpdated = dataUpdatedAt ? dayjs(dataUpdatedAt).locale('th').fromNow() : '—'
  const minVersion = rows[0]?.min_controllable_version || '26.7.19.1'

  const columns: ColumnsType<ScreenInfoItem> = useMemo(
    () => [
      {
        title: 'WID',
        dataIndex: 'wid',
        key: 'wid',
        width: 78,
        fixed: 'left',
        render: (v: number, r) => (
          <button
            type="button"
            onClick={() => onOpenSignDetail?.(r.vms_id)}
            className="text-(--yellow) hover:underline"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}
          >
            {v}
          </button>
        ),
      },
      {
        title: 'ป้าย',
        key: 'sign',
        width: 220,
        render: (_: unknown, r) => (
          <div className="min-w-0">
            <div className="truncate text-sm text-white/90">{r.solution_name || '—'}</div>
            {r.road_code && (
              <div className="text-[11px] text-white/50 truncate">
                {r.road_code}
                {r.sta ? ` · กม.${r.sta}` : ''}
              </div>
            )}
          </div>
        ),
      },
      {
        title: 'สังกัด',
        key: 'project',
        width: 180,
        render: (_: unknown, r) => (
          <div className="text-xs text-white/80 truncate" title={r.project_name}>
            {r.project_name || '—'}
          </div>
        ),
      },
      {
        title: 'สถานะ',
        key: 'status',
        width: 128,
        render: (_: unknown, r) => {
          const m = statusMeta(r)
          return (
            <Pill
              color={m.color}
              label={m.label}
              icon={
                m.kind === 'online' ? (
                  <TbWifi size={12} />
                ) : m.kind === 'offline' ? (
                  <TbWifiOff size={12} />
                ) : (
                  <TbHelpCircle size={12} />
                )
              }
              tooltip={
                r.reported_at
                  ? `รายงานล่าสุด ${relTime(r.reported_at)}`
                  : 'ยังไม่เคยรายงาน (agent ยังไม่ติดต่อ backend)'
              }
            />
          )
        },
      },
      {
        title: 'ควบคุมได้?',
        key: 'controllable',
        width: 132,
        render: (_: unknown, r) =>
          r.is_controllable ? (
            <Pill color="#22c55e" label="ควบคุมได้" icon={<TbCheck size={12} />} />
          ) : (
            <Pill
              color="#f59e0b"
              label="เวอร์ชันต่ำ"
              icon={<TbAlertTriangle size={12} />}
              tooltip={
                <div className="text-xs">
                  <div>ต้องอัพเดต agent ≥ {r.min_controllable_version || minVersion}</div>
                  <div className="opacity-70">agent ปัจจุบัน: {r.app_version || '—'}</div>
                </div>
              }
            />
          ),
      },
      {
        title: 'Machine',
        dataIndex: 'machine_name',
        key: 'machine_name',
        width: 140,
        render: (v: string | null) => <Mono value={v} />,
      },
      {
        title: 'Version',
        dataIndex: 'app_version',
        key: 'app_version',
        width: 112,
        render: (v: string | null, r) => {
          if (!v) return <span className="text-white/30">—</span>
          const upToDate = cmpVersion(v, r.min_controllable_version || minVersion) >= 0
          const color = upToDate ? '#22c55e' : '#eab308'
          return (
            <Tooltip
              title={
                upToDate
                  ? `≥ ${r.min_controllable_version || minVersion}`
                  : `ต่ำกว่า ${r.min_controllable_version || minVersion}`
              }
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  color,
                  background: `${color}22`,
                  border: `1px solid ${color}55`,
                }}
              >
                {v}
              </span>
            </Tooltip>
          )
        },
      },
      {
        title: 'AnyDesk',
        dataIndex: 'anydesk_id',
        key: 'anydesk_id',
        width: 130,
        render: (v: string | null) => <Mono value={v} copyable />,
      },
      {
        title: 'ZT IP',
        dataIndex: 'zt_ip',
        key: 'zt_ip',
        width: 130,
        render: (v: string | null) => <Mono value={v} copyable />,
      },
      {
        title: 'Tailscale',
        dataIndex: 'tailscale_ip',
        key: 'tailscale_ip',
        width: 130,
        render: (v: string | null) => <Mono value={v} copyable />,
      },
      {
        title: 'LAN',
        dataIndex: 'local_ip',
        key: 'local_ip',
        width: 130,
        render: (v: string | null) => <Mono value={v} copyable />,
      },
      {
        title: 'Enixma',
        key: 'enixma',
        width: 148,
        render: (_: unknown, r) => {
          if (r.enixma_status === 'ok' && r.enixma_url) {
            return (
              <a
                href={r.enixma_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px]"
                style={{ color: '#22c55e' }}
              >
                <TbExternalLink size={12} />
                enixma.net
              </a>
            )
          }
          if (r.enixma_status === 'failed') {
            return (
              <Pill
                color="#ef4444"
                label="ตรวจสอบไม่ผ่าน"
                tooltip={r.enixma_last_error || 'เชื่อมต่อ enixma ไม่ได้'}
              />
            )
          }
          if (r.enixma_status === 'pending') {
            return <Pill color="#eab308" label="รอ auto" tooltip="กำลังตั้งค่า tunnel อัตโนมัติ" />
          }
          return <span className="text-white/30">—</span>
        },
      },
      {
        title: 'Legacy URL',
        key: 'legacy_url',
        width: 92,
        render: (_: unknown, r) => {
          const differs =
            r.desktop_screen_url && r.desktop_screen_url !== r.enixma_url
          if (!differs) return <span className="text-white/30">—</span>
          return (
            <a
              href={r.desktop_screen_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--default-blue) hover:underline inline-flex items-center gap-1 text-xs"
            >
              <TbExternalLink size={12} />
              ดู
            </a>
          )
        },
      },
      {
        title: 'อัพเดต',
        dataIndex: 'screen_info_updated_at',
        key: 'screen_info_updated_at',
        width: 128,
        render: (v: string | null) => (
          <Tooltip title={v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : 'ไม่มีข้อมูล'}>
            <span className="text-xs text-white/70">{relTime(v)}</span>
          </Tooltip>
        ),
      },
      {
        title: (
          <Tooltip title='เมื่อเปิด ป้ายนี้จะถูก dispatch จาก Command Center; ปิด = ป้ายจะถูกข้ามในการส่งคำสั่งรวม'>
            <span>เข้ากลุ่ม?</span>
          </Tooltip>
        ),
        key: 'is_centralized',
        width: 92,
        fixed: 'right',
        render: (_: unknown, r) => (
          <Switch
            size="small"
            checked={r.is_centralized}
            loading={centralize.isPending && centralize.variables?.wid === r.wid}
            onChange={(next) => handleToggleCentralize(r, next)}
          />
        ),
      },
    ],
    [centralize.isPending, centralize.variables, handleToggleCentralize, minVersion, onOpenSignDetail]
  )

  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] gap-3">
      {/* Left: scope filter panel */}
      <div className="rounded-xl bg-(--dark-black) overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
          <div className="text-xs font-semibold text-(--yellow)">กรองตามโครงสร้าง</div>
          <Badge count={filtered.length} showZero color="#f59e0b" overflowCount={999} />
        </div>
        <div className="flex-1 min-h-0">
          <ScopePicker
            onSelectionChange={setSelection}
            selection={selection}
            alwaysSelectMode
            includeOfflineOnSelectAll
          />
        </div>
      </div>

      {/* Right: summary + filters + table */}
      <div className="rounded-xl bg-(--dark-black) overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-(--yellow)">สถานะการแสดงผลของป้ายทั้งหมด</div>
              <div className="text-xs opacity-60 mt-0.5">
                รวม {summary?.total ?? rows.length} ป้าย · ออนไลน์ {summary?.online ?? 0} · ควบคุมได้{' '}
                {summary?.controllable ?? 0} · เข้ากลุ่ม {summary?.centralized ?? 0}
                {isFetching && <span className="opacity-70"> · กำลังโหลด...</span>}
              </div>
              <div className="text-[11px] opacity-40 mt-0.5">อัพเดตล่าสุด {lastUpdated}</div>
            </div>
            <Button
              size="small"
              icon={<TbRefresh style={{ verticalAlign: -2 }} />}
              onClick={() => refetch()}
              loading={isFetching}
            >
              รีเฟรช
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Input
              size="small"
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<TbSearch size={14} className="opacity-60" />}
              placeholder="ค้นชื่อ / WID / Machine / AnyDesk / IP"
              style={{ width: 260 }}
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              <Chip
                active={statusFilter === 'all'}
                label="ทั้งหมด"
                onClick={() => setStatusFilter('all')}
              />
              <Chip
                active={statusFilter === 'reported'}
                label="เคยรายงาน"
                onClick={() => setStatusFilter('reported')}
              />
              <Chip
                active={statusFilter === 'online'}
                label="Online"
                onClick={() => setStatusFilter('online')}
              />
              <Chip
                active={statusFilter === 'offline'}
                label="Offline"
                onClick={() => setStatusFilter('offline')}
              />
              <Chip
                active={statusFilter === 'never'}
                label="ยังไม่รายงาน"
                onClick={() => setStatusFilter('never')}
              />
              <Chip
                active={controllableOnly}
                label={controllableOnly ? 'เฉพาะควบคุมได้ ✓' : 'เฉพาะควบคุมได้'}
                onClick={() => setControllableOnly((v) => !v)}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <Skeleton active paragraph={{ rows: 8 }} />
            </div>
          ) : (
            <ConfigProvider
              theme={{
                components: {
                  Table: {
                    headerBg: '#1f1f1f',
                    headerColor: 'rgba(255,255,255,0.85)',
                    colorBgContainer: 'transparent',
                    rowHoverBg: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    headerSplitColor: 'rgba(255,255,255,0.08)',
                  },
                },
              }}
            >
              <Table<ScreenInfoItem>
                dataSource={filtered}
                columns={columns}
                rowKey="wid"
                size="small"
                sticky
                pagination={{
                  pageSize: 50,
                  showSizeChanger: true,
                  pageSizeOptions: ['25', '50', '100', '200'],
                  size: 'small',
                }}
                scroll={{ x: 1720, y: 'calc(100vh - 340px)' }}
                rowClassName={(r) => (r.is_centralized ? '' : 'opacity-70')}
                locale={{ emptyText: 'ไม่มีป้ายที่ตรงกับตัวกรอง' }}
              />
            </ConfigProvider>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatusTable
