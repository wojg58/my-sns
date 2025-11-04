import { PostFeed } from "@/components/post/PostFeed";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

/**
 * @file app/page.tsx
 * @description 루트 경로 홈피드 페이지
 *
 * Instagram 스타일의 홈 피드 페이지입니다.
 * Vercel 배포 시 루트 경로가 올바르게 홈피드를 표시하도록 명시적으로 구현합니다.
 *
 * @dependencies
 * - @/components/post/PostFeed: 게시물 피드 컴포넌트
 * - @/components/layout/Sidebar: 데스크톱/태블릿 사이드바
 * - @/components/layout/Header: 모바일 헤더
 * - @/components/layout/BottomNav: 모바일 하단 네비게이션
 */

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--instagram-background)]">
      {/* Desktop & Tablet Sidebar */}
      <Sidebar />

      {/* Mobile Header */}
      <Header />

      {/* Main Content */}
      <main className="lg:pl-[244px] md:pl-[72px] pt-[60px] md:pt-0 pb-[50px] md:pb-0">
        {/* 피드 컨테이너 */}
        <div className="max-w-[630px] lg:mx-auto md:mx-0 mx-0 pt-4 md:pt-8 lg:pt-12 px-0 md:px-4 pb-4 md:pb-8 lg:pb-12">
          <PostFeed />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

