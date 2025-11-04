"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import {
  Home,
  Search,
  SquarePlus,
  Heart,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @file components/layout/BottomNav.tsx
 * @description 모바일 하단 네비게이션 컴포넌트
 *
 * 모바일 화면(< 768px)에서만 표시되는 하단 네비게이션입니다.
 * - 높이: 50px
 * - 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필
 *
 * @dependencies
 * - next/link: 네비게이션
 * - @clerk/nextjs: 인증 상태 확인
 * - lucide-react: 아이콘
 */

const navItems = [
  { icon: Home, href: "/", label: "홈" },
  { icon: Search, href: "/search", label: "검색" },
  { icon: SquarePlus, href: "/create", label: "만들기" },
  { icon: Heart, href: "/activity", label: "활동" },
  { icon: User, href: "/profile", label: "프로필" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-white border-t border-[var(--instagram-border)] z-50">
      <SignedIn>
        <ul className="flex items-center justify-around h-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center h-full px-4 transition-colors",
                    isActive && "text-[var(--text-primary)]"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6",
                      isActive
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)]"
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </SignedIn>

      <SignedOut>
        <div className="flex items-center justify-center h-full">
          <Link
            href="/sign-in"
            className="px-4 py-2 text-sm font-semibold text-[var(--instagram-blue)]"
          >
            로그인
          </Link>
        </div>
      </SignedOut>
    </nav>
  );
}

