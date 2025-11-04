import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

/**
 * @file app/api/comments/[commentId]/route.ts
 * @description 댓글 삭제 API
 *
 * DELETE /api/comments/[commentId] - 댓글 삭제 (본인만)
 *
 * @dependencies
 * - @/lib/supabase/server: 서버 사이드 Supabase 클라이언트
 * - @clerk/nextjs/server: Clerk 인증
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    console.group("[API] DELETE /api/comments/[commentId]");

    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 파라미터 파싱
    const { commentId } = await params;

    if (!commentId) {
      return NextResponse.json(
        { error: "commentId is required" },
        { status: 400 },
      );
    }

    console.log("Delete comment request:", { commentId, userId });

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 user_id 찾기
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !currentUser) {
      console.error("User not found:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 댓글 조회 및 권한 확인
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("id, user_id")
      .eq("id", commentId)
      .single();

    if (commentError || !comment) {
      console.error("Comment not found:", commentError);
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // 권한 확인: 본인 댓글만 삭제 가능
    if (comment.user_id !== currentUser.id) {
      console.log("Unauthorized delete attempt:", {
        commentUserId: comment.user_id,
        currentUserId: currentUser.id,
      });
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own comments" },
        { status: 403 },
      );
    }

    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      console.error("Comment deletion error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete comment", details: deleteError.message },
        { status: 500 },
      );
    }

    console.log("Comment deleted successfully:", commentId);
    console.groupEnd();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[API] DELETE /api/comments/[commentId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
