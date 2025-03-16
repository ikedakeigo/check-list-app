// src/components/Header.tsx
'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import BackIcon from '../icons/BackIcon';
import BellIcon from '../icons/BellIcon';
import PlusIcon from '../icons/PlusIcon';

type HeaderProps = {
  title: string;
  showBack?: boolean;
  showAdd?: boolean;
  showSearch?: boolean;
  showNotification?: boolean;
  notificationCount?: number;
  userName?: string;
  onAddClick?: () => void;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
};

const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  showAdd = false,
  showSearch = false,
  showNotification = false,
  notificationCount = 0,
  userName,
  onAddClick,
  onSearchChange,
  searchValue = ''
}) => {
  const router = useRouter();

  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {showBack && (
            <button onClick={() => router.back()}>
              <BackIcon />
            </button>
          )}
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          {showNotification && (
            <div className="relative">
              <BellIcon />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 text-xs flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </div>
          )}
          {userName && (
            <div className="text-sm">
              {userName}
            </div>
          )}
          {showAdd && (
            <button
              onClick={onAddClick}
              className="bg-white bg-opacity-20 p-2 rounded-lg"
            >
              <PlusIcon />
            </button>
          )}
        </div>
      </div>

      {/* 検索フォーム */}
      {showSearch && (
        <div className="relative">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="検索..."
            className="w-full px-3 py-2 pl-10 bg-white bg-opacity-20 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
