"use client"
import menu from "@/configs/menu"
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TbMenu2,
  TbZoomInArea,
  TbZoomReset,
  TbLayoutSidebarLeftCollapse,
  TbLayoutSidebarRightCollapse,
  TbSearch,
  TbBellRinging2,
  TbGripHorizontal,
  TbDots,
  // ICON
  TbForms,
  TbBrandDatabricks,
  TbApps,
  TbLayoutDashboard,
  TbHome,
  TbVideo,
  TbCar,
  TbTruckDelivery,
  TbTrafficLights,
  TbWalk,
  TbLamp,
  TbDeviceDesktop,
  TbBuildingBridge,
  TbBuildingBridge2,
  TbTopologyStar3,
  TbAdjustmentsHorizontal,
  TbBrandGithubCopilot,
  TbCarCrash,
  TbChartColumn,
  TbShieldHalf,
  TbSettings,
  TbCurrentLocation,
  TbLock,
  TbLockOpen,
  TbLogout,
} from "react-icons/tb";
import { FaRegLightbulb } from "react-icons/fa6";
/* SEY DEFAULT YEAR FORMAT */
import dayjs from 'dayjs';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import th from 'dayjs/locale/th';
import { useAppDispatch } from "@/stores/hooks";
import { setDrawerOpen } from "@/stores/reducers/layout/layoutSlice";
import { resetAuthTokenState, resetAuthInfoState } from "@/stores/reducers/auth/authSlice";
import useMapFocusMode from "@/utils/hooks/useMapFocusMode";
import { useHomeDeptId, deptQuery, useNotificationFeedBadges } from "@/hooks/queries/manage";
import { useUserRole } from "@/hooks/useUserRole";
import { useHydrated } from "@/hooks/useHydrated";
import IconTracking from "@/components/icon/IconTracking";
import IconLPR from "@/components/icon/IconLPR";
import IconAIChat from "@/components/icon/IconAIChat";
import { Button, Dropdown, MenuProps, Modal } from "antd";
import { AnimatePresence, motion } from "motion/react";
import axios, { AxiosError } from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSidebarAPI } from "@/services/routes/LayoutService";
import FindOnPageOverlay from "./FindOnPageOverlay";
import NotificationBell from "@/components/notifications/NotificationBell";

// Feature systems — link to their overall page scoped to the logged-in user's
// own department (?dept_id=สำนัก/แขวง). The remaining management menus
// (tracking, control-vms, statistic, maintenance) navigate plainly for now.
const DEPT_SCOPED_KEYS = new Set([
  "dashboard",
  "cctv",
  "traffic_signal",
  "incident_detection",
  "crosswalk",
  "traffic_volume",
  "traffic_lighting",
  "vms",
  "bridge_lighting",
  "tunnel",
  "lpr",
]);

// Map menu label_key to the corresponding solution name returned by Sidebar API.
// Dashboard is always available. Menu entries not listed here remain unchanged.
const SOLUTION_KEY_BY_MENU_LABEL_KEY: Record<string, string> = {
  cctv: "CCTV",
  traffic_volume: "Traffic Volume",
  incident_detection: "Incident Detection",
  traffic_signal: "Traffic Signal",
  crosswalk: "Crosswalk",
  traffic_lighting: "Traffic Lighting",
  vms: "VMS",
  bridge_lighting: "Bridge Lighting",
  tunnel: "Tunnel",
  tracking: "Tracking",
  lpr: "LPR",
  control_vms: "Control VMS",
  statistic: "Statistic",
  maintenance: "Maintenance",
};

// Known solution_type_id values returned by Sidebar API.
const SOLUTION_KEY_BY_TYPE_ID: Record<number, string> = {
  1: "CCTV",
  2: "Traffic Volume",
  3: "Incident Detection",
  4: "Traffic Signal",
  5: "Crosswalk",
  6: "Traffic Lighting",
  7: "VMS",
  8: "Tunnel",
  9: "Tracking",
  10: "Bridge Lighting",
  11: "LPR",
};

// Normalize names so small differences in spaces/capitalization do not
// prevent a solution from matching a menu entry.
const normalizeSolutionKey = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");

// Overall pages where the focus-mode picker collapses to a single click:
// instead of opening the left/right/both dropdown, clicking the button just
// toggles "ซ่อนทั้งสองฝั่ง" (off ↔ both) directly (requested 2026-07-24).
const DIRECT_FOCUS_TOGGLE_ROUTES = new Set([
  "/admin/crosswalk",
  "/admin/cctv",
  "/admin/traffic-volume",
  "/admin/incident-detection",
  "/admin/traffic-signal",
  "/admin/vms",
  "/admin/bridge-lighting",
  "/admin/tunnel",
  "/admin/lpr",
  "/admin/tracking",
  // Traffic Lighting joined 2026-08-10 — its two rails are one visual unit
  // (device summary + diagram on the left, stat cards on the right), so the
  // per-side options were never useful there; one click = ซ่อนทั้งสองฝั่ง,
  // same as traffic-volume overall.
  "/admin/traffic-lighting",
]);

/* VARIABLE */
dayjs.extend(buddhistEra);
dayjs().format("BBBB BB");
dayjs.locale(th);

const ICON_LIST: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  TbForms,
  TbBrandDatabricks,
  // ADMIN
  TbLayoutDashboard,
  TbVideo,
  TbCar,
  TbCarCrash,
  TbTruckDelivery,
  TbTrafficLights,
  TbWalk,
  FaRegLightbulb,
  TbLamp,
  TbDeviceDesktop,
  TbBuildingBridge,
  TbBuildingBridge2,
  TbCurrentLocation,
  TbTopologyStar3,
  TbAdjustmentsHorizontal,
  TbChartColumn,
  TbShieldHalf,
  TbSettings,
  TbBrandGithubCopilot,
};

// The LPR scan-frame glyph (design's text.svg) lives in
// @/components/icon/IconLPR — shared with the map pills/markers so the
// trapezoid menu and every LPR marker use the same glyph 1:1 (same contract
// as IconTracking for the tracking menu).

/** Breathing yellow glow used by every right-cluster toolbar icon while its
 *  feature is active — extracted from the find-on-page button so all five
 *  buttons (map-focus / find / smart-search / bell / more-menu) light up the
 *  same way. */
const IconGlow: React.FC<{
  active: boolean;
  children: React.ReactNode;
}> = ({ active, children }) => (
  <motion.span
    className="flex"
    animate={
      active
        ? {
          filter: [
            "drop-shadow(0 0 2px rgba(252,209,22,0.7))",
            "drop-shadow(0 0 8px rgba(252,209,22,1))",
            "drop-shadow(0 0 2px rgba(252,209,22,0.7))",
          ],
        }
        : { filter: "drop-shadow(0 0 0 rgba(0,0,0,0))" }
    }
    transition={
      active
        ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
        : { duration: 0.2 }
    }
  >
    {children}
  </motion.span>
);

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const iconClassName = "fs-24 cursor-pointer";
  const dispatch = useAppDispatch();

  // STATE
  const [currentTime, setCurrentTime] = useState(dayjs().format("HH:mm:ss"));
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Lock the trapezoid open — the lock icon at the end toggles this. When
  // locked the menu ignores hover and stays visible. Persists while navigating
  // (layout doesn't remount); resets on a full page reload.
  const [locked, setLocked] = useState(false);

  // Post-login intro — the trapezoid shows for 5s when the admin shell first
  // mounts (login redirect / hard reload) so users learn the menu exists,
  // then slowly fades back to hover mode; the peek nub below stays the
  // permanent hint. Client-side navigation never remounts this, so the intro
  // plays once per entry into /admin, not on every page change.
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Find-on-page overlay (Ctrl+F clone). Owned here because the trigger
  // buttons live in this nav — the overlay itself renders as a portal-like
  // fixed element that visually attaches under the navbar.
  const [findOpen, setFindOpen] = useState(false);

  // Right-cluster popouts are mutually exclusive — the find overlay, the
  // bell panel, the focus-mode menu and the "..." menu can never be open at
  // the same time. Each opener calls closeOtherPopouts with its own key.
  const [extraOpen, setExtraOpen] = useState(false);
  const [focusMenuOpen, setFocusMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  // Same query keys the bell itself uses, so this is the same cached poll —
  // it only exists here to badge the mobile "..." entry.
  const {
    caseCount: bellCaseCount,
    outageCount: bellOutageCount,
  } = useNotificationFeedBadges();

  const closeOtherPopouts = useCallback(
    (keep: "find" | "bell" | "focus" | "extra") => {
      if (keep !== "find") setFindOpen(false);
      if (keep !== "bell") setBellOpen(false);
      if (keep !== "focus") setFocusMenuOpen(false);
      if (keep !== "extra") setExtraOpen(false);
    },
    []
  );

  // Mobile (< lg) replacement for the hover trapezoid: a single trapezoid tab
  // at top-center that pops a grid of the same nav entries. Closes on backdrop
  // tap, tapping the tab again — and on ANY navigation (path or query) without
  // an effect: open state stores the URL it was opened at, so a route/query
  // change derives it closed on the next render.
  const [mobileNavOpenAt, setMobileNavOpenAt] = useState<string | null>(null);

  // Department of the logged-in user — appended to the owned menus' links.
  const homeDeptId = useHomeDeptId();

  // Global "focus the map" toggle — hides every card/panel on overall pages
  // that host a map. Bound to the TbZoomInArea button below.
  // `focusAvailable` comes from live consumer registration (MapFocusGrid /
  // MapOverlayPanel / direct consumers report their mount), so the toggle
  // grays out whenever NOTHING currently on screen would respond — including
  // detail TABS without a map (e.g. incident-detection's รายงานเหตุการณ์),
  // which a route list could never express.
  const {
    mode: liveFocusMode,
    isMapFocus: liveIsMapFocus,
    focusAvailable: liveFocusAvailable,
    setMapFocus,
    setMode: setMapFocusMode,
    toggle: toggleMapFocus,
  } = useMapFocusMode();

  // This Navbar hydrates inside a Suspense boundary, so a page's own mount
  // effects (dashboard turns focus ON, MapFocusGrid registers consumers) can
  // land BEFORE it. Render the server's values for the hydration pass, then
  // the live ones — otherwise React sees markup the SSR HTML never had.
  const hydrated = useHydrated();
  const mapFocusMode = hydrated ? liveFocusMode : "off";
  const isMapFocus = hydrated && liveIsMapFocus;
  const focusAvailable = hydrated && liveFocusAvailable;

  // On the listed overall pages the picker becomes a plain click-to-toggle
  // (off ↔ both) — no dropdown, per 2026-07-24 request.
  const directFocusToggle =
    focusAvailable && DIRECT_FOCUS_TOGGLE_ROUTES.has(pathname);

  // ระบบและการตั้งค่า is dropped for a general `user`: every tab on that page
  // is admin-only (`/manage/roads` write, `/manage/contractor`,
  // `/manage/general_user`) and `/manage/project` doesn't admit role `user`
  // either — see `features/admin/settings/overall/data/tabs.ts`. Their menu is
  // just ออกจากระบบ. `isUser` only turns true once the role has resolved, so an
  // admin's entry never blinks out from under them.
  const { isUser } = useUserRole();
  const canOpenSettings = !isUser;

  // MODAL
  const [modal, contextHolder] = Modal.useModal();

  // QUERY CLIENT
  const queryClient = useQueryClient();

  // Sidebar API — use the same query key as the Sidebar component so React
  // Query can share the cached response. This query runs even when the drawer
  // is closed because the navbar needs the solution list to enable/disable
  // its menu entries.
  const {
    data: sidebarResponse,
    isLoading: isSidebarLoading,
    isError: isSidebarError,
  } = useQuery({
    queryKey: ["sidebar_data"],
    queryFn: getSidebarAPI,
  });

  // Build a set of solutions available in the Sidebar API.
  // The response data shape is:
  // department -> sub_department -> solutions.
  const availableSolutionKeys = useMemo(() => {
    const departments = sidebarResponse?.data ?? [];

    const keys = departments.flatMap((department) =>
      (department.sub_department ?? []).flatMap((subDepartment) =>
        (subDepartment.solutions ?? []).map((solution) => {
          const keyById =
            solution.solution_type_id != null
              ? SOLUTION_KEY_BY_TYPE_ID[solution.solution_type_id]
              : undefined;

          return normalizeSolutionKey(
            keyById ?? solution.solution_type_name
          );
        })
      )
    );

    return new Set(keys.filter(Boolean));
  }, [sidebarResponse]);

  // Return true if a menu entry should be usable.
  // Dashboard and menus not mapped to a solution are left unchanged.
  // If the API is still loading or has failed, do not disable menus based on
  // incomplete data.
  const isSolutionMenuAvailable = useCallback(
    (labelKey: string) => {
      const alwaysEnabled = new Set([
        "control_vms",
        "statistic",
        "maintenance",
      ]);

      if (alwaysEnabled.has(labelKey)) return true;
      if (labelKey === "dashboard") return true;

      const solutionKey = SOLUTION_KEY_BY_MENU_LABEL_KEY[labelKey];

      if (!solutionKey) return true;

      if (isSidebarLoading || isSidebarError) return true;

      return availableSolutionKeys.has(normalizeSolutionKey(solutionKey));
    },
    [availableSolutionKeys, isSidebarLoading, isSidebarError]
  );

  // Reset focus mode on ANY navigation — path OR query (e.g. picking another
  // แขวง from the sidebar keeps the same pathname but swaps ?dept_id). Without
  // the query dep the user lands on the new department with every card still
  // hidden and only the small yellow icon hinting why.
  // Skips the very first run: on initial mount the store already starts with
  // focus OFF, so resetting is a no-op — and because this Navbar mounts inside
  // a Suspense boundary it could otherwise land AFTER a page's own mount
  // effect and clobber an intentional landing state (dashboard's map-only
  // intro turns focus ON on mount and relies on winning the landing frame).
  const searchKey = searchParams.toString();
  const focusResetFirstRunRef = useRef(true);

  useEffect(() => {
    if (focusResetFirstRunRef.current) {
      focusResetFirstRunRef.current = false;
      return;
    }
    setMapFocus(false);
  }, [pathname, searchKey, setMapFocus]);

  // Derived: the popup is open only while still on the URL it was opened at.
  const mobileNavKey = `${pathname}?${searchKey}`;
  const mobileNavOpen = mobileNavOpenAt === mobileNavKey;

  // Mobile "..." utilities popup — same URL-keyed open state + same grid panel
  // styling as the system-menu popup above, holding what the desktop right-icon
  // row offers (map focus / find / smart search / notifications / settings /
  // logout) with labels, replacing the old 3-icon label-less dropdown.
  const [mobileMoreOpenAt, setMobileMoreOpenAt] = useState<string | null>(null);
  const mobileMoreOpen = mobileMoreOpenAt === mobileNavKey;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().format("HH:mm:ss"));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Global Ctrl+F / Cmd+F — hijack the browser's native find-in-page and
  // route it to our in-app overlay instead. Users who explicitly want the
  // browser's search can still use it via the menu or Ctrl+G on Firefox.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        !e.altKey &&
        e.key.toLowerCase() === "f"
      ) {
        e.preventDefault();
        closeOtherPopouts("find");
        setFindOpen(true);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeOtherPopouts]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const performLogout = useCallback(async () => {
    try {
      const response = await axios.post(
        `${process.env.__NEXT_ROUTER_BASEPATH ?? ""}/api/auth/logout`,
        {}
      );

      if (response.status === 200) {
        // Drop this user's cached (token-scoped) data so the next login starts clean.
        queryClient.clear();
        dispatch(resetAuthTokenState());
        dispatch(resetAuthInfoState());

        modal.success({
          title: "คุณได้ออกจากระบบเรียบร้อยแล้ว",
          onOk: () => router.push("/auth/login"),
          onCancel: () => Modal.destroyAll(),
        });
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        modal.error({
          title: "Logout failed",
          content: error.response?.data?.res_data?.message,
          onOk: () => Modal.destroyAll(),
          onCancel: () => Modal.destroyAll(),
        });
      }
    }
  }, [modal, router, queryClient, dispatch]);

  // Confirm before logging out — "ออกจากระบบ" (OK) proceeds, "ยกเลิก" (Cancel)
  // keeps the session. Both the desktop dropdown and the mobile grid call this.
  const onLogout = useCallback(() => {
    modal.confirm({
      title: "ต้องการออกจากระบบใช่หรือไม่?",
      content: "หากออกจากระบบ คุณจะต้องเข้าสู่ระบบใหม่อีกครั้ง",
      okText: "ออกจากระบบ",
      cancelText: "ยกเลิก",
      onOk: performLogout,
    });
  }, [modal, performLogout]);

  // Entries for the mobile "..." grid panel — everything the desktop
  // right-icon row offers, now with visible labels (the old label-less
  // 3-icon dropdown hid what each glyph meant and was missing Smart Search /
  // settings / logout entirely).
  const moreEntries = [
    {
      key: "map-focus",
      label: isMapFocus ? "ปิดเน้นแผนที่" : "เน้นแผนที่",
      icon: isMapFocus
        ? <TbZoomReset size={22} />
        : <TbZoomInArea size={22} />,
      disabled: !focusAvailable,
      active: isMapFocus,
      title: !focusAvailable ? "หน้านี้ไม่มีแผนที่ให้เน้น" : undefined,
      // Close the panel so the focus result is immediately visible — keeping
      // it open left the backdrop over a layout that just changed underneath.
      onClick: () => {
        setMobileMoreOpenAt(null);
        toggleMapFocus();
      },
    },
    {
      key: "find",
      label: "ค้นหาในหน้า",
      icon: <TbSearch size={22} />,
      active: findOpen,
      onClick: () => {
        setMobileMoreOpenAt(null);
        closeOtherPopouts("find");
        setFindOpen(true);
      },
    },
    {
      key: "smart-search",
      label: "Smart Search",
      icon: <IconAIChat size={22} />,
      active: !!pathname?.startsWith("/admin/smart-search"),
      onClick: () => {
        setMobileMoreOpenAt(null);
        router.push("/admin/smart-search");
      },
    },
    {
      key: "notifications",
      label: "แจ้งเตือน",
      // The bell's own trigger lives in .nav-side-menu, which layout.css
      // hides under 900px — this entry IS the trigger on mobile, so it
      // carries the counts too, split the same way as the desktop bell:
      // cases (yellow) above dead cameras (red).
      icon: (
        <span className="relative inline-flex">
          <TbBellRinging2 size={22} />
          {(bellCaseCount > 0 || bellOutageCount > 0) && (
            <span className="absolute -top-1.5 left-full -translate-x-2 flex flex-col items-start gap-0.5 pointer-events-none">
              {[
                {
                  key: "case",
                  n: bellCaseCount,
                  bg: "var(--yellow)",
                  fg: "#191919",
                },
                {
                  key: "outage",
                  n: bellOutageCount,
                  bg: "#ff4d4f",
                  fg: "#fff",
                },
              ]
                .filter((c) => c.n > 0)
                .map((c) => (
                  <span
                    key={c.key}
                    className="flex items-center justify-center rounded-full font-bold"
                    style={{
                      background: c.bg,
                      color: c.fg,
                      lineHeight: 1,
                      fontSize: 10,
                      height: 15,
                      minWidth: 15,
                      padding: "2px 4px 0",
                      boxShadow: "0 0 0 1.5px #191919",
                    }}
                  >
                    {c.n > 99 ? "99+" : c.n}
                  </span>
                ))}
            </span>
          )}
        </span>
      ),
      active: bellOpen,
      onClick: () => {
        setMobileMoreOpenAt(null);
        closeOtherPopouts("bell");
        setBellOpen(true);
      },
    },
    ...(canOpenSettings
      ? [
        {
          key: "settings",
          label: "ระบบและการตั้งค่า",
          icon: <TbSettings size={22} />,
          active: !!pathname?.startsWith("/admin/settings"),
          onClick: () => {
            setMobileMoreOpenAt(null);
            router.push("/admin/settings");
          },
        },
      ]
      : []),
    {
      key: "logout",
      label: "ออกจากระบบ",
      icon: <TbLogout size={22} />,
      active: false,
      onClick: () => {
        setMobileMoreOpenAt(null);
        onLogout();
      },
    },
  ];

  const extraItems: MenuProps["items"] = [
    ...(canOpenSettings
      ? [
        {
          key: "1",
          label: "ระบบและการตั้งค่า",
          icon: <TbSettings size={24} />,
          onClick: () => router.push("/admin/settings"),
        },
      ]
      : []),
    {
      key: "2",
      label: "ออกจากระบบ",
      icon: <TbLogout size={24} />,
      onClick: () => onLogout(),
    },
  ];

  // Fallback to a location icon for menu items without one (e.g. Tracking,
  // whose icon is empty in the shared admin menu — left untouched here).
  const Icon = useCallback(
    (iconName: string, props: { size?: number; className?: string }) => {
      const IconComponent = ICON_LIST[iconName] ?? TbCurrentLocation;
      return <IconComponent {...props} />;
    },
    []
  );

  // Trapezoid = shared admin menu minus Settings/Smart Search.
  const navItems = useMemo(
    () =>
      menu["ADMIN"].filter(
        (m) => m.label_key !== "settings" && m.label_key !== "smart_search"
      ),
    []
  );

  // Enriched entries shared by the desktop trapezoid AND the mobile popup
  // grid, so both always agree on icon overrides, active state, hrefs and
  // whether a solution exists in the Sidebar API.
  const navEntries = useMemo(
    () =>
      navItems.map((item) => {
        const OverrideIcon =
          item.label_key === "dashboard"
            ? TbHome
            : item.label_key === "tracking"
              ? IconTracking
              : item.label_key === "lpr"
                ? IconLPR
                : undefined;

        const href = DEPT_SCOPED_KEYS.has(item.label_key)
          ? `${item.path}?${deptQuery(homeDeptId)}`
          : item.path;

        // Active on the overall page AND every subpage (detail/[id], tabs…).
        const active =
          pathname === item.path_active ||
          !!pathname?.startsWith(item.path_active + "/");

        const disabled = !isSolutionMenuAvailable(item.label_key);

        return {
          ...item,
          OverrideIcon,
          href,
          active,
          disabled,
        };
      }),
    [navItems, pathname, homeDeptId, isSolutionMenuAvailable]
  );

  const renderTrapezoidNav = useMemo(() => {
    return navEntries.map((item) => {
      const { OverrideIcon, active, disabled } = item;

      return (
        <button
          key={item.key}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            router.push(item.href);
          }}
          aria-label={item.title}
          aria-disabled={disabled}
          title={disabled ? `${item.title} (ไม่มี Solution ในระบบ)` : item.title}
          className={`group relative flex flex-col items-center justify-center gap-0.5 px-1.5 lg:px-2 h-full transition-colors duration-300 shrink-0 ${disabled
            ? "cursor-not-allowed text-gray-500 opacity-40"
            : active
              ? "cursor-pointer text-(--yellow)"
              : "cursor-pointer text-white/70 hover:text-[#FFE97A]"
            }`}
        >
          <span className="transition-colors duration-300">
            {OverrideIcon
              ? <OverrideIcon size={24} />
              : Icon(item.icon, { size: 24 })}
          </span>

          <span
            className={`hidden lg:block overflow-hidden fs-12 font-medium whitespace-nowrap transition-[max-width,opacity] duration-300 ease-out ${disabled
              ? "max-w-0 opacity-0 group-hover:max-w-36 group-hover:opacity-100 text-gray-500"
              : active
                ? "max-w-36 opacity-100 text-(--yellow)"
                : "max-w-0 opacity-0 group-hover:max-w-36 group-hover:opacity-100 text-[#FFE97A]"
              }`}
          >
            {item.label}
          </span>
        </button>
      );
    });
  }, [navEntries, router, Icon]);

  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
      <div className="nav-container">
        <div className="nav-main-menu">
          <TbMenu2
            className={`${iconClassName}`}
            onClick={() => dispatch(setDrawerOpen({ open: true }))}
          />
          <div>
            <p className="fs-12" suppressHydrationWarning>
              {currentTime}
            </p>
            <p className="fs-12" suppressHydrationWarning>
              {dayjs().format("DD MMMM BBBB")}
            </p>
          </div>
        </div>

        {/* CENTER — trapezoid nav */}
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 z-20 hidden lg:block"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Peek nub */}
          <div
            aria-hidden
            className={`absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center transition-opacity duration-500 ${hovered || locked || intro ? "opacity-0" : "opacity-100"
              }`}
            style={{
              width: 76,
              height: 14,
              background: "#00000023",
              borderInline: "1px solid rgba(252,209,22,0.35)",
              borderBottom: "1px solid rgba(252,209,22,0.35)",
              borderRadius: "0 0 10px 10px",
              boxShadow: "0 2px 10px rgba(252,209,22,0.35)",
              pointerEvents: "none",
            }}
          >
            <TbGripHorizontal size={12} className="text-(--yellow)" />
          </div>

          <div
            className={`relative flex items-center justify-center gap-0.5 lg:gap-1 px-8 lg:px-10 transition-all duration-500 ${hovered || locked || intro
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2"
              }`}
            style={{ height: 72, width: "fit-content", maxWidth: "90vw" }}
          >
            {/* Background shape — trapezoid */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 810 60"
              preserveAspectRatio="none"
              style={{
                filter: "drop-shadow(0px 2px 15px rgba(252, 209, 22, 0.6))",
              }}
            >
              <path
                d="M0,0 L810,0 L790,52.5 Q787,60 780,60 L30,60 Q23,60 20,52.5 L0,0Z"
                fill="#000000E6"
                stroke="rgba(252,209,22,0.3)"
                strokeWidth="1"
              />
            </svg>

            {renderTrapezoidNav}

            {/* Lock toggle */}
            <motion.button
              type="button"
              onClick={() => setLocked((v) => !v)}
              title={locked ? "ปลดล็อก (ซ่อนเมนูอัตโนมัติ)" : "ล็อกเมนูให้แสดงตลอด"}
              aria-pressed={locked}
              aria-label={locked ? "ปลดล็อกเมนู" : "ล็อกเมนู"}
              className={`group relative flex flex-col items-center justify-center gap-0.5 px-1.5 lg:px-2 h-full transition-colors duration-300 shrink-0 cursor-pointer ${locked
                ? "text-(--yellow)"
                : "text-white/70 hover:text-[#FFE97A]"
                }`}
              whileTap={{ scale: 0.9 }}
            >
              <motion.span
                key={locked ? "locked" : "unlocked"}
                className="flex transition-colors duration-300"
                initial={{ rotate: -35, scale: 0.5, opacity: 0 }}
                animate={
                  locked
                    ? {
                      rotate: 0,
                      scale: 1,
                      opacity: 1,
                      filter: [
                        "drop-shadow(0 0 2px rgba(252,209,22,0.7))",
                        "drop-shadow(0 0 7px rgba(252,209,22,1))",
                        "drop-shadow(0 0 2px rgba(252,209,22,0.7))",
                      ],
                    }
                    : {
                      rotate: 0,
                      scale: 1,
                      opacity: 1,
                      filter: "drop-shadow(0 0 0 rgba(0,0,0,0))",
                    }
                }
                transition={{
                  rotate: { type: "spring", stiffness: 420, damping: 18 },
                  scale: { type: "spring", stiffness: 420, damping: 18 },
                  opacity: { duration: 0.2 },
                  ...(locked
                    ? {
                      filter: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }
                    : {}),
                }}
              >
                {locked ? <TbLock size={24} /> : <TbLockOpen size={24} />}
              </motion.span>

              <span
                className={`hidden lg:block overflow-hidden fs-12 font-medium whitespace-nowrap transition-[max-width,opacity] duration-300 ease-out ${locked
                  ? "max-w-36 opacity-100 text-(--yellow)"
                  : "max-w-0 opacity-0 group-hover:max-w-36 group-hover:opacity-100 text-[#FFE97A]"
                  }`}
              >
                {locked ? "ปลดล็อก" : "ล็อกเมนู"}
              </span>
            </motion.button>
          </div>
        </div>

        {/* MOBILE (< lg) system-menu popup */}
        <div className="lg:hidden">
          <AnimatePresence>
            {mobileNavOpen && (
              <motion.div
                key="mobile-nav-backdrop"
                className="fixed inset-0 z-10"
                style={{ background: "rgba(0, 0, 0, 0.45)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setMobileNavOpenAt(null)}
              />
            )}

            {mobileNavOpen && (
              <motion.div
                key="mobile-nav-panel"
                className="absolute left-1/2 z-20 rounded-2xl overflow-hidden"
                style={{
                  top: "calc(100% + 10px)",
                  width: "min(92vw, 400px)",
                  background: "#000000E6",
                  border: "1px solid rgba(252,209,22,0.3)",
                  boxShadow: "0px 2px 15px rgba(252, 209, 22, 0.45)",
                }}
                initial={{ opacity: 0, y: -12, scale: 0.96, x: "-50%" }}
                animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                exit={{ opacity: 0, y: -12, scale: 0.96, x: "-50%" }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <div className="grid grid-cols-3 py-1">
                  {navEntries.map((item) => {
                    const { OverrideIcon, active, disabled } = item;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (disabled) return;

                          setMobileNavOpenAt(null);
                          router.push(item.href);
                        }}
                        aria-disabled={disabled}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 transition-colors ${disabled
                          ? "cursor-not-allowed text-gray-500 opacity-40"
                          : active
                            ? "cursor-pointer text-(--yellow)"
                            : "cursor-pointer text-white/75 active:text-white"
                          }`}
                        title={
                          disabled
                            ? `${item.title} (ไม่มี Solution ในระบบ)`
                            : item.title
                        }
                      >
                        <span>
                          {OverrideIcon
                            ? <OverrideIcon size={22} />
                            : Icon(item.icon, { size: 22 })}
                        </span>
                        <span
                          className={`fs-12 leading-tight text-center ${active && !disabled ? "font-semibold" : ""
                            }`}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* "..." utilities popup */}
            {mobileMoreOpen && (
              <motion.div
                key="mobile-more-backdrop"
                className="fixed inset-0 z-10"
                style={{ background: "rgba(0, 0, 0, 0.45)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setMobileMoreOpenAt(null)}
              />
            )}

            {mobileMoreOpen && (
              <motion.div
                key="mobile-more-panel"
                className="absolute left-1/2 z-20 rounded-2xl overflow-hidden"
                style={{
                  top: "calc(100% + 10px)",
                  width: "min(92vw, 400px)",
                  background: "#000000E6",
                  border: "1px solid rgba(252,209,22,0.3)",
                  boxShadow: "0px 2px 15px rgba(252, 209, 22, 0.45)",
                }}
                initial={{ opacity: 0, y: -12, scale: 0.96, x: "-50%" }}
                animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                exit={{ opacity: 0, y: -12, scale: 0.96, x: "-50%" }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <div className="grid grid-cols-3 py-1">
                  {moreEntries.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      disabled={item.disabled}
                      onClick={item.disabled ? undefined : item.onClick}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 transition-colors ${item.disabled
                        ? "opacity-40 cursor-not-allowed text-white/75"
                        : item.active
                          ? "text-(--yellow) cursor-pointer"
                          : "text-white/75 active:text-white cursor-pointer"
                        }`}
                      title={item.title}
                    >
                      <span>{item.icon}</span>
                      <span
                        className={`fs-12 leading-tight text-center ${item.active ? "font-semibold" : ""
                          }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="nav-side-menu">
          {/* Focus-mode picker */}
          <Dropdown
            trigger={focusAvailable && !directFocusToggle ? ["click"] : []}
            disabled={!focusAvailable || directFocusToggle}
            menu={{
              selectedKeys: [mapFocusMode],
              items: [
                {
                  key: "off",
                  label: "แสดงทั้งหมด",
                  icon: <TbZoomReset size={16} />,
                },
                ...(pathname === "/admin/tracking"
                  ? []
                  : [
                    {
                      key: "left",
                      label: "ซ่อนแผงฝั่งซ้าย",
                      icon: <TbLayoutSidebarLeftCollapse size={16} />,
                    },
                    {
                      key: "right",
                      label: "ซ่อนแผงฝั่งขวา",
                      icon: <TbLayoutSidebarRightCollapse size={16} />,
                    },
                  ]),
                {
                  key: "both",
                  label: "ซ่อนทั้งสองฝั่ง",
                  icon: <TbZoomInArea size={16} />,
                },
              ],
              onClick: ({ key }) => {
                setMapFocusMode(key as "off" | "left" | "right" | "both");
                setFocusMenuOpen(false);
              },
            }}
            placement="bottomLeft"
            classNames={{ root: "nav-glow-menu" }}
            open={focusMenuOpen}
            onOpenChange={(v) => {
              setFocusMenuOpen(v);
              if (v) closeOtherPopouts("focus");
            }}
          >
            <motion.button
              type="button"
              disabled={!focusAvailable}
              onClick={directFocusToggle ? () => toggleMapFocus() : undefined}
              whileHover={focusAvailable ? { scale: 1.15 } : undefined}
              whileTap={focusAvailable ? { scale: 0.9 } : undefined}
              className={`inline-flex items-center justify-center transition-colors ${!focusAvailable
                ? "text-white/25 cursor-not-allowed"
                : isMapFocus
                  ? "text-(--yellow) cursor-pointer"
                  : "text-inherit hover:text-white cursor-pointer"
                }`}
              aria-label={
                isMapFocus ? "Exit map focus mode" : "Enter map focus mode"
              }
              aria-pressed={isMapFocus}
              aria-disabled={!focusAvailable}
              title={
                !focusAvailable
                  ? "หน้านี้ไม่มีแผนที่ให้เน้น"
                  : directFocusToggle
                    ? isMapFocus
                      ? "แสดงทั้งหมด"
                      : "ซ่อนทั้งสองฝั่ง"
                    : mapFocusMode === "left"
                      ? "ซ่อนฝั่งซ้าย — คลิกเพื่อเปลี่ยน"
                      : mapFocusMode === "right"
                        ? "ซ่อนฝั่งขวา — คลิกเพื่อเปลี่ยน"
                        : mapFocusMode === "both"
                          ? "ซ่อนทั้งสองฝั่ง — คลิกเพื่อเปลี่ยน"
                          : "เน้นแผนที่ (คลิกเพื่อเลือกฝั่งที่จะซ่อน)"
              }
            >
              <IconGlow active={focusAvailable && isMapFocus}>
                {mapFocusMode === "left" ? (
                  <TbLayoutSidebarLeftCollapse className="fs-24" />
                ) : mapFocusMode === "right" ? (
                  <TbLayoutSidebarRightCollapse className="fs-24" />
                ) : mapFocusMode === "both" ? (
                  <TbZoomReset className="fs-24" />
                ) : (
                  <TbZoomInArea className="fs-24" />
                )}
              </IconGlow>
            </motion.button>
          </Dropdown>

          {/* Find-on-page trigger */}
          <motion.button
            type="button"
            onClick={() => {
              closeOtherPopouts("find");
              setFindOpen((v) => !v);
            }}
            title="ค้นหาในหน้า (Ctrl+F)"
            className={`group relative inline-flex items-center justify-center cursor-pointer transition-colors ${findOpen
              ? "text-(--yellow)"
              : "text-inherit hover:text-white"
              }`}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            aria-label={findOpen ? "ปิดค้นหาในหน้า" : "เปิดค้นหาในหน้า"}
            aria-pressed={findOpen}
          >
            <motion.span
              className="flex"
              animate={
                findOpen
                  ? {
                    filter: [
                      "drop-shadow(0 0 2px rgba(252,209,22,0.7))",
                      "drop-shadow(0 0 8px rgba(252,209,22,1))",
                      "drop-shadow(0 0 2px rgba(252,209,22,0.7))",
                    ],
                  }
                  : { filter: "drop-shadow(0 0 0 rgba(0,0,0,0))" }
              }
              transition={
                findOpen
                  ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                  : { duration: 0.2 }
              }
            >
              <TbSearch className={iconClassName} />
            </motion.span>

            <span
              className="pointer-events-none absolute top-full mt-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded text-[10px] font-medium tabular-nums whitespace-nowrap"
              style={{
                background: "rgba(0,0,0,0.75)",
                color: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(252,209,22,0.35)",
              }}
            >
              Ctrl + F
            </span>
          </motion.button>

          {/* Smart Search */}
          <motion.button
            type="button"
            onClick={() => router.push("/admin/smart-search")}
            title="Smart Search"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className={`inline-flex items-center justify-center cursor-pointer transition-colors ${pathname?.startsWith("/admin/smart-search")
              ? "text-(--yellow)"
              : "text-inherit hover:text-white"
              }`}
            aria-label="Smart Search"
            aria-pressed={!!pathname?.startsWith("/admin/smart-search")}
          >
            <IconGlow active={!!pathname?.startsWith("/admin/smart-search")}>
              <IconAIChat className={iconClassName} />
            </IconGlow>
          </motion.button>

          <NotificationBell
            iconClassName={iconClassName}
            open={bellOpen}
            onOpenChange={(v) => {
              setBellOpen(v);
              if (v) closeOtherPopouts("bell");
            }}
          />

          <Dropdown
            menu={{ items: extraItems }}
            trigger={["click"]}
            placement="bottom"
            open={extraOpen}
            onOpenChange={(v) => {
              setExtraOpen(v);
              if (v) closeOtherPopouts("extra");
            }}
            classNames={{ root: "nav-glow-menu nav-glow-menu-right" }}
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className={`inline-flex items-center justify-center cursor-pointer transition-colors ${extraOpen
                ? "text-(--yellow)"
                : "text-inherit hover:text-white"
                }`}
              aria-label="เมนูเพิ่มเติม"
              aria-expanded={extraOpen}
            >
              <IconGlow active={extraOpen}>
                <TbGripHorizontal className={iconClassName} />
              </IconGlow>
            </motion.button>
          </Dropdown>
        </div>

        <div className="mobile-side-menu">
          {/* Inner flex wrapper */}
          <div className="flex items-center gap-4">
            {/* System-menu trigger */}
            <Button
              shape="circle"
              aria-label={mobileNavOpen ? "ปิดเมนูระบบ" : "เปิดเมนูระบบ"}
              aria-expanded={mobileNavOpen}
              onClick={() => {
                setMobileMoreOpenAt(null);
                setMobileNavOpenAt(
                  mobileNavOpen ? null : mobileNavKey
                );
              }}
              style={
                mobileNavOpen
                  ? {
                    color: "var(--yellow)",
                    borderColor: "rgba(252,209,22,0.6)",
                  }
                  : undefined
              }
              icon={<TbApps />}
            />

            {/* "..." utilities */}
            <Button
              shape="circle"
              aria-label={
                mobileMoreOpen ? "ปิดเมนูเพิ่มเติม" : "เปิดเมนูเพิ่มเติม"
              }
              aria-expanded={mobileMoreOpen}
              onClick={() => {
                setMobileNavOpenAt(null);
                setMobileMoreOpenAt(
                  mobileMoreOpen ? null : mobileNavKey
                );
              }}
              style={
                mobileMoreOpen
                  ? {
                    color: "var(--yellow)",
                    borderColor: "rgba(252,209,22,0.6)",
                  }
                  : undefined
              }
              icon={<TbDots />}
            />
          </div>
        </div>
      </div>

      <FindOnPageOverlay
        open={findOpen}
        onClose={() => setFindOpen(false)}
      />
      {contextHolder}
    </nav>
  );
}
