"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  App,
  Button,
  ConfigProvider,
  Input,
  Skeleton,
  Switch,
  Table,
  Tag,
  Tooltip,
  Tree,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { DataNode, TreeProps } from 'antd/es/tree'
import { TbPhoto, TbRefresh, TbSearch } from 'react-icons/tb'
import type { ScreenInfoItem } from '@/types/vms/screen-info-api'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import StatusPill from './StatusPill'
import { useCentralizeVMSScreenInfo, useScreenInfo } from '../hooks/useScreenInfo'

interface Props {
  onOpenSignDetail?: (vmsId: number) => void
}

// ---------------------------------------------------------------------------
// Filter model
// ---------------------------------------------------------------------------

type ScopeFilter =
  | { level: 'all' }
  | { level: 'bureau'; id: number }
  | { level: 'state'; id: number }
  | { level: 'route'; id: number }

type StatusFilter = 'all' | 'reported' | 'online' | 'offline' | 'never'

// Parse Tree node keys back into a ScopeFilter. Keys are namespaced ('b:', 's:',
// 'r:') so we can round-trip the selection without extra bookkeeping.
const parseKey = (key: React.Key): ScopeFilter => {
  const s = String(key)
  if (s === 'all') return { level: 'all' }
  const [prefix, rest] = s.split(':')
  const id = Number.parseInt(rest ?? '', 10)
  if (!Number.isFinite(id)) return { level: 'all' }
  if (prefix === 'b') return { level: 'bureau', id }
  if (prefix === 's') return { level: 'state', id }
  if (prefix === 'r') return { level: 'route', id }
  return { level: 'all' }
}

// Chip toggle used by the status filter row. Matches the visual style used
// elsewhere in Command Center.
const Chip: React.FC<{ active: boolean; label: React.ReactNode; onClick: () => void }> = ({
  active,
  label,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="fs-12 px-2.5 py-0.5 rounded-full transition-colors border"
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

// ---------------------------------------------------------------------------
// Debounced value hook
// ---------------------------------------------------------------------------

const useDebounced = <T,>(value: T, delay = 200): T => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// ---------------------------------------------------------------------------
// Tree builder — sort each level alphabetically and group id=0 under "อื่น ๆ"
// ---------------------------------------------------------------------------

const OTHER_LABEL = 'อื่น ๆ'

interface TreeAcc {
  bureaus: Map<
    number,
    {
      id: number
      label: string
      count: number
      states: Map<
        number,
        {
          id: number
          label: string
          count: number
          roads: Map<number, { id: number; label: string; count: number }>
        }
      >
    }
  >
}

const buildTree = (rows: ScreenInfoItem[]): DataNode[] => {
  const acc: TreeAcc = { bureaus: new Map() }

  for (const r of rows) {
    const bId = r.bureau_id ?? 0
    const bLabel = r.bureau_short_name || (bId === 0 ? OTHER_LABEL : `สำนัก ${bId}`)
    let bucketB = acc.bureaus.get(bId)
    if (!bucketB) {
      bucketB = { id: bId, label: bLabel, count: 0, states: new Map() }
      acc.bureaus.set(bId, bucketB)
    }
    bucketB.count++

    const sId = r.department_id ?? 0
    const sLabel = r.department_short_name || (sId === 0 ? OTHER_LABEL : `แขวง ${sId}`)
    let bucketS = bucketB.states.get(sId)
    if (!bucketS) {
      bucketS = { id: sId, label: sLabel, count: 0, roads: new Map() }
      bucketB.states.set(sId, bucketS)
    }
    bucketS.count++

    const rId = r.road_id ?? 0
    const rLabel = r.road_code || (rId === 0 ? OTHER_LABEL : `สายทาง ${rId}`)
    let bucketR = bucketS.roads.get(rId)
    if (!bucketR) {
      bucketR = { id: rId, label: rLabel, count: 0 }
      bucketS.roads.set(rId, bucketR)
    }
    bucketR.count++
  }

  // Sort helper — "อื่น ๆ" always last, otherwise alphabetical by label.
  const sortEntries = <V extends { id: number; label: string }>(items: V[]): V[] =>
    [...items].sort((a, b) => {
      const aOther = a.id === 0
      const bOther = b.id === 0
      if (aOther && !bOther) return 1
      if (!aOther && bOther) return -1
      return a.label.localeCompare(b.label, 'th')
    })

  const bureaus = sortEntries(Array.from(acc.bureaus.values()))
  const root: DataNode = {
    key: 'all',
    title: <span className="font-semibold text-(--yellow)">{`ทั้งหมด (${rows.length})`}</span>,
    children: bureaus.map((b) => ({
      key: `b:${b.id}`,
      title: (
        <span className="text-white/90">
          {b.label}
          <span className="opacity-50 ml-1">({b.count})</span>
        </span>
      ),
      children: sortEntries(Array.from(b.states.values())).map((s) => ({
        key: `s:${s.id}`,
        title: (
          <span className="text-white/85">
            {s.label}
            <span className="opacity-50 ml-1">({s.count})</span>
          </span>
        ),
        children: sortEntries(Array.from(s.roads.values())).map((rd) => ({
          key: `r:${rd.id}`,
          isLeaf: true,
          title: (
            <span className="text-white/80">
              {rd.label}
              <span className="opacity-50 ml-1">({rd.count})</span>
            </span>
          ),
        })),
      })),
    })),
  }

  return [root]
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const StatusTable: React.FC<Props> = ({ onOpenSignDetail }) => {
  const { message, modal } = App.useApp()
  const { data, isLoading, isFetching, refetch } = useScreenInfo({
    refetchIntervalMs: 30_000,
  })
  const centralize = useCentralizeVMSScreenInfo()

  // Keep `rows` stable across renders — the tree/filter memos depend on it.
  const rows: ScreenInfoItem[] = useMemo(() => data?.data?.data ?? [], [data])
  const summary = data?.data?.summary

  const [filter, setFilter] = useState<ScopeFilter>({ level: 'all' })
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['all'])

  const [searchInput, setSearchInput] = useState('')
  const search = useDebounced(searchInput, 200)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Only one row can be HLS-expanded at a time — 248 concurrent players would
  // torch the browser. wid is the rowKey.
  const [expandedWid, setExpandedWid] = useState<number | null>(null)

  const treeData = useMemo(() => buildTree(rows), [rows])

  const clearFilter = useCallback(() => {
    setFilter({ level: 'all' })
    setSelectedKeys([])
  }, [])

  const handleTreeSelect = useCallback<NonNullable<TreeProps['onSelect']>>(
    (keys) => {
      // AntD Tree fires with 0 or 1 key in single-select mode. Empty = clicked
      // the same node again → treat as "clear".
      if (keys.length === 0) {
        clearFilter()
        return
      }
      const key = keys[0]
      const next = parseKey(key)
      setFilter(next)
      setSelectedKeys([key])

      // Auto-expand: when the user picks a bureau we open its states so they
      // can drill further without an extra click.
      if (next.level === 'bureau' || next.level === 'state') {
        setExpandedKeys((prev) => Array.from(new Set([...prev, 'all', String(key)])))
      }
    },
    [clearFilter]
  )

  // Filter pipeline: scope → status → search. All three are cheap so we chain
  // them in a single pass to keep GC pressure down.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((it) => {
      // Tree scope
      if (filter.level === 'bureau' && it.bureau_id !== filter.id) return false
      if (filter.level === 'state' && it.department_id !== filter.id) return false
      if (filter.level === 'route' && it.road_id !== filter.id) return false

      // Online/offline/reported status
      if (statusFilter !== 'all') {
        if (statusFilter === 'reported' && !it.is_reported) return false
        if (statusFilter === 'online' && !(it.is_reported && it.is_online)) return false
        if (statusFilter === 'offline' && !(it.is_reported && !it.is_online)) return false
        if (statusFilter === 'never' && it.is_reported) return false
      }

      if (q) {
        const hay = [
          String(it.wid),
          it.solution_name,
          it.road_code,
          it.bureau_short_name,
          it.department_short_name,
          it.machine_name,
          it.anydesk_id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }

      return true
    })
  }, [rows, filter, statusFilter, search])

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
        title: 'ชื่อป้าย',
        key: 'sign',
        render: (_: unknown, r) => (
          <div className="min-w-0">
            <Tooltip title={r.solution_name || ''} placement="topLeft">
              <div className="truncate text-sm font-semibold text-white/90">
                {r.solution_name || '—'}
              </div>
            </Tooltip>
            {r.machine_name && (
              <div
                className="fs-12 text-white/40 truncate"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
              >
                {r.machine_name}
              </div>
            )}
          </div>
        ),
        onCell: () => ({ style: { minWidth: 220 } }),
      },
      {
        title: 'สายทาง',
        key: 'road',
        width: 150,
        render: (_: unknown, r) => (
          <div className="min-w-0">
            <div className="truncate text-sm text-(--yellow)">{r.road_code || '—'}</div>
            {r.sta && (
              <div className="fs-12 text-white/50 truncate">กม.{r.sta}</div>
            )}
          </div>
        ),
      },
      {
        title: 'สังกัด',
        key: 'org',
        render: (_: unknown, r) => (
          <div className="min-w-0">
            <div className="truncate text-sm text-white/85">
              {r.department_short_name || '—'}
            </div>
            {r.bureau_short_name && (
              <div className="fs-12 text-white/50 truncate">{r.bureau_short_name}</div>
            )}
          </div>
        ),
        onCell: () => ({ style: { minWidth: 200 } }),
      },
      {
        title: 'สถานะการแสดงผล',
        key: 'display_status',
        render: (_: unknown, r) => {
          const hasCommand = r.setting_status != null
          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              {hasCommand ? (
                <StatusPill
                  status={r.setting_status}
                  size="sm"
                  tooltip={r.setting_status_name || undefined}
                />
              ) : (
                <span
                  className="inline-flex items-center gap-1 whitespace-nowrap"
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 999,
                    color: '#9ca3af',
                    background: '#9ca3af22',
                    border: '1px solid #9ca3af55',
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}
                >
                  ยังไม่มีคำสั่ง
                </span>
              )}
              {r.setting_type_name && (
                <Tag
                  color="default"
                  style={{
                    margin: 0,
                    fontSize: 10,
                    lineHeight: 1.4,
                    padding: '0 6px',
                    background: 'rgba(255,255,255,0.06)',
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  {r.setting_type_name}
                </Tag>
              )}
              {r.media_url && (
                <Tooltip title={r.media_url}>
                  <span className="inline-flex items-center text-white/60">
                    <TbPhoto size={14} />
                  </span>
                </Tooltip>
              )}
            </div>
          )
        },
        onCell: () => ({ style: { minWidth: 220 } }),
      },
      {
        title: 'ควบคุม',
        key: 'controllable',
        width: 120,
        align: 'center',
        render: (_: unknown, r) =>
          r.is_controllable ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full fs-12 bg-emerald-900/40 border border-emerald-500/40 text-emerald-300">
              ควบคุมได้
            </span>
          ) : (
            <span className="text-white/40">—</span>
          ),
      },
      {
        title: 'เข้ากลุ่ม',
        key: 'is_centralized',
        width: 130,
        align: 'center',
        fixed: 'right',
        render: (_: unknown, r) => (
          <Switch
            size="small"
            checked={r.is_centralized}
            loading={centralize.isPending && centralize.variables?.wid === r.wid}
            onChange={(next) => handleToggleCentralize(r, next)}
            checkedChildren="เข้า"
            unCheckedChildren="ถอด"
            style={{
              backgroundColor: r.is_centralized
                ? 'var(--default-blue)'
                : 'rgb(220, 38, 38)',
            }}
          />
        ),
      },
    ],
    [centralize.isPending, centralize.variables, handleToggleCentralize, onOpenSignDetail]
  )

  // AntD's expandable API — only one open at a time to prevent an HLS stampede.
  const rowExpandable = useCallback(
    (r: ScreenInfoItem) => Boolean(r.desktop_screen_url || r.enixma_url),
    []
  )
  const expandedRowRender = useCallback((r: ScreenInfoItem) => {
    const url = r.desktop_screen_url || r.enixma_url || ''
    return (
      <div className="p-3 bg-black/40">
        <div className="max-w-2xl mx-auto">
          <HLSLivePlayer
            hlsUrl={url}
            figureClassName="rounded-md w-full aspect-video"
            cameraId={String(r.vms_id)}
            enableViewportPause
          />
        </div>
      </div>
    )
  }, [])

  const hasFilter = filter.level !== 'all'

  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] gap-3">
      {/* Left: bureau/state/route tree */}
      <div className="rounded-xl bg-(--dark-black) overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between gap-2">
          <div className="fs-12 font-semibold text-(--yellow)">ค้นหาตามหน่วยงาน</div>
          {hasFilter && (
            <Button
              size="small"
              type="text"
              onClick={clearFilter}
              className="text-white/60 hover:text-white!"
              style={{ fontSize: 11, height: 22, padding: '0 6px' }}
            >
              ล้างตัวกรอง
            </Button>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-1">
          {isLoading ? (
            <div className="p-3">
              <Skeleton active paragraph={{ rows: 6 }} />
            </div>
          ) : (
            <ConfigProvider
              theme={{
                components: {
                  Tree: {
                    directoryNodeSelectedBg: 'rgba(252, 209, 22, 0.15)',
                    nodeSelectedBg: 'rgba(252, 209, 22, 0.15)',
                    nodeHoverBg: 'rgba(255,255,255,0.04)',
                    colorBgContainer: 'transparent',
                  },
                },
              }}
            >
              <Tree
                treeData={treeData}
                selectedKeys={selectedKeys}
                expandedKeys={expandedKeys}
                onExpand={(keys) => setExpandedKeys(keys)}
                onSelect={handleTreeSelect}
                blockNode
                showLine={false}
                checkable={false}
                draggable={false}
                selectable
                multiple={false}
                style={{ background: 'transparent', color: 'rgba(255,255,255,0.85)' }}
              />
            </ConfigProvider>
          )}
        </div>
      </div>

      {/* Right: summary + filters + table */}
      <div className="rounded-xl bg-(--dark-black) overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap fs-12">
              <span className="px-2 py-0.5 rounded bg-white/5 text-white/80">
                รวม <b className="text-white">{summary?.total ?? rows.length}</b>
              </span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-white/80">
                ออนไลน์ <b className="text-emerald-300">{summary?.online ?? 0}</b>
              </span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-white/80">
                ควบคุมได้ <b className="text-(--yellow)">{summary?.controllable ?? 0}</b>
              </span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-white/80">
                เข้ากลุ่ม <b className="text-white">{summary?.centralized ?? 0}</b>
              </span>
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              prefix={<TbSearch size={14} className="opacity-60" />}
              placeholder="ค้น WID / ป้าย / สายทาง / สังกัด / Machine / AnyDesk"
              style={{ width: 300 }}
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
                    expandIconBg: 'transparent',
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
                pagination={false}
                scroll={{ y: 'calc(100vh - 320px)' }}
                rowClassName={(r) => (r.is_centralized ? '' : 'opacity-70')}
                locale={{ emptyText: 'ไม่มีป้ายที่ตรงกับตัวกรอง' }}
                expandable={{
                  rowExpandable,
                  expandedRowRender,
                  expandedRowKeys: expandedWid != null ? [expandedWid] : [],
                  onExpand: (open, r) => setExpandedWid(open ? r.wid : null),
                }}
              />
            </ConfigProvider>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatusTable
