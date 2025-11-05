"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { CommentForm } from "@/components/comment/CommentForm";
import { CommentList } from "@/components/comment/CommentList";
import { useUser } from "@clerk/nextjs";
import type { PostWithRelations, CommentWithUser } from "@/lib/types";

/**
 * @file components/post/PostDetailClient.tsx
 * @description 게시물 상세 클라이언트 컴포넌트
 *
 * Mobile에서 게시물 상세를 전체 페이지로 표시하는 컴포넌트입니다.
 * Desktop에서는 PostModal을 사용합니다.
 *
 * @dependencies
 * - @/components/comment/CommentList: 댓글 목록
 * - @/components/comment/CommentForm: 댓글 작성 폼
 * - @clerk/nextjs: 사용자 인증
 */

interface PostDetailClientProps {
  postId: string;
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

export function PostDetailClient({ postId }: PostDetailClientProps) {
  const router = useRouter();
  const { user } = useUser();
  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [timeAgo, setTimeAgo] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // 게시물 데이터 로드
  useEffect(() => {
    fetchPostDetail();
  }, [postId]);

  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // 시간 표시 업데이트
  useEffect(() => {
    if (post) {
      setTimeAgo(formatTimeAgo(post.createdAt));
      const interval = setInterval(() => {
        setTimeAgo(formatTimeAgo(post.createdAt));
      }, 60000); // 1분마다 업데이트

      return () => clearInterval(interval);
    }
  }, [post]);

  const fetchPostDetail = async () => {
    try {
      console.group("[PostDetailClient] Fetching post detail");
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/posts/${postId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("게시물을 찾을 수 없습니다.");
          return;
        }
        throw new Error("게시물을 불러오는데 실패했습니다.");
      }

      const data: PostWithRelations = await response.json();
      console.log("Post detail fetched:", data.id);
      console.groupEnd();

      setPost(data);
      setIsLiked(data.isLiked || false);
      setLikesCount(data.stats.likesCount);
      setCommentsCount(data.stats.commentsCount);
      setComments(data.recentComments || []);
    } catch (err) {
      console.error("[PostDetailClient] Fetch error:", err);
      setError(err instanceof Error ? err.message : "게시물을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 좋아요 토글
  const handleLikeClick = async () => {
    const newIsLiked = !isLiked;

    // 낙관적 UI 업데이트
    setIsLiked(newIsLiked);
    setLikesCount((prev) => (newIsLiked ? prev + 1 : Math.max(0, prev - 1)));
    setIsAnimating(true);

    try {
      console.group("[PostDetailClient] Like toggle");
      console.log("Post ID:", postId, "Is liked:", newIsLiked);

      const response = await fetch("/api/likes", {
        method: newIsLiked ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        const error = await response.json();

        if (response.status === 409 && error.alreadyLiked) {
          console.log("Already liked, keeping optimistic update");
          console.groupEnd();
          return;
        } else {
          throw new Error(error.error || "Failed to toggle like");
        }
      }

      try {
        const data = await response.json();
        console.log("Like toggle success:", data);
      } catch (e) {
        console.log("Like toggle success (no response body)");
      }
      console.groupEnd();
    } catch (error) {
      console.error("[PostDetailClient] Like toggle error:", error);
      setIsLiked(!newIsLiked);
      setLikesCount((prev) => (!newIsLiked ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setTimeout(() => setIsAnimating(false), 150);
    }
  };

  // 게시물 삭제
  const handleDeletePost = async () => {
    if (!post) return;
    if (!confirm("정말 이 게시물을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    setOpenMenu(false);

    try {
      console.group("[PostDetailClient] Deleting post");
      console.log("Post ID:", postId);

      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "게시물 삭제에 실패했습니다.");
      }

      console.log("Post deleted successfully");
      console.groupEnd();

      // 삭제 성공 시 홈으로 리다이렉트
      router.push("/");
    } catch (err) {
      console.error("[PostDetailClient] Delete error:", err);
      alert(err instanceof Error ? err.message : "게시물 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  // 댓글 추가 콜백
  const handleCommentAdded = (comment: CommentWithUser) => {
    setComments((prev) => [...prev, comment]);
    setCommentsCount((prev) => prev + 1);
  };

  // 댓글 삭제 콜백
  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentsCount((prev) => Math.max(0, prev - 1));
    fetchPostDetail();
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--instagram-background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--instagram-blue)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !post) {
    return (
      <div className="min-h-screen bg-[var(--instagram-background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">오류 발생</p>
          <p className="text-sm text-[var(--text-secondary)] mb-4">{error || "게시물을 찾을 수 없습니다."}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-[var(--instagram-blue)] text-white rounded-lg"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  const isOwnPost = user?.id === post.user.clerkId;

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-[var(--instagram-border)] flex items-center justify-between px-4 py-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-[var(--text-primary)]" />
        </button>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">게시물</h1>
        <div className="relative">
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-6 h-6 text-[var(--text-primary)]" />
          </button>

          {/* 삭제 메뉴 (본인 게시물만) */}
          {openMenu && isOwnPost && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpenMenu(false)}
              />
              <div className="absolute right-0 top-10 bg-white border border-[var(--instagram-border)] rounded-lg shadow-lg z-20 min-w-[120px]">
                <button
                  type="button"
                  onClick={handleDeletePost}
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
      </div>

      {/* 게시물 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--instagram-border)]">
        <div className="flex items-center gap-3">
          <Link
            href={`/profile/${post.user.clerkId}`}
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden"
          >
            {post.user.name.charAt(0).toUpperCase()}
          </Link>
          <div className="flex flex-col">
            <Link
              href={`/profile/${post.user.clerkId}`}
              className="text-sm font-semibold text-[var(--text-primary)] hover:opacity-70"
            >
              {post.user.name}
            </Link>
            <span className="text-xs text-[var(--text-secondary)]" suppressHydrationWarning>
              {mounted ? timeAgo : "방금 전"}
            </span>
          </div>
        </div>
      </div>

      {/* 이미지 영역 */}
      <div ref={imageRef} className="relative w-full aspect-square bg-gray-100">
        <img
          src={post.imageUrl}
          alt={post.caption || "게시물 이미지"}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLikeClick}
            className="transition-transform active:scale-110"
            disabled={isAnimating}
          >
            <Heart
              className={`w-6 h-6 ${
                isLiked
                  ? "fill-[var(--like)] text-[var(--like)]"
                  : "text-[var(--text-primary)]"
              } ${isAnimating ? "scale-125" : ""} transition-all`}
            />
          </button>
          <button className="text-[var(--text-primary)]">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="text-[var(--text-primary)]">
            <Send className="w-6 h-6" />
          </button>
        </div>
        <button className="text-[var(--text-primary)]">
          <Bookmark className="w-6 h-6" />
        </button>
      </div>

      {/* 좋아요 수 */}
      {likesCount > 0 && (
        <div className="px-4 pb-2">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            좋아요 {likesCount.toLocaleString()}개
          </p>
        </div>
      )}

      {/* 캡션 */}
      {post.caption && (
        <div className="px-4 pb-2 text-sm text-[var(--text-primary)]">
          <Link
            href={`/profile/${post.user.clerkId}`}
            className="font-semibold hover:opacity-70 mr-1"
          >
            {post.user.name}
          </Link>
          <span>{post.caption}</span>
        </div>
      )}

      {/* 댓글 목록 */}
      <div className="px-4 py-2">
        <CommentList
          comments={comments}
          totalCount={commentsCount}
          showAllLink={false}
          maxPreview={999}
          onCommentDeleted={handleCommentDeleted}
        />
      </div>

      {/* 댓글 작성 폼 */}
      <div className="sticky bottom-0 bg-white border-t border-[var(--instagram-border)]">
        <CommentForm
          postId={postId}
          onCommentAdded={handleCommentAdded}
          placeholder="댓글 달기..."
        />
      </div>
    </div>
  );
}

