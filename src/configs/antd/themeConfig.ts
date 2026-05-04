import { ConfigProviderProps } from "antd";

export const theme: ConfigProviderProps = {
  theme: {

    token: {
      fontFamily: "var(--font-ibm-plex-sans-thai)",
      colorPrimary: '#FCD116',
      colorTextLightSolid: 'var(--dark-black)',
    },
    components: {
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
        // WHEN HOVER
        colorIconHover: "var(--white)",
        hoverBorderColor: "var(--white)",
        // WHEN ACTIVE
        activeBorderColor: "var(--yellow)",
      },
    }
  },
}