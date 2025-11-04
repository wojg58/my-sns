/**
 * @file components/post/PostCardSkeleton.tsx
 * @description 게시물 카드 로딩 스켈레톤 컴포넌트
 *
 * 게시물 로딩 중 표시되는 스켈레톤 UI입니다.
 * Shimmer 효과를 포함합니다.
 */

export function PostCardSkeleton() {
  return (
    <article className="bg-[var(--instagram-card)] border-x-0 md:border-x border-t border-b md:border border-[var(--instagram-border)] rounded-none md:rounded-lg mb-0 md:mb-4 animate-pulse">
      {/* 헤더 스켈레톤 */}
      <header className="h-[60px] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded" />
      </header>

      {/* 이미지 스켈레톤 */}
      <div className="relative w-full aspect-square bg-gray-200" />

      {/* 액션 버튼 스켈레톤 */}
      <div className="h-[48px] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-gray-200 rounded" />
          <div className="w-6 h-6 bg-gray-200 rounded" />
          <div className="w-6 h-6 bg-gray-200 rounded" />
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded" />
      </div>

      {/* 컨텐츠 스켈레톤 */}
      <div className="px-4 pb-4 space-y-3">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-3 w-2/3 bg-gray-200 rounded" />
        </div>
      </div>
    </article>
  );
}

