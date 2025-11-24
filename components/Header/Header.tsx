// components/Header.tsx
import Image from 'next/image';
import Link from 'next/link';
import { HeaderBtn } from './HeaderBtn';

export const Header = () => {
  return (
    <header className="bg-blue-500 text-white py-4 sm:py-[25px] px-4 sm:px-[50px] flex items-center justify-between">
      <Link href="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
        <Image
          src="/image/logo.svg"
          alt="Bank Account Logo"
          width={0}
          height={0}
          className="w-[150px] sm:w-[200px] h-auto" 
          priority
        />
      </Link>
      <HeaderBtn />
    </header>
  );
};