// utils/accountSort.ts

import { Account } from "../types/interface";

export const sortAccounts = (accounts: Account[], sortBy: 'number' | 'balance' | 'transaction'): Account[] => {
  const sorted = [...accounts];
  
  switch (sortBy) {
    case 'number':
      return sorted.sort((a, b) => a.account.localeCompare(b.account));
    
    case 'balance':
      return sorted.sort((a, b) => b.balance - a.balance);
    
    case 'transaction':
      return sorted.sort((a, b) => {
        const aLastTx = a.transactions?.[0];
        const bLastTx = b.transactions?.[0];
        
        if (!aLastTx && !bLastTx) return 0;
        if (!aLastTx) return 1;
        if (!bLastTx) return -1;
        
        return new Date(bLastTx.date).getTime() - new Date(aLastTx.date).getTime();
      });
    
    default:
      return sorted;
  }
};

// Функция для получения описания сортировки
export const getSortDescription = (sortBy: 'number' | 'balance' | 'transaction'): string => {
  const descriptions = {
    number: 'по номеру счета',
    balance: 'по балансу (от большего к меньшему)',
    transaction: 'по дате последней транзакции (сначала новые)'
  };
  return descriptions[sortBy];
};