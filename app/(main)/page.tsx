import { PostFeed } from "@/components/post/PostFeed";

/**
 * @file app/(main)/page.tsx
 * @description 홈 피드 페이지
 *
 * Instagram 스타일의 홈 피드 페이지입니다.
 * PostFeed 컴포넌트를 통해 게시물 목록을 표시합니다.
 *
 * @dependencies
 * - @/components/post/PostFeed: 게시물 피드 컴포넌트
 */

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--instagram-background)]">
      {/* 피드 컨테이너 */}
      {/* 
        Desktop (1024px+): 최대 너비 630px, 중앙 정렬, 상하 패딩
        Tablet (768px~1023px): 전체 너비, 좌우 패딩
        Mobile (<768px): 전체 너비, 좌우 패딩
      */}
      <div className="max-w-[630px] lg:mx-auto md:mx-0 mx-0 pt-4 md:pt-8 lg:pt-12 px-0 md:px-4 pb-4 md:pb-8 lg:pb-12">
        <PostFeed />
      </div>
    </div>
  );
}

