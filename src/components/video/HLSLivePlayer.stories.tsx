import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import React from 'react';
import HLSLivePlayer from './HLSLivePlayer';

const meta = {
  title: 'Components/Video/HLSLivePlayer',
  component: HLSLivePlayer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '640px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    hlsUrl: {
      control: 'text',
      description: 'Stream URL — automatically uses hls.js for `.m3u8`, native `<video>` for anything else',
    },
    cameraId: {
      control: 'text',
      description: 'Identifier used in console logs and exposed via the imperative ref handle',
    },
    muted: { control: 'boolean' },
    autoPlay: { control: 'boolean' },
    showLiveBadge: { control: 'boolean' },
    hideLiveBadgeOnMobile: { control: 'boolean' },
    enableViewportPause: {
      control: 'boolean',
      description: 'Destroy the stream and show the last captured frame when scrolled out of view',
    },
    viewportThreshold: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Fraction of the element that must be visible to count as "in viewport"',
    },
    maxRetries: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Number of reconnect attempts before entering the auto-reconnect interval',
    },
    retryDelay: {
      control: { type: 'number', min: 500, max: 10000, step: 500 },
      description: 'Milliseconds between each retry attempt',
    },
    autoReconnectInterval: {
      control: { type: 'number', min: 5000, max: 120000, step: 5000 },
      description: 'Milliseconds between smart-reconnect checks after max retries are exhausted',
    },
    figureClassName: { control: 'text' },
    videoClassName: { control: 'text' },
  },
  args: {
    figureClassName: 'w-full aspect-video',
    cameraId: 'cam-001',
    onStatusChange: fn(),
    onError: fn(),
    onVisibilityChange: fn(),
  },
} satisfies Meta<typeof HLSLivePlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * No URL provided — the component renders a black container and waits.
 * This is the initial "idle" state before a stream is assigned.
 */
export const Default: Story = {};

/**
 * Live HLS stream via hls.js. The URL ending in `.m3u8` triggers HLS mode
 * with adaptive bitrate, buffer management, and automatic error recovery.
 */
export const HLSStream: Story = {
  name: 'HLS Stream (.m3u8)',
  args: {
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    cameraId: 'cam-hls-01',
  },
};

/**
 * Non-HLS URL (MP4) — bypasses hls.js and uses the native `<video>` element directly.
 * Retry logic and status callbacks still apply.
 */
export const DirectVideo: Story = {
  name: 'Direct Video (non-HLS)',
  args: {
    hlsUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    cameraId: 'cam-direct-01',
  },
};

/**
 * The `extra` prop renders arbitrary JSX on top of the video element.
 * Useful for camera labels, timestamps, or custom overlays.
 */
export const WithExtraOverlay: Story = {
  name: 'With Extra Overlay',
  args: {
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    cameraId: 'cam-overlay-01',
    extra: (
      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
        CAM-01 | Main Entrance
      </div>
    ),
  },
};

/**
 * `enableViewportPause=false` — the stream stays initialised and plays regardless
 * of whether the element is visible in the scroll area. Useful for always-on monitors.
 */
export const ViewportPauseDisabled: Story = {
  name: 'Viewport Pause Disabled',
  args: {
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    cameraId: 'cam-always-on',
    enableViewportPause: false,
  },
};

/**
 * An invalid URL with `maxRetries=1` and a short `retryDelay` so the component
 * quickly reaches the "Connection Failed" UI with the manual retry button.
 */
export const ErrorState: Story = {
  name: 'Error / Connection Failed',
  args: {
    hlsUrl: 'https://invalid.example.local/stream.m3u8',
    cameraId: 'cam-error',
    maxRetries: 1,
    retryDelay: 500,
  },
};

/**
 * Four players in a 2×2 grid — demonstrates the viewport-pause feature.
 * Each player gets a unique `cameraId` and pauses its stream when scrolled off-screen,
 * freeing up network and CPU resources.
 */
export const MultipleStreams: Story = {
  name: 'Multiple Players (2×2 Grid)',
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, width: 640 }}>
      {[1, 2, 3, 4].map((i) => (
        <HLSLivePlayer
          key={i}
          {...args}
          cameraId={`cam-${String(i).padStart(2, '0')}`}
          figureClassName="w-full aspect-video"
        />
      ))}
    </div>
  ),
  args: {
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
};
