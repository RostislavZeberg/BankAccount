// components/HeaderBtn.tsx

import Link from "next/link"
import { useRouter } from 'next/router';

export const HeaderBtn = () => {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/');
  };

  // Функция для проверки активного маршрута
  const isActiveRoute = (path: string) => {
    return router.pathname === path;
  };

  if (isActiveRoute('/')) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3 sm:space-x-6">
      <Link
        href="/account"
        className={`btn-white text-xs sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 ${isActiveRoute('/account') ? 'bg-blue-500! text-white! cursor-default!' : ''}`}
      >
        Счета
      </Link>
      <Link
        href="/currency"
        className={`btn-white text-xs sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 ${isActiveRoute('/currency') ? 'bg-blue-500! text-white! cursor-default!' : ''}`}
      >
        Валюта
      </Link>
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-400 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors font-medium cursor-pointer text-xs sm:text-base"
      >
        Выйти
      </button>
    </div>
  );
};