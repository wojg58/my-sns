import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import type { CommentResponse, CommentWithUser } from "@/lib/types";

/**
 * @file app/api/comments/route.ts
 * @description 댓글 API
 *
 * POST /api/comments - 댓글 작성
 *
 * 요청 본문: { postId: string, content: string }
 *
 * @dependencies
 * - @/lib/supabase/server: 서버 사이드 Supabase 클라이언트
 * - @clerk/nextjs/server: Clerk 인증
 */

export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/comments");

    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { postId, content } = body;

    // 입력 검증
    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 },
      );
    }

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "content is required and must be non-empty" },
        { status: 400 },
      );
    }

    // 댓글 내용 길이 제한 (예: 2,200자)
    if (content.length > 2200) {
      return NextResponse.json(
        { error: "content must be less than 2200 characters" },
        { status: 400 },
      );
    }

    console.log("Comment request:", {
      postId,
      contentLength: content.length,
      userId,
    });

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 user_id 찾기
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("clerk_id", userId)
      .single();

    if (userError || !currentUser) {
      console.error("User not found:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 게시물 존재 확인
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      console.error("Post not found:", postError);
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 댓글 추가
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: currentUser.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (commentError) {
      console.error("Comment creation error:", commentError);
      return NextResponse.json(
        { error: "Failed to create comment", details: commentError.message },
        { status: 500 },
      );
    }

    // 댓글 + 사용자 정보 조합
    const commentWithUser: CommentWithUser = {
      id: comment.id,
      postId: comment.post_id,
      userId: comment.user_id,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      user: {
        id: currentUser.id,
        clerkId: currentUser.clerk_id,
        name: currentUser.name,
        createdAt: currentUser.created_at,
      },
    };

    console.log("Comment created successfully:", comment.id);
    console.groupEnd();

    const response: CommentResponse = {
      success: true,
      comment: commentWithUser,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] POST /api/comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
