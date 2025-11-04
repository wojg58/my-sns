import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import type { PostsResponse, PostWithRelations } from "@/lib/types";

/**
 * @file app/api/posts/route.ts
 * @description 게시물 목록 조회 API
 *
 * GET /api/posts?page=1&limit=10
 * - 페이지네이션 지원 (기본: 10개씩)
 * - 시간 역순 정렬
 * - 게시물 + 사용자 정보 + 통계(좋아요 수, 댓글 수) 조인
 * - 현재 사용자의 좋아요 여부 확인
 *
 * @dependencies
 * - @/lib/supabase/server: 서버 사이드 Supabase 클라이언트
 * - @clerk/nextjs/server: Clerk 인증
 */

export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/posts");
    
    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    console.log("Query params:", { page, limit, offset });

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();
    
    // 현재 사용자 ID 확인 (선택사항 - 로그인하지 않아도 게시물 조회 가능)
    const { userId } = await auth();
    console.log("Current user ID:", userId || "not logged in");

    // 게시물 목록 조회 (posts + users + post_stats 조인)
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(`
        id,
        image_url,
        caption,
        created_at,
        updated_at,
        user_id,
        users!inner (
          id,
          clerk_id,
          name
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      console.error("Posts fetch error:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts", details: postsError.message },
        { status: 500 }
      );
    }

    console.log(`Fetched ${posts?.length || 0} posts`);

    // 각 게시물에 대한 통계 정보 가져오기 (post_stats 뷰 활용)
    const postIds = posts?.map((post) => post.id) || [];
    
    const { data: stats, error: statsError } = await supabase
      .from("post_stats")
      .select("post_id, likes_count, comments_count")
      .in("post_id", postIds);

    if (statsError) {
      console.error("Stats fetch error:", statsError);
      // 통계 조회 실패해도 게시물은 반환
    }

    // 현재 사용자의 좋아요 정보 가져오기 (로그인한 경우)
    let userLikes: string[] = [];
    if (userId && postIds.length > 0) {
      // users 테이블에서 clerk_id로 user_id 찾기
      const { data: currentUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", userId)
        .single();

      if (currentUser) {
        const { data: likes } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", currentUser.id)
          .in("post_id", postIds);

        userLikes = likes?.map((like) => like.post_id) || [];
      }
    }

    // 각 게시물의 최신 댓글 2개 가져오기
    const { data: recentComments, error: commentsError } = await supabase
      .from("comments")
      .select(`
        id,
        post_id,
        content,
        created_at,
        user_id,
        users!inner (
          id,
          name
        )
      `)
      .in("post_id", postIds)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("Comments fetch error:", commentsError);
    }

    // 데이터 조합
    const postsWithStats: PostWithRelations[] = posts?.map((post) => {
      const postStat = stats?.find((stat) => stat.post_id === post.id);
      const isLiked = userLikes.includes(post.id);
      
      // 해당 게시물의 최신 댓글 2개만 가져오기
      const postComments: PostWithRelations["recentComments"] = recentComments
        ?.filter((comment) => comment.post_id === post.id)
        .slice(0, 2)
        .map((comment) => ({
          id: comment.id,
          postId: comment.post_id,
          userId: comment.user_id,
          content: comment.content,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at,
          user: {
            id: comment.users.id,
            clerkId: comment.users.clerk_id,
            name: comment.users.name,
            createdAt: comment.users.created_at || comment.created_at,
          },
        })) || [];

      const result: PostWithRelations = {
        id: post.id,
        imageUrl: post.image_url,
        caption: post.caption,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        userId: post.user_id, // Post 타입에 userId 필드 추가 필요
        user: {
          id: post.users.id,
          clerkId: post.users.clerk_id,
          name: post.users.name,
          createdAt: post.created_at, // users.created_at 사용
        },
        stats: {
          likesCount: postStat?.likes_count || 0,
          commentsCount: postStat?.comments_count || 0,
        },
        isLiked,
        recentComments: postComments,
      };

      return result;
    }) || [];

    console.log(`Returning ${postsWithStats.length} posts with stats`);
    console.groupEnd();

    const response: PostsResponse = {
      posts: postsWithStats,
      pagination: {
        page,
        limit,
        total: postsWithStats.length,
        hasMore: postsWithStats.length === limit,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] GET /api/posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

