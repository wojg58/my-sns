"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PostCard, PostCardProps } from "./PostCard";
import { PostCardSkeleton } from "./PostCardSkeleton";
import { setRefreshFeedCallback } from "./CreatePostModal";
import type { PostsResponse } from "@/lib/types";

/**
 * @file components/post/PostFeed.tsx
 * @description 게시물 피드 컴포넌트
 *
 * 게시물 목록을 표시하고 로딩 상태를 처리합니다.
 * 페이지네이션은 추후 무한 스크롤로 확장될 예정입니다.
 *
 * @dependencies
 * - @/components/post/PostCard: 게시물 카드 컴포넌트
 * - @/components/post/PostCardSkeleton: 로딩 스켈레톤
 * - @/lib/types: 타입 정의
 */

export function PostFeed() {
  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    try {
      console.group("[PostFeed] Fetching posts", { page: pageNum, append });
      
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`/api/posts?page=${pageNum}&limit=10`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data: PostsResponse = await response.json();
      console.log("Fetched posts:", data.posts.length, "Has more:", data.pagination.hasMore);
      
      // PostWithRelations를 PostCardProps로 변환 (isLiked가 optional이므로 기본값 설정)
      const postsAsCardProps: PostCardProps[] = data.posts.map((post) => ({
        id: post.id,
        imageUrl: post.imageUrl,
        caption: post.caption,
        createdAt: post.createdAt,
        user: post.user,
        stats: post.stats,
        isLiked: post.isLiked ?? false, // 기본값 false
        recentComments: post.recentComments,
      }));
      
      if (append) {
        setPosts((prev) => [...prev, ...postsAsCardProps]);
      } else {
        setPosts(postsAsCardProps);
      }
      
      setHasMore(data.pagination.hasMore);
      console.groupEnd();
    } catch (err) {
      console.error("[PostFeed] Error:", err);
      setError(err instanceof Error ? err.message : "게시물을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // 초기 로드 및 새로고침
  const refreshFeed = useCallback(() => {
    setPage(1);
    setHasMore(true);
    fetchPosts(1, false);
  }, [fetchPosts]);

  useEffect(() => {
    refreshFeed();
    
    // CreatePostModal에서 피드 새로고침을 위해 콜백 등록
    setRefreshFeedCallback(refreshFeed);
    
    // 컴포넌트 언마운트 시 콜백 제거
    return () => {
      setRefreshFeedCallback(null);
    };
  }, [refreshFeed]);

  // Intersection Observer로 무한 스크롤 구현
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          console.log("[PostFeed] Loading more posts, page:", nextPage);
          setPage(nextPage);
          fetchPosts(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, page, fetchPosts]);

  if (loading) {
    return (
      <div className="space-y-0 md:space-y-4">
        {[...Array(3)].map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-semibold">오류 발생</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-[var(--instagram-card)] border border-[var(--instagram-border)] rounded-lg p-8 text-center">
        <p className="text-[var(--text-secondary)]">아직 게시물이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-0 md:space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} {...post} />
        ))}
      </div>

      {/* 무한 스크롤 감지 타겟 */}
      {hasMore && (
        <div ref={observerTarget} className="h-20 flex items-center justify-center">
          {loadingMore && (
            <div className="space-y-0 md:space-y-4">
              {[...Array(2)].map((_, i) => (
                <PostCardSkeleton key={`loading-${i}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 더 이상 로드할 게시물이 없는 경우 */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-[var(--text-secondary)] text-sm">
          모든 게시물을 불러왔습니다.
        </div>
      )}
    </>
  );
}

