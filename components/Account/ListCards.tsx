// components/Account/ListCards.tsx
'use client'

import { useEffect, useState } from "react";
import { getAccounts } from "../../services/api";
import { Card } from "./Card"
import { useRouter } from "next/navigation";
import { Account } from "../../types/interface";

interface ListCardsProps {
  sortBy?: 'number' | 'balance' | 'transaction';
  refreshTrigger?: number;
}

export const ListCards = ({ sortBy, refreshTrigger = 0 }: ListCardsProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sortedAccounts, setSortedAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const result = await getAccounts();
      if (Array.isArray(result)) {
        setAccounts(result);
        setSortedAccounts(result);
      } else {
        console.error('Unexpected response format:', result);
        setError('Неверный формат данных от сервера');
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Не удалось загрузить данные счетов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [refreshTrigger]);

  // Эффект для применения сортировки при изменении sortBy
  useEffect(() => {
    if (!sortBy) {
      setSortedAccounts(accounts);
      return;
    }

    const sorted = [...accounts].sort((a, b) => {
      switch (sortBy) {
        case 'number':
          return a.account.localeCompare(b.account);
        case 'balance':
          return b.balance - a.balance;
        case 'transaction':
          const aLastTx = a.transactions?.[0];
          const bLastTx = b.transactions?.[0];
          
          if (!aLastTx && !bLastTx) return 0;
          if (!aLastTx) return 1;
          if (!bLastTx) return -1;
          
          return new Date(bLastTx.date).getTime() - new Date(aLastTx.date).getTime();
        default:
          return 0;
      }
    });

    setSortedAccounts(sorted);
  }, [sortBy, accounts]);

  // Функция для перехода к детальной странице счета
  const handleOpenAccount = (accountId: string) => {
    router.push(`/account/${accountId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-4 sm:p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-4 sm:p-6 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-sm sm:text-base">{error}</p>
        </div>
        <button
          onClick={fetchAccounts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (sortedAccounts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-4 sm:p-6 text-center">
        <div className="text-gray-500">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-lg font-semibold mb-2">Нет доступных счетов</p>
          <p className="text-sm">Создайте первый счет, чтобы начать работу</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Информация о сортировке */}
      {sortBy && (
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <p className="text-blue-800 text-xs sm:text-sm">
              <span className="font-semibold">Сортировка:</span> {
                sortBy === 'number' ? 'по номеру счета' :
                sortBy === 'balance' ? 'по балансу (от большего к меньшему)' :
                'по последней транзакции (сначала новые)'
              }
            </p>
            <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded text-xs font-medium">
              {sortedAccounts.length} счетов
            </span>
          </div>
        </div>
      )}

      {/* Список счетов */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {sortedAccounts.map((account, index) => (
          <Card 
            key={`${account.account}-${index}`} 
            account={account}
            onOpenAccount={handleOpenAccount}
          />
        ))}
      </div>
    </div>
  );
}