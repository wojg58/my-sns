"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Trash2,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  CommentForm,
  type CommentFormRef,
} from "@/components/comment/CommentForm";
import { CommentList } from "@/components/comment/CommentList";
import { PostModal } from "@/components/post/PostModal";
import { EditPostModal } from "@/components/post/EditPostModal";
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
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialStats.likesCount);
  const [commentsCount, setCommentsCount] = useState(
    initialStats.commentsCount,
  );
  const [comments, setComments] = useState<CommentWithUser[]>(recentComments);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [timeAgo, setTimeAgo] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCaption, setCurrentCaption] = useState(caption || "");
  const lastTapRef = useRef<number>(0);
  const imageRef = useRef<HTMLDivElement>(null);
  const commentFormInputRef = useRef<CommentFormRef>(null);
  const singleClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isOwnPost = clerkUser?.id === user.clerkId;

  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true);
    setTimeAgo(formatTimeAgo(createdAt));
  }, [createdAt]);

  // caption prop이 변경되면 currentCaption 업데이트
  useEffect(() => {
    setCurrentCaption(caption || "");
  }, [caption]);

  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (singleClickTimeoutRef.current) {
        clearTimeout(singleClickTimeoutRef.current);
      }
    };
  }, []);

  // 캡션 줄 수 계산 (대략적으로)
  const shouldTruncate = caption && caption.length > 100 && !showFullCaption;

  // 게시물 삭제
  const handleDeletePost = async () => {
    if (!confirm("정말 이 게시물을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    setOpenMenu(false);

    try {
      console.group("[PostCard] Deleting post");
      console.log("Post ID:", id);

      const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "게시물 삭제에 실패했습니다.");
      }

      console.log("Post deleted successfully");
      console.groupEnd();

      // 삭제 성공 시 페이지 새로고침
      window.location.reload();
    } catch (err) {
      console.error("[PostCard] Delete error:", err);
      alert(err instanceof Error ? err.message : "게시물 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  // 이미지 클릭 시 모달 열기 (Desktop) 또는 페이지 이동 (Mobile)
  // 더블탭 감지를 위해 지연 실행 (지연 시간 단축)
  const handleImageClick = () => {
    console.log(
      "[PostCard] 이미지 클릭, 기존 타임아웃:",
      singleClickTimeoutRef.current,
    );

    // 기존 타임아웃이 있으면 취소하고 더블탭 처리
    if (singleClickTimeoutRef.current) {
      console.log("[PostCard] 기존 타임아웃 취소 (더블탭 감지)");
      clearTimeout(singleClickTimeoutRef.current);
      singleClickTimeoutRef.current = null;

      // 더블탭 처리 (좋아요 토글)
      console.log("[PostCard] 더블탭으로 좋아요 토글 실행");
      console.log("[PostCard] 현재 좋아요 상태:", isLiked);

      // 좋아요 토글 실행
      handleLikeClick();

      // 좋아요가 활성화되는 경우에만 큰 하트 애니메이션 표시
      if (!isLiked) {
        console.log("[PostCard] 하트 애니메이션 표시");
        setShowDoubleTapHeart(true);
        setTimeout(() => setShowDoubleTapHeart(false), 1000);
      }

      return; // 더블탭이므로 싱글 클릭 취소
    }

    console.log("[PostCard] 싱글 클릭 타임아웃 설정");
    // 싱글 클릭은 약간 지연 후 실행 (더블탭 감지 시간 동안 대기)
    // 지연 시간을 300ms에서 150ms로 단축하여 더 빠른 반응성 제공
    singleClickTimeoutRef.current = setTimeout(() => {
      console.log("[PostCard] 싱글 클릭 실행");
      singleClickTimeoutRef.current = null;
      // Desktop (1024px+)에서는 모달, Mobile에서는 페이지 이동
      // 클라이언트에서만 window 체크
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        console.log("[PostCard] Desktop - 모달 열기");
        setIsModalOpen(true);
      } else {
        console.log("[PostCard] Mobile - 페이지 이동");
        router.push(`/post/${id}`);
      }
    }, 150); // 더블탭 감지 시간을 150ms로 단축 (더 빠른 반응)
  };

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
          console.groupEnd();
          return; // 성공으로 처리하고 함수 종료
        } else {
          // 다른 에러는 상태 되돌리기
          throw new Error(error.error || "Failed to toggle like");
        }
      }

      // response.ok가 true일 때만 데이터 읽기
      // DELETE의 경우 빈 응답일 수 있으므로 처리
      try {
        const data = await response.json();
        console.log("Like toggle success:", data);
      } catch (e) {
        // JSON 파싱 실패 시 (빈 응답 등) 무시
        console.log("Like toggle success (no response body)");
      }
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
  const handleImageDoubleTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[PostCard] 더블탭 이벤트 발생");

    // 싱글 클릭 타임아웃 취소
    if (singleClickTimeoutRef.current) {
      console.log("[PostCard] 더블탭으로 인한 싱글 클릭 타임아웃 취소");
      clearTimeout(singleClickTimeoutRef.current);
      singleClickTimeoutRef.current = null;
    }

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // 더블탭 감지 - 항상 좋아요 토글
      console.log("[PostCard] 더블탭 확인 - 좋아요 토글 실행");
      console.log("[PostCard] 현재 좋아요 상태:", isLiked);

      // 좋아요 상태와 관계없이 항상 토글
      const willBeLiked = !isLiked;
      console.log("[PostCard] 토글 후 좋아요 상태:", willBeLiked);

      // 좋아요가 활성화되는 경우에만 큰 하트 애니메이션 표시
      if (!isLiked) {
        console.log("[PostCard] 하트 애니메이션 표시");
        setShowDoubleTapHeart(true);
        setTimeout(() => setShowDoubleTapHeart(false), 1000);
      }

      // 좋아요 토글 실행 (상태 업데이트를 위해)
      handleLikeClick();

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
            <span
              className="text-xs text-[var(--text-secondary)]"
              suppressHydrationWarning
            >
              {mounted ? timeAgo : "방금 전"}
            </span>
          </div>
        </div>

        {/* 메뉴 버튼 */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-[var(--text-primary)]" />
          </button>

          {/* 메뉴 (본인 게시물만) */}
          {openMenu && isOwnPost && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpenMenu(false)}
              />
              <div className="absolute right-0 top-10 bg-white border border-[var(--instagram-border)] rounded-lg shadow-lg z-20 min-w-[120px]">
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(false);
                    setIsEditModalOpen(true);
                  }}
                  className="w-full px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>수정</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                  className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-t border-[var(--instagram-border)]"
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
      </header>

      {/* 이미지 영역 (1:1 정사각형) */}
      <div
        ref={imageRef}
        className="relative w-full aspect-square bg-gray-100 cursor-pointer"
        onDoubleClick={handleImageDoubleTap}
        onClick={handleImageClick}
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
              } ${isAnimating ? "scale-[1.3]" : "scale-100"}`}
            />
          </button>

          {/* 댓글 버튼 */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log(
                "[PostCard] 댓글 버튼 클릭, 현재 showCommentForm:",
                showCommentForm,
              );

              // 댓글 폼 토글
              if (!showCommentForm) {
                console.log("[PostCard] 댓글 폼 표시");
                setShowCommentForm(true);
                // 댓글 입력창에 포커스
                setTimeout(() => {
                  commentFormInputRef.current?.focus();
                }, 100);
              } else {
                console.log("[PostCard] 댓글 폼 닫기");
                // 댓글 폼이 이미 보이면 닫기
                setShowCommentForm(false);
              }
            }}
            className="p-2 hover:opacity-70 transition-opacity"
          >
            <MessageCircle className="w-6 h-6 text-[var(--text-primary)]" />
          </button>

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
          onCommentDeleted={(commentId) => {
            console.log("[PostCard] Comment deleted:", commentId);

            // 댓글 목록에서 제거
            setComments((prev) => prev.filter((c) => c.id !== commentId));

            // 댓글 수 감소
            setCommentsCount((prev) => Math.max(0, prev - 1));
          }}
        />
      </div>

      {/* 댓글 작성 폼 (댓글 아이콘 클릭 시에만 표시) */}
      {showCommentForm && (
        <div className="border-t border-[var(--instagram-border)]">
          <CommentForm
            ref={commentFormInputRef}
            postId={id}
            onCommentAdded={(newComment) => {
              console.log("[PostCard] New comment added:", newComment.id);

              // 댓글 목록에 추가 (최신순으로 정렬)
              setComments((prev) => [newComment, ...prev].slice(0, 2));

              // 댓글 수 증가
              setCommentsCount((prev) => prev + 1);

              // 댓글 작성 후 폼 숨기기 (선택사항)
              // setShowCommentForm(false);
            }}
          />
        </div>
      )}

      {/* 게시물 상세 모달 (Desktop) */}
      <PostModal
        postId={id}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        focusComment={true}
      />

      {/* 게시물 수정 모달 */}
      <EditPostModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        postId={id}
        initialCaption={currentCaption}
        onSuccess={() => {
          // 수정 성공 후 피드 새로고침 (페이지 리로드)
          console.log("[PostCard] Post updated, refreshing page...");
          window.location.reload();
        }}
      />
    </article>
  );
}
