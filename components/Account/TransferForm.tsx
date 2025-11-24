// components/Account/TransferForm.tsx
'use client'

import { useState, useEffect } from 'react';

interface TransferFormProps {
  accountId: string;
  onTransfer: (to: string, amount: number) => Promise<void>;
}

export const TransferForm = ({ accountId, onTransfer }: TransferFormProps) => {
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ toAccount?: string; amount?: string }>({});

  // Загружаем историю переводов из localStorage
  useEffect(() => {
    const savedAccounts = localStorage.getItem(`transfer_history_${accountId}`);
    if (savedAccounts) {
      setSuggestions(JSON.parse(savedAccounts));
    }
  }, [accountId]);

  // Валидация формы
  const validateForm = () => {
    const newErrors: { toAccount?: string; amount?: string } = {};

    if (!toAccount.trim()) {
      newErrors.toAccount = 'Введите номер счета получателя';
    } else if (toAccount.trim().length < 5) {
      newErrors.toAccount = 'Номер счета слишком короткий';
    }

    if (!amount.trim()) {
      newErrors.amount = 'Введите сумму перевода';
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = 'Сумма должна быть положительным числом';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onTransfer(toAccount.trim(), parseFloat(amount));
      
      // Сохраняем счет получателя в историю
      const savedAccounts = localStorage.getItem(`transfer_history_${accountId}`);
      const accounts = savedAccounts ? JSON.parse(savedAccounts) : [];
      
      if (!accounts.includes(toAccount.trim())) {
        const updatedAccounts = [toAccount.trim(), ...accounts].slice(0, 10);
        localStorage.setItem(`transfer_history_${accountId}`, JSON.stringify(updatedAccounts));
        setSuggestions(updatedAccounts);
      }

      // Сбрасываем форму
      setToAccount('');
      setAmount('');
      setErrors({});
    } catch (error) {
      console.error('Transfer error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик выбора из автодополнения
  const handleSuggestionClick = (suggestion: string) => {
    setToAccount(suggestion);
    setSuggestions([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-[0px_5px_20px_0px_rgba(0,0,0,0.25)] p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-900">Перевод средств</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Поле получателя */}
        <div className="relative">
          <label htmlFor="toAccount" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Счет получателя
          </label>
          <input
            id="toAccount"
            type="text"
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            placeholder="Введите номер счета"
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
              errors.toAccount ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          
          {/* Автодополнение */}
          {suggestions.length > 0 && toAccount && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {suggestions
                .filter(suggestion => 
                  suggestion.toLowerCase().includes(toAccount.toLowerCase())
                )
                .map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="font-mono text-xs sm:text-sm">{suggestion}</div>
                    <div className="text-xs text-gray-500">Ранее использованный счет</div>
                  </button>
                ))}
            </div>
          )}
          
          {errors.toAccount && (
            <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.toAccount}</p>
          )}
        </div>

        {/* Поле суммы */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Сумма перевода (RUB)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
              errors.amount ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.amount && (
            <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.amount}</p>
          )}
        </div>

        {/* Кнопка отправки */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold cursor-pointer text-sm sm:text-base"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Выполняется перевод...
            </div>
          ) : (
            'Выполнить перевод'
          )}
        </button>
      </form>

      {/* Информация о переводе */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-1 sm:mb-2 text-sm sm:text-base">Информация о переводе</h3>
        <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
          <li>• Минимальная сумма: 0.01 RUB</li>
          <li>• Комиссия за перевод: 0%</li>
          <li>• Переводы доступны 24/7</li>
        </ul>
      </div>
    </div>
  );
};