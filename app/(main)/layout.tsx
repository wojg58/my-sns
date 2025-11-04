import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

/**
 * @file app/(main)/layout.tsx
 * @description 메인 레이아웃 컴포넌트
 *
 * Instagram 스타일의 레이아웃을 제공합니다:
 * - Desktop: Sidebar (244px) + Main Content
 * - Tablet: Icon-only Sidebar (72px) + Main Content
 * - Mobile: Header + Main Content + BottomNav
 *
 * @dependencies
 * - @/components/layout/Sidebar: 데스크톱/태블릿 사이드바
 * - @/components/layout/Header: 모바일 헤더
 * - @/components/layout/BottomNav: 모바일 하단 네비게이션
 */

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--instagram-background)]">
      {/* Desktop & Tablet Sidebar */}
      {/* Desktop (1024px+): 244px, Tablet (768px~1023px): 72px, Mobile (<768px): 숨김 */}
      <Sidebar />

      {/* Mobile Header */}
      {/* Mobile (<768px)에서만 표시 */}
      <Header />

      {/* Main Content */}
      {/* 
        Desktop (1024px+): Sidebar 244px 만큼 왼쪽 패딩
        Tablet (768px~1023px): Sidebar 72px 만큼 왼쪽 패딩
        Mobile (<768px): Header 60px 만큼 위쪽 패딩, BottomNav 50px 만큼 아래쪽 패딩
      */}
      <main className="lg:pl-[244px] md:pl-[72px] pt-[60px] md:pt-0 pb-[50px] md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {/* Mobile (<768px)에서만 표시 */}
      <BottomNav />
    </div>
  );
}
