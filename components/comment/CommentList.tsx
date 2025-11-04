"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { CommentWithUser } from "@/lib/types";

/**
 * @file components/comment/CommentList.tsx
 * @description 댓글 목록 컴포넌트
 *
 * Instagram 스타일의 댓글 목록 표시 컴포넌트입니다.
 * - PostCard: 최신 2개 미리보기
 * - 상세 모달: 전체 댓글 + 스크롤
 *
 * @dependencies
 * - @/lib/types: 타입 정의
 */

interface CommentListProps {
  comments: CommentWithUser[];
  totalCount: number; // 전체 댓글 수
  showAllLink?: boolean; // "모두 보기" 링크 표시 여부
  maxPreview?: number; // 미리보기 최대 개수 (기본: 2)
  postId?: string; // 게시물 ID (링크용)
  className?: string;
}

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

export function CommentList({
  comments,
  totalCount,
  showAllLink = true,
  maxPreview = 2,
  postId,
  className = "",
}: CommentListProps) {
  const [displayedComments, setDisplayedComments] = useState<CommentWithUser[]>(
    []
  );
  const [showAll, setShowAll] = useState(false);

  // 댓글 목록 업데이트
  useEffect(() => {
    if (showAll) {
      // 전체 댓글 표시
      setDisplayedComments(comments);
    } else {
      // 최신 N개만 표시
      setDisplayedComments(comments.slice(0, maxPreview));
    }
  }, [comments, showAll, maxPreview]);

  // 댓글이 없는 경우
  if (totalCount === 0 && comments.length === 0) {
    return null;
  }

  const hasMoreComments = totalCount > displayedComments.length;
  const shouldShowAllLink = showAllLink && hasMoreComments && !showAll;

  return (
    <div className={`space-y-1 ${className}`}>
      {/* "모두 보기" 링크 */}
      {shouldShowAllLink && postId && (
        <Link
          href={`/post/${postId}`}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          댓글 {totalCount}개 모두 보기
        </Link>
      )}

      {/* 댓글 목록 */}
      {displayedComments.map((comment) => (
        <div key={comment.id} className="text-sm">
          <span className="font-semibold text-[var(--text-primary)] mr-1">
            {comment.user.name}
          </span>
          <span className="text-[var(--text-primary)]">{comment.content}</span>
          {/* 시간 표시 (상세 모달에서만 표시할 수도 있음) */}
          {/* <span className="text-xs text-[var(--text-secondary)] ml-2">
            {formatTimeAgo(comment.createdAt)}
          </span> */}
        </div>
      ))}

      {/* "더 보기" 버튼 (클라이언트 사이드에서 더 보기) */}
      {!showAll && hasMoreComments && !postId && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          댓글 {totalCount - displayedComments.length}개 더 보기
        </button>
      )}
    </div>
  );
}

