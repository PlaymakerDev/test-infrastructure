import { ConfigProviderProps } from "antd";

export const theme: ConfigProviderProps = {
  theme: {
    token: {
      fontFamily: "var(--font-ibm-plex-sans-thai)",
    },
    components: {
      Drawer: {
        colorBgElevated: "var(--dark-black)",
        colorText: "var(--white)",
        colorSplit: "var(--white)",
      },
    }
  },
}