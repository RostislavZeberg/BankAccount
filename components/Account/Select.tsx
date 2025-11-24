// components/Account/Select.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

export type SortOption = 'number' | 'balance' | 'transaction';

interface SelectProps {
  options: {
    value: SortOption;
    label: string;
  }[];
  value?: SortOption;
  onChange: (value: SortOption) => void;
  placeholder?: string;
}

export const Select = ({ options, value, onChange, placeholder = 'Сортировка' }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  // Закрытие селекта при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (optionValue: SortOption) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full sm:w-[260px] max-w-xs" ref={selectRef}>
      {/* Кнопка селекта */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full cursor-pointer px-3 sm:px-4 py-2 sm:py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between text-sm sm:text-base"
      >
        <span className="text-gray-700 truncate">{selectedOption?.label || placeholder}</span>
        
        {/* Стрелка с анимацией */}
        <svg
          className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Выпадающий список */}
      <div
        className={`absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 transition-all duration-300 ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <ul className="py-1 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => handleOptionClick(option.value)}
                className={`w-full cursor-pointer px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between text-sm sm:text-base ${
                  option.value === value
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700'
                }`}
              >
                {option.label}
                {option.value === value && (
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};