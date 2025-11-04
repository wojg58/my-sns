"use client";

import { useEffect, useState } from "react";
import { PostCard, PostCardProps } from "./PostCard";
import { PostCardSkeleton } from "./PostCardSkeleton";

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
 */

interface PostFeedResponse {
  posts: PostCardProps[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export function PostFeed() {
  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.group("[PostFeed] Fetching posts");
        setLoading(true);
        setError(null);

        const response = await fetch("/api/posts?page=1&limit=10");
        
        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }

        const data: PostFeedResponse = await response.json();
        console.log("Fetched posts:", data.posts.length);
        setPosts(data.posts);
        console.groupEnd();
      } catch (err) {
        console.error("[PostFeed] Error:", err);
        setError(err instanceof Error ? err.message : "게시물을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
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
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} {...post} />
      ))}
    </div>
  );
}

