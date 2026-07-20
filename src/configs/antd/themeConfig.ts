import { ConfigProviderProps } from "antd";

export const theme: ConfigProviderProps = {
  theme: {
    token: {
      fontFamily: "var(--font-ibm-plex-sans-thai)",
      colorPrimary: '#FCD116',
      colorText: "#FFFFFF",
      colorTextLightSolid: 'var(--dark-black)',
      colorTextDescription: "var(--white)",
      colorTextQuaternary: "#FCD116",
    },
    components: {
      Progress: {
        remainingColor: "#333333",
      },
      Card: {
        colorBgContainer: "var(--dark-black)",
        colorText: "var(--white)",
      },
      Button: {
        defaultGhostBorderColor: '#FCD116',
        // No dark algorithm → default button is white bg + white text (invisible,
        // e.g. Modal.confirm "Cancel"). Make it a solid grey button (like the
        // danger button, neutral colour) — no yellow border/text.
        defaultBg: "#333333",
        defaultColor: "var(--white)",
        defaultBorderColor: "transparent",
        defaultHoverBg: "#404040",
        defaultHoverColor: "var(--white)",
        defaultHoverBorderColor: "transparent",
        defaultActiveBg: "#2A2A2A",
        defaultActiveColor: "var(--white)",
        defaultActiveBorderColor: "transparent",
      },
      Drawer: {
        colorBgElevated: "var(--dark-black)",
        colorText: "var(--white)",
        colorSplit: "var(--white)",
      },
      Input: {
        // DEFAULT
        colorBorder: "var(--yellow)",
        colorBgContainer: "transparent",
        colorText: "var(--white)",
        colorIcon: "var(--yellow)",
        // PLACEHOLDER
        colorTextPlaceholder: "#FFFFFF50",
        // WHEN HOVER
        colorIconHover: "var(--white)",
        hoverBorderColor: "var(--white)",
        // WHEN ACTIVE
        activeBorderColor: "var(--yellow)",
      },
      DatePicker: {
        // Input field — mirrors Input component
        colorBorder: "var(--yellow)",
        colorBgContainer: "transparent",
        colorText: "var(--white)",
        colorIcon: "var(--yellow)",
        colorTextPlaceholder: "#FFFFFF50",
        colorIconHover: "var(--white)",
        hoverBorderColor: "var(--white)",
        activeBorderColor: "var(--yellow)",
        // Dropdown panel
        colorBgElevated: "var(--dark-black)",
        colorTextHeading: "var(--white)",
        colorSplit: "#333333",
        colorTextDisabled: "#FFFFFF30",
        // Date cells
        cellHoverBg: "#2A2A2A",
        // Selected time cell (TimePicker / RangePicker time panel) and the
        // range-connector overlay (RangePicker date panel) both read the raw
        // `controlItemBgActive` alias token, which defaults to a pale
        // colorPrimaryBg tint — with no dark algorithm this renders near-white,
        // so the selected cell becomes a blank white box (white text on a
        // near-white bg). Override with a dark, yellow-tinted surface instead
        // so text stays legible while keeping the brand-color accent.
        controlItemBgActive: "#463E18",
        cellActiveWithRangeBg: "#463E18",
        cellHoverWithRangeBg: "#302B18",
      },
      Segmented: {
        trackBg: '#1A1A1A',
        trackPadding: 4,
        colorBorder: '#FCD116',
        itemColor: 'rgba(255, 255, 255, 0.55)',
        itemHoverColor: '#FFFFFF',
        itemHoverBg: 'rgba(255, 255, 255, 0.06)',
        itemSelectedColor: 'var(--dark-black)',
        itemSelectedBg: '#FCD116',
        itemActiveBg: '#FCD116',
      },
      Table: {
        colorBgContainer: "#191919",
        headerBg: "#FCD116",
        headerColor: "#000000",
        headerSplitColor: "#00000020",
        colorText: "#FFFFFF",
        // borderColor: "#333333",
        borderColor: "var(--yellow)",
        rowHoverBg: "#2A2A2A",
        bodySortBg: "#191919",
        headerSortActiveBg: "#e6bc00",
        headerSortHoverBg: "#f0cd10",
        rowSelectedBg: "#2A2A2A",
        rowSelectedHoverBg: "#333333",
        footerBg: "#191919",
        footerColor: "#FFFFFF",
        colorBorderSecondary: "#333333",
      },
      Timeline: {
        colorText: "#FFFFFF",
        tailColor: "#000000"
      },
      Radio: {
        // Circle border when unselected
        colorBorder: "#FFFFFF60",
        // Label text
        colorText: "var(--white)",
        // Dot & ring when selected (inherits colorPrimary yellow, but explicit here)
        colorPrimary: "#FCD116",
        // Hover border on unselected
        colorPrimaryHover: "var(--yellow)",
        // Button-group variant
        buttonBg: "transparent",
        buttonColor: "var(--white)",
        buttonCheckedBg: "#FCD11620",
        buttonSolidCheckedBg: "#FCD116",
        buttonSolidCheckedColor: "var(--dark-black)",
      },
      Select: {
        // Trigger field — mirrors Input
        colorBgContainer: "transparent",
        colorBorder: "var(--yellow)",
        colorText: "var(--white)",
        colorTextPlaceholder: "#FFFFFF50",
        colorIcon: "var(--yellow)",
        colorIconHover: "var(--white)",
        hoverBorderColor: "var(--white)",
        activeBorderColor: "var(--yellow)",
        // Dropdown panel
        colorBgElevated: "var(--dark-black)",
        // Selected option — dark text on solid yellow for legible contrast
        // (ticket 5). Was a pale #FCD11620 tint + yellow text = too low-contrast.
        optionSelectedBg: "#FCD116",
        optionSelectedColor: "var(--dark-black)",
        optionActiveBg: "#2A2A2A",
        colorTextDisabled: "#FFFFFF30",
      },
      Modal: {
        contentBg: "var(--dark-black)",
        headerBg: "var(--dark-black)",
        footerBg: "var(--dark-black)",
        titleColor: "#FFFFFF",
      },
      Tooltip: {
        // Global colorTextLightSolid is dark (for text on the yellow primary
        // button); Tooltip reuses it for its text → dark-on-dark = unreadable.
        // Override just the tooltip to a dark surface with light text.
        colorBgSpotlight: "#333333",
        colorTextLightSolid: "#FFFFFF",
      },
      Dropdown: {
        // No dark algorithm in this theme → popup defaults to white. Match the
        // app's dark surfaces (mirrors Select/Modal overrides above).
        colorBgElevated: "var(--dark-black)",
        colorText: "var(--white)",
        controlItemBgHover: "#2A2A2A",
      },
      Popover: {
        // Same fix as Dropdown/Menu/Notification/Message — with no dark
        // algorithm the popover pops white while the app-wide colorText is
        // white, so title + description end up invisible (Popconfirm, Tooltip,
        // Popover all inherit from here).
        colorBgElevated: "var(--dark-black)",
        colorText: "var(--white)",
        colorTextHeading: "var(--white)",
      },
      Menu: {
        colorBgElevated: "var(--dark-black)",
        popupBg: "var(--dark-black)",
        itemColor: "var(--white)",
        itemHoverColor: "var(--white)",
        itemHoverBg: "#2A2A2A",
        itemBg: "transparent",
        itemSelectedBg: "#2A2A2A",
        itemSelectedColor: "var(--yellow)",
      },
      Message: {
        // No dark algorithm → toast bg defaults to white + white text (invisible).
        contentBg: "#333333",
      },
      Notification: {
        colorBgElevated: "#333333",
      },
      Calendar: {
        // Container
        // colorBgContainer: "var(--dark-black)",
        colorBgContainer: "#363636",
        // Header (month/year selectors)
        // colorBgElevated: "var(--dark-black)",
        colorBgElevated: "#363636",
        // Text
        colorText: "#FFFFFF",
        colorTextHeading: "#FFFFFF",
        colorTextDisabled: "#FFFFFF30",
        colorTextDescription: "#FFFFFF60",
        // Selected date cell
        colorPrimary: "#FCD116",
        colorPrimaryBorder: "#FCD116",
        // Hover
        controlItemBgHover: "#2A2A2A",
        // Today highlight
        colorHighlight: "#FCD116",
        // Cell borders / splits
        colorSplit: "#333333",
      },
      Pagination: {
        itemActiveBg: "var(--yellow)",
        itemActiveColor: "var(--black)",
        itemBg: "transparent",
      },
      Tabs: {
        // No dark algorithm → default inactive tab text is too dark on this bg.
        itemColor: "rgba(255,255,255,0.55)",
        itemHoverColor: "#FFFFFF",
        itemActiveColor: "var(--yellow)",
        itemSelectedColor: "var(--yellow)",
        inkBarColor: "var(--yellow)",
      }
    }
  },
}