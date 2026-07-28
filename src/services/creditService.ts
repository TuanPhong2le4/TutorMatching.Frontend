import { api } from './api';

export interface WalletBalanceDto {
  userId: string;
  fullName: string;
  creditBalance: number;
}

export interface CreditTransactionDto {
  id: string;
  amount: number;
  type: string | number;
  description: string;
  bookingId?: string;
  balanceAfter: number;
  createdAt: string;
}

export interface AdminDepositRequestDto {
  id: string;
  userId: string;
  amount: number;
  status: number;
  createdAt: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export const creditService = {
  async getBalance(): Promise<WalletBalanceDto> {
    const res = await api.get<{ data: WalletBalanceDto }>('/Credits/balance');
    return res.data.data;
  },

  async deposit(amount: number): Promise<number> {
    const res = await api.post<{ data: number }>('/Credits/deposit', { amount });
    return res.data.data;
  },

  async getTransactions(pageNumber = 1, pageSize = 10): Promise<PagedResult<CreditTransactionDto>> {
    const res = await api.get<{ data: PagedResult<CreditTransactionDto> }>('/Credits/transactions', {
      params: { pageNumber, pageSize }
    });
    return res.data.data;
  },

  // Admin approval APIs
  async getAdminDepositRequests(pageNumber = 1, pageSize = 10): Promise<PagedResult<AdminDepositRequestDto>> {
    const res = await api.get<{ data: PagedResult<AdminDepositRequestDto> }>('/Admin/deposit-requests', {
      params: { pageNumber, pageSize }
    });
    return res.data.data;
  },

  async approveDepositRequest(id: string): Promise<boolean> {
    const res = await api.put<{ data: boolean }>(`/Admin/deposit-requests/${id}/approve`);
    return res.data.data;
  },

  async rejectDepositRequest(id: string): Promise<boolean> {
    const res = await api.put<{ data: boolean }>(`/Admin/deposit-requests/${id}/reject`);
    return res.data.data;
  }
};
