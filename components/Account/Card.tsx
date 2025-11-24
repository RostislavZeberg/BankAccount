// components/Account/Card.tsx

import { Account } from "../../types/interface";

interface CardProps {
  account: Account;
  onOpenAccount: (accountId: string) => void;
}

export const Card = ({ account, onOpenAccount }: CardProps) => {
  // Форматирование баланса для отображения
  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(balance);
  };

  // Форматирование номера счета для отображения
  const formatAccountNumber = (accountNumber: string) => {
    if (accountNumber.length < 8) return accountNumber;
    
    const firstPart = accountNumber.slice(0, 4);
    const secondPart = accountNumber.slice(4, 8);
    const lastPart = accountNumber.slice(-8);
    
    return `${firstPart} ${secondPart} **** **** ${lastPart}`;
  };

  // Форматирование даты для отображения
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Определяем валюту
  const getCurrency = () => {
    return "RUB";
  };

  // Получаем последнюю транзакцию
  const getLastTransaction = () => {
    if (account.transactions && account.transactions.length > 0) {
      return account.transactions[0];
    }
    return null;
  };

  // Получаем тип счета
  const getAccountType = () => {
    return account.mine ? "Мой счет" : "Счет";
  };

  // Получаем статус счета
  const getAccountStatus = () => {
    return "Основной";
  };

  const lastTransaction = getLastTransaction();
  const currency = getCurrency();
  const accountType = getAccountType();
  const accountStatus = getAccountStatus();

  // Обработчик клика по кнопке "Открыть"
  const handleOpenClick = () => {
    onOpenAccount(account.account);
  };

  return (
    <div className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-4 sm:p-6 hover:shadow-[0px_8px_25px_0px_rgba(0,0,0,0.3)] transition-all duration-300 flex flex-col h-full border border-gray-100">
      <div className="grow">
        {/* Заголовок карточки */}
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div className="flex flex-col">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
              {accountType}
            </h2>
            <span className="text-xs sm:text-sm text-gray-500 font-medium">
              {accountStatus}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-[#116ACC] bg-[#E5F0FF] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
            {currency}
          </span>
        </div>
        
        {/* Основная информация */}
        <div className="space-y-4 sm:space-y-5">
          {/* Номер счета */}
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Номер счета</p>
            <p className="text-base sm:text-lg font-mono text-gray-900 font-semibold tracking-wide break-all">
              {formatAccountNumber(account.account)}
            </p>
          </div>
          
          {/* Баланс */}
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Баланс</p>
            <p className="text-xl sm:text-2xl font-bold text-[#00A72A]">
              {formatBalance(account.balance)} {currency}
            </p>
          </div>

          {/* Последняя транзакция */}
          {lastTransaction && (
            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3">Последняя операция</p>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    lastTransaction.to === account.account ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`text-xs sm:text-sm font-semibold ${
                    lastTransaction.to === account.account ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {lastTransaction.to === account.account ? '+' : '-'} {formatBalance(lastTransaction.amount)}
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {formatDate(lastTransaction.date)}
                </span>
              </div>
            </div>
          )}

          {/* Статистика транзакций */}
          <div className="pt-3 sm:pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500">
                Всего транзакций
              </span>
              <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                {account.transactions?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка "Открыть" */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-200">
        <button
          onClick={handleOpenClick}
          className="flex cursor-pointer justify-center items-center font-semibold text-white bg-[#116ACC] hover:bg-[#0D5AA8] active:bg-[#0B4F8C] transition-all duration-200 rounded-lg shadow-sm hover:shadow-md w-full py-3 px-4 text-sm sm:text-base"
        >
          Открыть
        </button>
      </div>
    </div>
  );
};