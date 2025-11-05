import { notFound } from "next/navigation";
import { PostDetailClient } from "@/components/post/PostDetailClient";

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

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;

  return <PostDetailClient postId={postId} />;
}

