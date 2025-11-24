// components/Account/Account.tsx

import { useState } from "react";
import { Select } from "./Select";
import { ListCards } from "./ListCards";
import { createAccount } from "../../services/api";

type SortOption = 'number' | 'balance' | 'transaction';

export const Account = () => {
  const [sortBy, setSortBy] = useState<SortOption>();
  const [isCreating, setIsCreating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const sortOptions = [
    { value: 'number' as const, label: 'По номеру' },
    { value: 'balance' as const, label: 'По балансу' },
    { value: 'transaction' as const, label: 'По последней транзакции' },
  ];

  const handleCreateAccount = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      console.log('Создание нового счета...');
      const newAccount = await createAccount();
      console.log('Новый счет создан:', newAccount);
      
      // Показываем уведомление об успехе
      alert(`Счет успешно создан! Номер счета: ${newAccount.account}`);
      
      // Триггерим обновление списка счетов
      setRefreshTrigger(prev => prev + 1);
      
    } catch (err: unknown) {
      console.error('Ошибка при создании счета:', err);
      
      let errorMessage = 'Неизвестная ошибка';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      alert(`Ошибка при создании счета: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-[50px]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-[35px] w-full sm:w-auto">
          <h1 className="whitespace-nowrap text-2xl sm:text-3xl font-bold text-gray-900">Ваши счета</h1>
          <div className="w-full sm:w-[260px]">
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
              placeholder="Сортировка"
            />
          </div>
        </div>
        <button 
          onClick={handleCreateAccount}
          disabled={isCreating}
          className="flex items-center justify-center gap-2.5 px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200 font-semibold w-full sm:w-auto text-sm sm:text-base"
        >
          {isCreating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Создание...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.99999 7.69167e-06L8 8.00001M8 8.00001L8.00001 16M8 8.00001L16 8.00001M8 8.00001L0 8" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="hidden xs:inline">Создать новый счёт</span>
              <span className="xs:hidden">Создать счёт</span>
            </>
          )}
        </button>
      </div>
      
      <ListCards sortBy={sortBy} refreshTrigger={refreshTrigger} />      
    </div>
  );
};