import { notFound } from "next/navigation";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { PostDetailClient } from "@/components/post/PostDetailClient";
import type { PostWithRelations } from "@/lib/types";

/**
 * @file app/(main)/post/[postId]/page.tsx
 * @description 게시물 상세 페이지 (Mobile)
 *
 * 모바일 화면에서 게시물 상세를 전체 페이지로 표시합니다.
 * Desktop에서는 모달을 사용하므로 이 페이지는 주로 Mobile에서 사용됩니다.
 *
 * @dependencies
 * - @/components/post/PostDetailClient: 게시물 상세 클라이언트 컴포넌트
 */

interface PostDetailResponse {
  post: PostWithRelations;
}

async function fetchPostDetail(postId: string): Promise<PostDetailResponse> {
  console.group("[PostDetailPage] 게시물 상세 데이터 로드");
  console.log("게시물 ID:", postId);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/posts/${postId}`, {
      cache: "no-store", // 항상 최신 데이터 가져오기
    });

    if (!response.ok) {
      console.error("게시물 상세 조회 실패:", response.status, response.statusText);
      notFound();
    }

    const data: PostDetailResponse = await response.json();
    console.log("게시물 상세 데이터 로드 성공:", data.post.id);
    console.groupEnd();
    return data;
  } catch (error) {
    console.error("[PostDetailPage] 게시물 상세 로드 에러:", error);
    console.groupEnd();
    notFound();
  }
}

export default async function PostDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ focusComment?: string }>;
}) {
  const { postId } = await params;
  const { focusComment } = await searchParams;
  const { post } = await fetchPostDetail(postId);

  return (
    <div className="min-h-screen bg-[var(--instagram-background)]">
      <div className="max-w-[935px] mx-auto pt-4 md:pt-8 lg:pt-12 pb-4 md:pb-8 lg:pb-12">
        <PostDetailClient
          postId={postId}
          initialPost={post}
          isModal={false}
          focusComment={focusComment === "true"}
        />
      </div>
    </div>
  );
}

