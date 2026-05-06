import type { Preview } from '@storybook/nextjs-vite';
import React from 'react';
import { ConfigProvider } from 'antd';
import { theme } from '../src/configs/antd/themeConfig';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  decorators: [
    (Story) =>
      React.createElement(
        ConfigProvider,
        { theme: theme.theme },
        React.createElement(Story)
      ),
  ],
};

export default preview;
