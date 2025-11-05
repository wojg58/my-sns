"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CommentForm, type CommentFormRef } from "@/components/comment/CommentForm";
import { CommentList } from "@/components/comment/CommentList";
import { useUser } from "@clerk/nextjs";
import type { PostWithRelations, CommentWithUser } from "@/lib/types";

/**
 * @file components/post/PostModal.tsx
 * @description 게시물 상세 모달 컴포넌트 (Desktop)
 *
 * Instagram 스타일의 게시물 상세 모달입니다:
 * - 좌측 50%: 이미지 영역
 * - 우측 50%: 댓글 영역 (스크롤 가능)
 * - 닫기 버튼 (✕)
 *
 * @dependencies
 * - @/components/ui/dialog: shadcn Dialog 컴포넌트
 * - @/components/comment/CommentList: 댓글 목록
 * - @/components/comment/CommentForm: 댓글 작성 폼
 * - @clerk/nextjs: 사용자 인증
 */

interface PostModalProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  focusComment?: boolean; // 댓글 입력창에 자동 포커스할지 여부
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

export function PostModal({ postId, open, onOpenChange, focusComment = false }: PostModalProps) {
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
  const [imageHeight, setImageHeight] = useState<number>(566); // 기본 16:9 비율
  const imageRef = useRef<HTMLDivElement>(null);
  const imgElementRef = useRef<HTMLImageElement>(null);
  const commentFormRef = useRef<CommentFormRef>(null);

  // 모달이 열릴 때 게시물 데이터 로드
  useEffect(() => {
    if (open && postId) {
      fetchPostDetail();
      // 이미지 높이 초기화 (16:9 비율 기준)
      setImageHeight(608);
    }
  }, [open, postId]);

  // 이미지 로드 후 비율에 맞게 높이 조정
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    if (naturalWidth > 0 && naturalHeight > 0) {
      // 이미지 비율 계산
      // 모달 너비 1200px, 이미지 영역 60% = 720px
      // 실제로는 이미지가 컨테이너 내에서 object-contain으로 표시되므로
      // 컨테이너 높이를 이미지 비율에 맞춰 계산
      const aspectRatio = naturalHeight / naturalWidth;
      const imageContainerWidth = 720; // 모달 너비 1200px의 60%
      let calculatedHeight = imageContainerWidth * aspectRatio;
      
      // 인스타그램 데스크탑 사이즈에 맞춰 높이 조정
      // 데스크탑 모달은 가로형 레이아웃이므로 높이를 제한
      // 16:9 비율 (1080px × 608px) - 가로형 이미지
      // 4:5 비율 (1080px × 1350px) - 세로형 이미지 (하지만 모달 높이 제한)
      // 1:1 비율 (1080px × 1080px) - 정사각형 (모달 높이 제한)
      // 최소 높이: 608px (16:9 비율), 최대 높이: 90vh와 800px 중 작은 값
      // 세로형 이미지도 모달이 너무 길어지지 않도록 800px로 제한
      const maxHeight = typeof window !== "undefined" 
        ? Math.min(window.innerHeight * 0.9, 800) 
        : 800;
      const minHeight = 608;
      
      // 계산된 높이를 최소/최대 범위 내로 제한
      const finalHeight = Math.max(minHeight, Math.min(calculatedHeight, maxHeight));
      
      console.log("[PostModal] Image aspect ratio calculation:", {
        naturalWidth,
        naturalHeight,
        aspectRatio: (naturalHeight / naturalWidth).toFixed(2),
        calculatedHeight: Math.round(calculatedHeight),
        finalHeight: Math.round(finalHeight),
        maxHeight: Math.round(maxHeight),
      });
      
      setImageHeight(finalHeight);
    }
  };

  // 모달이 열리고 데이터가 로드되면 댓글 입력창에 포커스
  useEffect(() => {
    if (open && !loading && post && focusComment) {
      // 모달이 완전히 열린 후 포커스
      setTimeout(() => {
        commentFormRef.current?.focus();
      }, 300);
    }
  }, [open, loading, post, focusComment]);

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
      console.group("[PostModal] Fetching post detail");
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/posts/${postId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("게시물을 찾을 수 없습니다.");
        }
        throw new Error("게시물을 불러오는데 실패했습니다.");
      }

      const data: PostWithRelations = await response.json();
      console.log("[PostModal] Post detail fetched:", {
        postId: data.id,
        userId: data.user?.name,
        caption: data.caption?.substring(0, 50),
        commentsCount: data.stats.commentsCount,
        likesCount: data.stats.likesCount,
      });
      console.groupEnd();

      setPost(data);
      setIsLiked(data.isLiked || false);
      setLikesCount(data.stats.likesCount);
      setCommentsCount(data.stats.commentsCount);
      setComments(data.recentComments || []);
      
      console.log("[PostModal] Post state updated:", {
        post: !!data,
        comments: (data.recentComments || []).length,
      });
    } catch (err) {
      console.error("[PostModal] Fetch error:", err);
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
      console.group("[PostModal] Like toggle");
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

        // 이미 좋아요한 경우 (409)는 상태를 되돌리지 않음
        if (response.status === 409 && error.alreadyLiked) {
          console.log("Already liked, keeping optimistic update");
          console.groupEnd();
          return;
        } else {
          // 다른 에러는 상태 되돌리기
          throw new Error(error.error || "Failed to toggle like");
        }
      }

      // response.ok가 true일 때만 데이터 읽기
      try {
        const data = await response.json();
        console.log("Like toggle success:", data);
      } catch (e) {
        // JSON 파싱 실패 시 (빈 응답 등) 무시
        console.log("Like toggle success (no response body)");
      }
      console.groupEnd();
    } catch (error) {
      console.error("[PostModal] Like toggle error:", error);
      // 에러 발생 시 상태 되돌리기
      setIsLiked(!newIsLiked);
      setLikesCount((prev) => (!newIsLiked ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      // 애니메이션 종료
      setTimeout(() => setIsAnimating(false), 150);
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
    // 게시물 데이터도 새로고침하여 통계 업데이트
    fetchPostDetail();
  };

  // 게시물 삭제
  const handleDeletePost = async () => {
    if (!post) return;
    if (!confirm("정말 이 게시물을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    setOpenMenu(false);

    try {
      console.group("[PostModal] Deleting post");
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

      // 모달 닫기 및 페이지 새로고침
      onOpenChange(false);
      window.location.reload();
    } catch (err) {
      console.error("[PostModal] Delete error:", err);
      alert(err instanceof Error ? err.message : "게시물 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl w-full h-[90vh] p-0 flex">
          <DialogTitle className="sr-only">게시물 로딩 중</DialogTitle>
          <DialogDescription className="sr-only">
            게시물 정보를 불러오는 중입니다.
          </DialogDescription>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--instagram-blue)] mx-auto mb-4"></div>
              <p className="text-[var(--text-secondary)]">로딩 중...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 에러 상태
  if (error || !post) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl w-full h-[90vh] p-0 flex">
          <DialogTitle className="sr-only">오류 발생</DialogTitle>
          <DialogDescription className="sr-only">
            게시물을 불러오는 중 오류가 발생했습니다.
          </DialogDescription>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 font-semibold mb-2">오류 발생</p>
              <p className="text-sm text-[var(--text-secondary)]">{error || "게시물을 찾을 수 없습니다."}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isOwnPost = user?.id === post.user.clerkId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[1200px] w-[1200px] p-0 flex overflow-hidden bg-white border-[var(--instagram-border)]"
        style={{ 
          height: `${imageHeight}px`,
          maxHeight: '90vh',
          minHeight: '608px',
        }}
      >
        {/* 접근성을 위한 숨겨진 제목 및 설명 */}
        <DialogTitle className="sr-only">게시물 상세</DialogTitle>
        <DialogDescription className="sr-only">
          게시물 이미지와 댓글을 확인할 수 있습니다.
        </DialogDescription>
        {/* 좌측: 이미지 영역 (60% 너비, 이미지 비율에 맞는 높이) */}
        {/* 이미지가 잘리지 않도록 object-contain 사용 */}
        <div 
          className="w-[60%] bg-black relative overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ height: `${imageHeight}px` }}
        >
          <img
            ref={imgElementRef}
            src={post.imageUrl}
            alt={post.caption || "게시물 이미지"}
            className="max-w-full max-h-full w-auto h-auto object-contain"
            onLoad={handleImageLoad}
            onError={(e) => {
              console.error("[PostModal] Image load error:", post.imageUrl);
            }}
          />
        </div>

        {/* 우측: 댓글 영역 (40% 너비, 이미지와 동일한 높이) */}
        <div 
          className="w-[40%] flex flex-col bg-white overflow-hidden flex-shrink-0"
          style={{ height: `${imageHeight}px` }}
        >
          {/* 헤더 */}
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

          {/* 댓글 영역 (스크롤 가능) */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* 캡션 */}
            {post.caption && (
              <div className="text-sm">
                <span className="font-semibold text-[var(--text-primary)] mr-1">
                  {post.user.name}
                </span>
                <span className="text-[var(--text-primary)]">{post.caption}</span>
              </div>
            )}

            {/* 댓글 목록 */}
            <CommentList
              comments={comments}
              totalCount={commentsCount}
              showAllLink={false}
              maxPreview={999}
              onCommentDeleted={handleCommentDeleted}
            />
          </div>

          {/* 액션 버튼 및 좋아요 수 */}
          <div className="border-t border-[var(--instagram-border)]">
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
                <button
                  onClick={() => {
                    // 댓글 입력창으로 포커스
                    setTimeout(() => {
                      commentFormRef.current?.focus();
                    }, 100);
                  }}
                  className="text-[var(--text-primary)] hover:opacity-70 transition-opacity"
                >
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

            {/* 시간 */}
            <div className="px-4 pb-2">
              <span className="text-xs text-[var(--text-secondary)]" suppressHydrationWarning>
                {mounted ? timeAgo : "방금 전"}
              </span>
            </div>

            {/* 댓글 작성 폼 */}
            <CommentForm
              ref={commentFormRef}
              postId={postId}
              onCommentAdded={handleCommentAdded}
              placeholder="댓글 달기..."
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

