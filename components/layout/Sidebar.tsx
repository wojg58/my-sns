"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import {
  Home,
  Search,
  SquarePlus,
  User,
  Heart,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @file components/layout/Sidebar.tsx
 * @description Instagram 스타일 사이드바 컴포넌트
 *
 * 반응형 디자인:
 * - Desktop (1024px+): 244px 너비, 아이콘 + 텍스트
 * - Tablet (768px-1023px): 72px 너비, 아이콘만
 * - Mobile (<768px): 숨김
 *
 * @dependencies
 * - next/link: 네비게이션
 * - @clerk/nextjs: 인증 상태 확인
 * - lucide-react: 아이콘
 */

const menuItems = [
  { icon: Home, label: "홈", href: "/", iconOnly: false },
  { icon: Search, label: "검색", href: "/search", iconOnly: true },
  { icon: SquarePlus, label: "만들기", href: "/create", iconOnly: false },
  { icon: Heart, label: "활동", href: "/activity", iconOnly: true },
  { icon: User, label: "프로필", href: "/profile", iconOnly: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen bg-white border-r border-[var(--instagram-border)] z-50 hidden md:block">
      {/* Desktop: 244px, Tablet: 72px */}
      <div className="w-[244px] md:w-[72px] lg:w-[244px] h-full flex flex-col">
        {/* Logo */}
        <div className="px-6 md:px-4 lg:px-6 py-5 border-b border-[var(--instagram-border)]">
          <Link
            href="/"
            className="flex items-center gap-3 md:justify-center lg:justify-start"
          >
            <span className="text-2xl font-bold text-[var(--text-primary)] hidden md:hidden lg:inline">
              Instagram
            </span>
            <span className="text-xl font-bold text-[var(--text-primary)] md:inline lg:hidden">
              IG
            </span>
          </Link>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-4">
          <SignedIn>
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const showLabel = !item.iconOnly;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 md:justify-center lg:justify-start px-3 py-2 rounded-lg transition-colors",
                        "hover:bg-gray-50",
                        isActive && "font-semibold"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-6 h-6",
                          isActive
                            ? "text-[var(--text-primary)]"
                            : "text-[var(--text-primary)]"
                        )}
                      />
                      {showLabel && (
                        <span
                          className={cn(
                            "text-base hidden lg:inline",
                            isActive
                              ? "text-[var(--text-primary)] font-semibold"
                              : "text-[var(--text-primary)]"
                          )}
                        >
                          {item.label}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </SignedIn>

          <SignedOut>
            <div className="px-3 py-2">
              <SignInButton mode="modal">
                <button className="w-full flex items-center gap-3 md:justify-center lg:justify-start px-3 py-2 rounded-lg hover:bg-gray-50">
                  <Menu className="w-6 h-6 text-[var(--text-primary)]" />
                  <span className="text-base hidden lg:inline text-[var(--text-primary)]">
                    로그인
                  </span>
                </button>
              </SignInButton>
            </div>
          </SignedOut>
        </nav>
      </div>
    </aside>
  );
}

