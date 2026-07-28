import { api } from './api';

export interface WalletBalanceDto {
  userId: string;
  fullName: string;
  creditBalance: number;
}

export const creditService = {
  async getBalance(): Promise<WalletBalanceDto> {
    const res = await api.get<{ data: WalletBalanceDto }>('/Credits/balance');
    return res.data.data;
  }
};
