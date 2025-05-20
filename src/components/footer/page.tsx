"use client";

import { useRouter, usePathname } from "next/navigation";
import React from "react";
import HomeIcon from "../icons/HomeIcon";
import ChecklistIcon from "../icons/ChecklistIcon";
import ArchiveIcon from "../icons/ArchiveIcon";
import SettingsIcon from "../icons/SettingsIcon";
import Link from "next/link";

type FooterProps = {
  selectedFilter?: string;
  onFilterChange?: (filter: string) => void;
};

const Footer: React.FC<FooterProps> = ({ selectedFilter, onFilterChange }) => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-center">
      <div className="flex justify-between items-center w-full max-w-md bg-white border-t border-gray-200">
        <Link
          href="/"
          className={`flex flex-col items-center py-2 px-4 ${
            isActive("/") ? "text-blue-600" : "text-gray-600"
          }`}
        >
          <HomeIcon />
          <span className="text-xs mt-1">ホーム</span>
        </Link>
        <Link
          href="/checklists"
          className={`flex flex-col items-center py-2 px-4 ${
            isActive("/checklists") ? "text-blue-600" : "text-gray-600"
          }`}
        >
          <ChecklistIcon />
          <span className="text-xs mt-1">チェック</span>
        </Link>
        <button
          onClick={() => {
            if (onFilterChange) {
              onFilterChange("archived");
            } else {
              router.push("/checklists?filter=archived");
            }
          }}
          className={`flex flex-col items-center py-2 px-4 ${
            selectedFilter === "archived" ? "text-blue-600" : "text-gray-600"
          }`}
        >
          <ArchiveIcon />
          <span className="text-xs mt-1">アーカイブ</span>
        </button>
        <Link
          href="/settings"
          className={`flex flex-col items-center py-2 px-4 ${
            isActive("/settings") ? "text-blue-600" : "text-gray-600"
          }`}
        >
          <SettingsIcon />
          <span className="text-xs mt-1">設定</span>
        </Link>
      </div>
    </nav>
  );
};

export default Footer;
