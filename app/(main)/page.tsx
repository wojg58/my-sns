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
      {/* 피드 컨테이너 - 최대 너비 630px, 중앙 정렬 */}
      <div className="max-w-[630px] mx-auto pt-4 md:pt-8 px-4">
        <PostFeed />
      </div>
    </div>
  );
}

