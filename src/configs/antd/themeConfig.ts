import { ConfigProviderProps } from "antd";

export const theme: ConfigProviderProps = {
  theme: {
    token: {
      fontFamily: "var(--font-ibm-plex-sans-thai)",
      colorPrimary: '#FCD116',
      colorText: "#FFFFFF",
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
        optionSelectedBg: "#FCD11620",
        optionSelectedColor: "var(--yellow)",
        optionActiveBg: "#2A2A2A",
        colorTextDisabled: "#FFFFFF30",
      },
      Modal: {
        contentBg: "var(--dark-black)",
        headerBg: "var(--dark-black)",
        footerBg: "var(--dark-black)",
        titleColor: "#FFFFFF",
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
      }
    }
  },
}