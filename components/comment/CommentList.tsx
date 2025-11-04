"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
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
  onCommentDeleted?: (commentId: string) => void; // 댓글 삭제 콜백
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
  onCommentDeleted,
}: CommentListProps) {
  const { user } = useUser();
  const [displayedComments, setDisplayedComments] = useState<CommentWithUser[]>(
    []
  );
  const [showAll, setShowAll] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // 댓글 삭제 핸들러
  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      return;
    }

    setDeletingCommentId(commentId);
    setOpenMenuId(null);

    try {
      console.group("[CommentList] Deleting comment");
      console.log("Comment ID:", commentId);

      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "댓글 삭제에 실패했습니다.");
      }

      console.log("Comment deleted successfully");
      console.groupEnd();

      // 콜백 호출 (댓글 목록에서 제거, 댓글 수 감소 등)
      if (onCommentDeleted) {
        onCommentDeleted(commentId);
      }
    } catch (err) {
      console.error("[CommentList] Delete error:", err);
      alert(err instanceof Error ? err.message : "댓글 삭제에 실패했습니다.");
    } finally {
      setDeletingCommentId(null);
    }
  };

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
      {displayedComments.map((comment) => {
        const isOwnComment = user?.id === comment.user.clerkId;
        const isMenuOpen = openMenuId === comment.id;
        const isDeleting = deletingCommentId === comment.id;

        return (
          <div key={comment.id} className="text-sm flex items-start group relative">
            <div className="flex-1">
              <span className="font-semibold text-[var(--text-primary)] mr-1">
                {comment.user.name}
              </span>
              <span className="text-[var(--text-primary)]">{comment.content}</span>
            </div>
            
            {/* 삭제 버튼 (본인 댓글만) */}
            {isOwnComment && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenMenuId(isMenuOpen ? null : comment.id)}
                  className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 rounded"
                  disabled={isDeleting}
                  aria-label="댓글 메뉴"
                >
                  <MoreHorizontal className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
                
                {/* 메뉴 드롭다운 */}
                {isMenuOpen && (
                  <>
                    {/* 백드롭 */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setOpenMenuId(null)}
                    />
                    
                    {/* 메뉴 */}
                    <div className="absolute right-0 top-6 bg-white border border-[var(--instagram-border)] rounded-lg shadow-lg z-20 min-w-[120px]">
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={isDeleting}
                        className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            <span>삭제 중...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            <span>삭제</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

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

