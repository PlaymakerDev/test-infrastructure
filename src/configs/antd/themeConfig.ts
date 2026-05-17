import { ConfigProviderProps } from "antd";

export const theme: ConfigProviderProps = {
  theme: {
    token: {
      fontFamily: "var(--font-ibm-plex-sans-thai)",
      colorPrimary: '#FCD116',
      colorTextLightSolid: 'var(--dark-black)',
      colorTextDescription: "var(--white)",
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
        borderColor: "#333333",
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
      }
    }
  },
}