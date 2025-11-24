// types/interface.ts

// Базовый интерфейс для всех ответов API
export interface ApiResponse<T> {
  payload: T;
  error?: string;
}

// Типы для данных
export interface Transaction {
  amount: number;
  date: string;
  from: string;
  to: string;
}

export interface Account {
  account: string;
  balance: number;
  mine: boolean;
  transactions: Transaction[];
}

export interface AccountDetails {
  account: string;
  balance: number;
  transactions: Transaction[];
}

export interface Currency {
  amount: number;
  code: string;
}

export interface ExchangeRateMessage {
  type: 'EXCHANGE_RATE_CHANGE';
  from: string;
  to: string;
  rate: number;
  change: number;
}

export interface BalanceHistory {
  month: string;
  year: number;
  balance: number;
  date?: string; 
}

export interface ExchangeRateMessage {
  type: 'EXCHANGE_RATE_CHANGE';
  from: string;
  to: string;
  rate: number;
  change: number;
}
