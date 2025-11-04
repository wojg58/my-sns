"use client";

import { useState, useRef } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { CommentForm } from "@/components/comment/CommentForm";
import { CommentList } from "@/components/comment/CommentList";
import type { PostWithRelations, CommentWithUser } from "@/lib/types";

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
 * - @/lib/types: 타입 정의
 * - lucide-react: 아이콘
 */

/**
 * PostCard 컴포넌트 Props
 * PostWithRelations 타입을 기반으로 하되, API 응답 형식에 맞게 조정
 */
export interface PostCardProps {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  user: {
    id: string;
    clerkId: string;
    name: string;
  };
  stats: {
    likesCount: number;
    commentsCount: number;
  };
  isLiked: boolean;
  recentComments?: CommentWithUser[];
}

export function PostCard({
  id,
  imageUrl,
  caption,
  createdAt,
  user,
  stats: initialStats,
  isLiked: initialIsLiked,
  recentComments = [],
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialStats.likesCount);
  const [commentsCount, setCommentsCount] = useState(initialStats.commentsCount);
  const [comments, setComments] = useState<CommentWithUser[]>(recentComments);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const lastTapRef = useRef<number>(0);
  const imageRef = useRef<HTMLDivElement>(null);

  // 상대 시간 계산
  const timeAgo = formatTimeAgo(createdAt);

  // 캡션 줄 수 계산 (대략적으로)
  const shouldTruncate = caption && caption.length > 100 && !showFullCaption;

  // 좋아요 토글
  const handleLikeClick = async () => {
    const newIsLiked = !isLiked;
    
    // 낙관적 UI 업데이트
    setIsLiked(newIsLiked);
    setLikesCount((prev) => (newIsLiked ? prev + 1 : Math.max(0, prev - 1)));
    setIsAnimating(true);

    try {
      console.group("[PostCard] Like toggle");
      console.log("Post ID:", id, "Is liked:", newIsLiked);

      const response = await fetch("/api/likes", {
        method: newIsLiked ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId: id }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // 이미 좋아요한 경우 (409)는 상태를 되돌리지 않음
        if (response.status === 409 && error.alreadyLiked) {
          console.log("Already liked, keeping optimistic update");
        } else {
          // 다른 에러는 상태 되돌리기
          throw new Error(error.error || "Failed to toggle like");
        }
      }

      const data = await response.json();
      console.log("Like toggle success:", data);
      console.groupEnd();
    } catch (error) {
      console.error("[PostCard] Like toggle error:", error);
      // 에러 발생 시 상태 되돌리기
      setIsLiked(!newIsLiked);
      setLikesCount((prev) => (!newIsLiked ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      // 애니메이션 종료
      setTimeout(() => setIsAnimating(false), 150);
    }
  };

  // 더블탭 좋아요 처리
  const handleImageDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // 더블탭 감지
      if (!isLiked) {
        handleLikeClick();
        // 큰 하트 애니메이션
        setShowDoubleTapHeart(true);
        setTimeout(() => setShowDoubleTapHeart(false), 1000);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  return (
    <article className="bg-[var(--instagram-card)] border-x-0 md:border-x border-t border-b md:border border-[var(--instagram-border)] rounded-none md:rounded-lg mb-0 md:mb-4">
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
      <div
        ref={imageRef}
        className="relative w-full aspect-square bg-gray-100 cursor-pointer"
        onDoubleClick={handleImageDoubleTap}
      >
        <img
          src={imageUrl}
          alt={caption || "게시물 이미지"}
          className="w-full h-full object-cover select-none"
          draggable={false}
        />
        
        {/* 더블탭 하트 애니메이션 */}
        {showDoubleTapHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              className="w-24 h-24 fill-[var(--like)] text-[var(--like)] animate-[heart-pop_1s_ease-out]"
              style={{
                animation: "heart-pop 1s ease-out",
              }}
            />
          </div>
        )}
      </div>

      {/* 액션 버튼 (48px) */}
      <div className="h-[48px] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
          <button
            onClick={handleLikeClick}
            className="p-2 hover:opacity-70 transition-opacity"
            disabled={isAnimating}
          >
            <Heart
              className={`w-6 h-6 transition-transform duration-150 ${
                isLiked
                  ? "fill-[var(--like)] text-[var(--like)]"
                  : "text-[var(--text-primary)]"
              } ${
                isAnimating
                  ? "scale-[1.3]"
                  : "scale-100"
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
        {likesCount > 0 && (
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            좋아요 {likesCount.toLocaleString()}개
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

        {/* 댓글 목록 */}
        <CommentList
          comments={comments}
          totalCount={commentsCount}
          showAllLink={true}
          maxPreview={2}
          postId={id}
        />
      </div>

      {/* 댓글 작성 폼 */}
      <CommentForm
        postId={id}
        onCommentAdded={(newComment) => {
          console.log("[PostCard] New comment added:", newComment.id);
          
          // 댓글 목록에 추가 (최신순으로 정렬)
          setComments((prev) => [newComment, ...prev].slice(0, 2));
          
          // 댓글 수 증가
          setCommentsCount((prev) => prev + 1);
        }}
      />
    </article>
  );
}

