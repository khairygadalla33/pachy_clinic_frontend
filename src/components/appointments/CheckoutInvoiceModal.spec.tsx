import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CheckoutInvoiceModal from './CheckoutInvoiceModal';
import api from '../../lib/api';

vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  }
}));

describe('CheckoutInvoiceModal', () => {
  const mockItem = {
    id: 'workflow-1',
    appointmentId: 'app-1',
    client: { fullName: 'Test Client', phone: '12345678' },
    appointment: {
      staff: { fullName: 'Doctor Test' },
      appointmentServices: [
        { name: 'Laser', price: 500 },
        { name: 'Meso', price: 300 }
      ]
    }
  };

  const mockSettlement = {
    subTotal: 800,
    deposit: 0,
    services: [
      { name: 'Laser', price: 500 },
      { name: 'Meso', price: 300 }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockResolvedValue({ data: mockSettlement });
  });

  it('renders correctly and calculates initial total', async () => {
    render(<CheckoutInvoiceModal queueItem={mockItem} onClose={() => {}} onSuccess={vi.fn()} />);
    
    expect(await screen.findByText('تسوية فاتورة العميل')).toBeInTheDocument();
    expect(await screen.findByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('Laser')).toBeInTheDocument();
    expect(screen.getByText('Meso')).toBeInTheDocument();
    
    // Total should be 500 + 300 = 800
    const totalElements = screen.getAllByText(/800/);
    expect(totalElements.length).toBeGreaterThan(0);
  });

  it('applies discount correctly', async () => {
    render(<CheckoutInvoiceModal queueItem={mockItem} onClose={() => {}} onSuccess={vi.fn()} />);
    
    // Wait for the modal to load data
    // Wait for the modal to load data and input to appear
    const discountInput = await screen.findByRole('spinbutton');
    // wait... in component we have: <span>الخصم الإضافي (إن وجد):</span> <input type="number".../>
    // Let's use container query or placeholder. Actually, let's just use role.
    fireEvent.change(discountInput, { target: { value: '100' } });
    
    // Final total should be 700
    const finalElements = screen.getAllByText(/700/);
    expect(finalElements.length).toBeGreaterThan(0);
  });
});
