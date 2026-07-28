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
  }
};
