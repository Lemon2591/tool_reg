import type { Meta, StoryObj } from '@storybook/react';

import { ReceiptModal } from './ModalReceipt.tsx';

const meta = {
  title: 'Components/Dashboard/Projects/Project count',
  component: ReceiptModal,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ReceiptModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    style: { width: 600 },
  },
};
