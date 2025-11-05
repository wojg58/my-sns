"use client";

import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { PostModal } from "@/components/post/PostModal";
import type { PostsResponse, PostWithRelations } from "@/lib/types";

/**
 * @file components/profile/PostGrid.tsx
 * @description 프로필 페이지 게시물 그리드 컴포넌트
 *
 * Instagram 스타일의 3열 그리드 레이아웃으로 게시물 썸네일을 표시합니다:
 * - 3열 고정 그리드 (반응형)
 * - 1:1 정사각형 썸네일
 * - Hover 시 좋아요/댓글 수 오버레이
 * - 클릭 시 게시물 상세 페이지로 이동
 *
 * @dependencies
 * - @/lib/types: 타입 정의
 * - lucide-react: 아이콘
 * - next/link: 네비게이션
 */

interface PostGridProps {
  userId: string;
}

export function PostGrid({ userId }: PostGridProps) {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.group("[PostGrid] Fetching posts for user", userId);
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/posts?userId=${userId}&limit=100`);

        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }

        const data: PostsResponse = await response.json();
        console.log("Fetched posts:", data.posts.length);
        console.groupEnd();

        setPosts(data.posts);
      } catch (err) {
        console.error("[PostGrid] Error:", err);
        setError(err instanceof Error ? err.message : "게시물을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [userId]);

  // 로딩 상태
  if (loading) {
    return (
      <div className="bg-white border border-[var(--instagram-border)] rounded-sm">
        <div className="grid grid-cols-3 gap-1">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-white border border-[var(--instagram-border)] rounded-sm p-8 text-center">
        <p className="text-red-600 font-semibold">오류 발생</p>
        <p className="text-sm text-[var(--text-secondary)] mt-2">{error}</p>
      </div>
    );
  }

  // 빈 상태
  if (posts.length === 0) {
    return (
      <div className="bg-white border border-[var(--instagram-border)] rounded-sm p-8 text-center">
        <p className="text-[var(--text-secondary)]">게시물이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[var(--instagram-border)] rounded-sm">
      {/* 3열 그리드 레이아웃 (모바일/태블릿/데스크탑 모두 3열 고정) */}
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => (
          <PostThumbnail key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

/**
 * 개별 게시물 썸네일 컴포넌트
 */
function PostThumbnail({ post }: { post: PostWithRelations }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Desktop (1024px+)에서는 모달, Mobile에서는 페이지 이동
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsModalOpen(true);
    } else {
      if (typeof window !== "undefined") {
        window.location.href = `/post/${post.id}`;
      }
    }
  };

  return (
    <>
      <div
        className="relative aspect-square bg-gray-100 group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <img
          src={post.imageUrl}
          alt={post.caption || "게시물 이미지"}
          className="w-full h-full object-cover"
        />

        {/* Hover 오버레이 */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-6 text-white pointer-events-none">
            <div className="flex items-center gap-1.5">
              <Heart className="w-5 h-5 fill-white" />
              <span className="font-semibold">{post.stats.likesCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-5 h-5 fill-white" />
              <span className="font-semibold">{post.stats.commentsCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* 게시물 상세 모달 (Desktop) */}
      <PostModal
        postId={post.id}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}

