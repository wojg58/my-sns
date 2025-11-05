import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { auth } from "@clerk/nextjs/server";
import type { PostWithRelations, CommentWithUser } from "@/lib/types";

/**
 * @file app/api/posts/[postId]/route.ts
 * @description 게시물 상세 API
 *
 * GET /api/posts/[postId]
 * - 게시물 상세 정보 조회
 * - 전체 댓글 목록 포함
 * - 현재 사용자의 좋아요 여부 확인
 *
 * PUT /api/posts/[postId]
 * - 게시물 수정 (본인만)
 * - 캡션 수정 가능
 *
 * DELETE /api/posts/[postId]
 * - 게시물 삭제 (본인만)
 * - Supabase Storage에서 이미지 파일 삭제
 *
 * @dependencies
 * - @/lib/supabase/server: 서버 사이드 Supabase 클라이언트
 * - @/lib/supabase/service-role: Service Role 클라이언트 (Storage 삭제용)
 * - @clerk/nextjs/server: Clerk 인증
 */

/**
 * 게시물 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    console.group("[API] GET /api/posts/[postId]");
    const { postId } = await params;
    console.log("Post ID:", postId);

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 현재 사용자 ID 확인 (선택사항)
    const { userId: currentClerkUserId } = await auth();
    console.log("Current user ID:", currentClerkUserId || "not logged in");

    // 게시물 조회 (posts + users 조인)
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select(
        `
        id,
        image_url,
        caption,
        created_at,
        updated_at,
        user_id,
        users!inner (
          id,
          clerk_id,
          name,
          created_at
        )
      `,
      )
      .eq("id", postId)
      .single();

    if (postError || !post) {
      console.error("Post not found:", postError);
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 사용자 정보 추출
    const postUser = Array.isArray((post as any).users)
      ? (post as any).users[0]
      : (post as any).users;

    // 게시물 통계 조회 (post_stats 뷰)
    const { data: stats, error: statsError } = await supabase
      .from("post_stats")
      .select("likes_count, comments_count")
      .eq("post_id", postId)
      .single();

    if (statsError) {
      console.error("Stats fetch error:", statsError);
    }

    // 현재 사용자의 좋아요 여부 확인
    let isLiked = false;
    if (currentClerkUserId) {
      const { data: currentUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", currentClerkUserId)
        .single();

      if (currentUser) {
        const { data: like } = await supabase
          .from("likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", currentUser.id)
          .single();

        isLiked = !!like;
      }
    }

    // 전체 댓글 목록 조회 (시간 역순)
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select(
        `
        id,
        post_id,
        content,
        created_at,
        updated_at,
        user_id,
        users!inner (
          id,
          clerk_id,
          name,
          created_at
        )
      `,
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true }); // 오래된 순서부터

    if (commentsError) {
      console.error("Comments fetch error:", commentsError);
    }

    // 댓글 데이터 변환
    const commentsWithUsers: CommentWithUser[] =
      comments?.map((comment: any) => {
        const user = Array.isArray(comment.users)
          ? comment.users[0]
          : comment.users;
        return {
          id: comment.id,
          postId: comment.post_id,
          userId: comment.user_id,
          content: comment.content,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at || comment.created_at,
          user: {
            id: user?.id || "",
            clerkId: user?.clerk_id || "",
            name: user?.name || "",
            createdAt: user?.created_at || comment.created_at,
          },
        };
      }) || [];

    const postWithRelations: PostWithRelations = {
      id: post.id,
      imageUrl: post.image_url,
      caption: post.caption,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      userId: post.user_id,
      user: {
        id: postUser?.id || "",
        clerkId: postUser?.clerk_id || "",
        name: postUser?.name || "",
        createdAt: post.created_at,
      },
      stats: {
        likesCount: stats?.likes_count || 0,
        commentsCount: stats?.comments_count || 0,
      },
      isLiked,
      recentComments: commentsWithUsers, // 전체 댓글을 recentComments에 포함
    };

    console.log("Post fetched successfully:", postId);
    console.log("Comments count:", commentsWithUsers.length);
    console.groupEnd();

    return NextResponse.json(postWithRelations);
  } catch (error) {
    console.error("[API] GET /api/posts/[postId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * 게시물 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    console.group("[API] PUT /api/posts/[postId]");

    // 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    console.log("Update post request:", { postId, clerkUserId });

    // 요청 본문 파싱
    const body = await request.json();
    const { caption } = body;

    // 캡션 검증
    if (caption !== undefined && caption !== null) {
      const captionText = typeof caption === "string" ? caption.trim() : "";
      if (captionText.length > 2200) {
        return NextResponse.json(
          { error: "Caption must be less than 2200 characters" },
          { status: 400 },
        );
      }
    }

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 user_id 찾기
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !currentUser) {
      console.error("User not found:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 게시물 조회 및 권한 확인
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, caption")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      console.error("Post not found:", postError);
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 권한 확인: 본인 게시물만 수정 가능
    if (post.user_id !== currentUser.id) {
      console.error("Unauthorized: Not the post owner");
      return NextResponse.json(
        { error: "Unauthorized: Only the post owner can edit" },
        { status: 403 },
      );
    }

    // 업데이트할 데이터 준비
    const updateData: { caption?: string | null; updated_at?: string } = {
      updated_at: new Date().toISOString(),
    };

    if (caption !== undefined) {
      updateData.caption = caption === "" ? null : caption.trim();
    }

    // 게시물 업데이트
    const { data: updatedPost, error: updateError } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", postId)
      .eq("user_id", currentUser.id)
      .select()
      .single();

    if (updateError) {
      console.error("Post update error:", updateError);
      return NextResponse.json(
        {
          error: "Failed to update post",
          details: updateError.message,
        },
        { status: 500 },
      );
    }

    console.log("Post updated successfully:", postId);
    console.log("Updated caption:", updateData.caption);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    console.error("[API] PUT /api/posts/[postId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * 게시물 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    console.group("[API] DELETE /api/posts/[postId]");

    // 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    console.log("Delete post request:", { postId, clerkUserId });

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 user_id 찾기
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !currentUser) {
      console.error("User not found:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 게시물 조회 및 권한 확인
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, image_url")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      console.error("Post not found:", postError);
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 권한 확인: 본인 게시물만 삭제 가능
    if (post.user_id !== currentUser.id) {
      console.error("Unauthorized: Not the post owner");
      return NextResponse.json(
        { error: "Unauthorized: Only the post owner can delete" },
        { status: 403 },
      );
    }

    // 이미지 URL에서 파일 경로 추출
    // image_url 형식: https://...supabase.co/storage/v1/object/public/uploads/{clerk_id}/{filename}
    // 또는: https://...supabase.co/storage/v1/object/public/uploads/{path}
    let filePath: string | null = null;
    if (post.image_url) {
      try {
        const url = new URL(post.image_url);
        // /storage/v1/object/public/uploads/... 경로에서 uploads/ 이후 부분 추출
        const pathMatch = url.pathname.match(/\/uploads\/(.+)$/);
        if (pathMatch) {
          filePath = pathMatch[1];
        }
      } catch (e) {
        console.warn("Failed to parse image URL:", e);
      }
    }

    // Service Role 클라이언트로 Storage에서 파일 삭제
    if (filePath) {
      const serviceRoleClient = getServiceRoleClient();
      const storageBucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "uploads";

      console.log("Deleting file from storage:", { filePath, bucket: storageBucket });

      const { error: deleteError } = await serviceRoleClient.storage
        .from(storageBucket)
        .remove([filePath]);

      if (deleteError) {
        console.error("Storage delete error:", deleteError);
        // Storage 삭제 실패해도 게시물은 삭제 진행 (이미지가 없을 수도 있음)
      } else {
        console.log("File deleted from storage successfully");
      }
    }

    // 게시물 삭제 (CASCADE로 관련된 likes, comments도 자동 삭제됨)
    const { error: deletePostError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", currentUser.id);

    if (deletePostError) {
      console.error("Post delete error:", deletePostError);
      return NextResponse.json(
        {
          error: "Failed to delete post",
          details: deletePostError.message,
        },
        { status: 500 },
      );
    }

    console.log("Post deleted successfully:", postId);
    console.groupEnd();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[API] DELETE /api/posts/[postId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

