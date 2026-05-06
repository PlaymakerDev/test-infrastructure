import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import React from 'react';
import SwapButton from './SwapButton';

const meta = {
  title: 'Components/SwapButton',
  component: SwapButton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '480px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    options: {
      description: 'Array of label/value pairs rendered as toggle buttons',
      control: 'object',
    },
    defaultActive: {
      control: 'text',
      description: 'Value of the button that is active on first render',
    },
    setLabelValue: {
      description: 'Callback fired with the selected value whenever the active button changes',
    },
  },
  args: {
    setLabelValue: fn(),
  },
} satisfies Meta<typeof SwapButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Two options with no pre-selected value — all buttons render in ghost (outline) style.
 */
export const Default: Story = {
  args: {
    options: [
      { label: 'Day', value: 'day' },
      { label: 'Night', value: 'night' },
    ],
  },
};

/**
 * One button is active on mount via `defaultActive`.
 * The active button uses the primary (filled) style; the rest are ghost.
 */
export const WithDefaultActive: Story = {
  name: 'With Default Active',
  args: {
    options: [
      { label: 'Overview', value: 'overview' },
      { label: 'Details', value: 'details' },
      { label: 'History', value: 'history' },
    ],
    defaultActive: 'overview',
  },
};

/**
 * Single option — acts as a lone toggle button.
 */
export const SingleOption: Story = {
  name: 'Single Option',
  args: {
    options: [{ label: 'Confirm', value: 'confirm' }],
    defaultActive: 'confirm',
  },
};

/**
 * Many options that exceed the container width — the row scrolls horizontally
 * because the container has `overflow-x-auto`.
 */
export const Overflow: Story = {
  name: 'Many Options (Horizontal Scroll)',
  args: {
    options: [
      { label: 'Mon', value: 'mon' },
      { label: 'Tue', value: 'tue' },
      { label: 'Wed', value: 'wed' },
      { label: 'Thu', value: 'thu' },
      { label: 'Fri', value: 'fri' },
      { label: 'Sat', value: 'sat' },
      { label: 'Sun', value: 'sun' },
    ],
    defaultActive: 'mon',
  },
};
