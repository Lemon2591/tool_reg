import type { Meta, StoryObj } from '@storybook/react';

import { CustomerModal } from './ModalCustomer.tsx';

const meta = {
  title: 'Components/Dashboard/Projects/Project count',
  component: CustomerModal,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CustomerModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    style: { width: 600 },
  },
};
