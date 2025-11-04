"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Heart, MessageCircle, User } from "lucide-react";

/**
 * @file components/layout/Header.tsx
 * @description 모바일 헤더 컴포넌트
 *
 * 모바일 화면(< 768px)에서만 표시되는 헤더입니다.
 * - 높이: 60px
 * - 로고 + 알림 아이콘 + 프로필 아이콘
 *
 * @dependencies
 * - @clerk/nextjs: 인증 상태 및 사용자 버튼
 * - lucide-react: 아이콘
 */

export function Header() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-[var(--instagram-border)] z-50 flex items-center justify-between px-4">
      {/* Logo */}
      <Link href="/" className="text-xl font-bold text-[var(--text-primary)]">
        Instagram
      </Link>

      {/* Right Side Icons */}
      <div className="flex items-center gap-4">
        <SignedIn>
          {/* 알림 아이콘 (1차 MVP 제외 기능이지만 UI만 표시) */}
          <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <Heart className="w-6 h-6 text-[var(--text-primary)]" />
          </button>

          {/* DM 아이콘 (1차 MVP 제외 기능이지만 UI만 표시) */}
          <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <MessageCircle className="w-6 h-6 text-[var(--text-primary)]" />
          </button>

          {/* 프로필 버튼 */}
          <UserButton />
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 text-sm font-semibold text-[var(--instagram-blue)] hover:text-[var(--instagram-blue)]/80 transition-colors">
              로그인
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </header>
  );
}

