"use client";

import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import Link from "next/link";

/**
 * 상대 시간 포맷팅 함수
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "방금 전";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}일 전`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}년 전`;
}

/**
 * @file components/post/PostCard.tsx
 * @description 게시물 카드 컴포넌트
 *
 * Instagram 스타일의 게시물 카드입니다.
 * - 헤더: 프로필 이미지, 사용자명, 시간, 메뉴
 * - 이미지: 1:1 정사각형
 * - 액션 버튼: 좋아요, 댓글, 공유(UI만), 북마크(UI만)
 * - 컨텐츠: 좋아요 수, 캡션, 댓글 미리보기
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - date-fns: 시간 포맷팅
 */

interface PostUser {
  id: string;
  clerkId: string;
  name: string;
}

interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface PostStats {
  likesCount: number;
  commentsCount: number;
}

export interface PostCardProps {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  user: PostUser;
  stats: PostStats;
  isLiked: boolean;
  recentComments?: PostComment[];
}

export function PostCard({
  id,
  imageUrl,
  caption,
  createdAt,
  user,
  stats,
  isLiked: initialIsLiked,
  recentComments = [],
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [showFullCaption, setShowFullCaption] = useState(false);

  // 상대 시간 계산
  const timeAgo = formatTimeAgo(createdAt);

  // 캡션 줄 수 계산 (대략적으로)
  const shouldTruncate = caption && caption.length > 100 && !showFullCaption;

  const handleLikeClick = () => {
    // TODO: 좋아요 API 호출 (1-4에서 구현 예정)
    setIsLiked(!isLiked);
    console.log("[PostCard] Like clicked:", { postId: id, isLiked: !isLiked });
  };

  return (
    <article className="bg-[var(--instagram-card)] border border-[var(--instagram-border)] rounded-lg mb-4">
      {/* 헤더 (60px) */}
      <header className="h-[60px] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 (32px 원형) */}
          <Link href={`/profile/${user.clerkId}`}>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </Link>
          
          {/* 사용자명 + 시간 */}
          <div className="flex flex-col">
            <Link
              href={`/profile/${user.clerkId}`}
              className="text-sm font-semibold text-[var(--text-primary)] hover:opacity-70"
            >
              {user.name}
            </Link>
            <span className="text-xs text-[var(--text-secondary)]">{timeAgo}</span>
          </div>
        </div>

        {/* 메뉴 버튼 */}
        <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <MoreHorizontal className="w-5 h-5 text-[var(--text-primary)]" />
        </button>
      </header>

      {/* 이미지 영역 (1:1 정사각형) */}
      <div className="relative w-full aspect-square bg-gray-100">
        <img
          src={imageUrl}
          alt={caption || "게시물 이미지"}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 액션 버튼 (48px) */}
      <div className="h-[48px] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
          <button
            onClick={handleLikeClick}
            className="p-2 hover:opacity-70 transition-opacity"
          >
            <Heart
              className={`w-6 h-6 ${
                isLiked
                  ? "fill-[var(--like)] text-[var(--like)]"
                  : "text-[var(--text-primary)]"
              }`}
            />
          </button>

          {/* 댓글 버튼 */}
          <Link
            href={`/post/${id}`}
            className="p-2 hover:opacity-70 transition-opacity"
          >
            <MessageCircle className="w-6 h-6 text-[var(--text-primary)]" />
          </Link>

          {/* 공유 버튼 (UI만) */}
          <button className="p-2 hover:opacity-70 transition-opacity">
            <Send className="w-6 h-6 text-[var(--text-primary)]" />
          </button>
        </div>

        {/* 북마크 버튼 (UI만) */}
        <button className="p-2 hover:opacity-70 transition-opacity">
          <Bookmark className="w-6 h-6 text-[var(--text-primary)]" />
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수 */}
        {stats.likesCount > 0 && (
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            좋아요 {stats.likesCount.toLocaleString()}개
          </div>
        )}

        {/* 캡션 */}
        {caption && (
          <div className="text-sm text-[var(--text-primary)]">
            <Link
              href={`/profile/${user.clerkId}`}
              className="font-semibold hover:opacity-70 mr-1"
            >
              {user.name}
            </Link>
            <span>
              {shouldTruncate ? (
                <>
                  {caption.slice(0, 100)}...
                  <button
                    onClick={() => setShowFullCaption(true)}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] ml-1"
                  >
                    더 보기
                  </button>
                </>
              ) : (
                caption
              )}
            </span>
          </div>
        )}

        {/* 댓글 미리보기 */}
        {stats.commentsCount > 0 && (
          <div className="space-y-1">
            {stats.commentsCount > recentComments.length && (
              <Link
                href={`/post/${id}`}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                댓글 {stats.commentsCount}개 모두 보기
              </Link>
            )}
            {recentComments.slice(0, 2).map((comment) => (
              <div key={comment.id} className="text-sm">
                <span className="font-semibold text-[var(--text-primary)] mr-1">
                  {comment.user.name}
                </span>
                <span className="text-[var(--text-primary)]">
                  {comment.content}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

