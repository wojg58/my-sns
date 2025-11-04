import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

/**
 * @file app/api/likes/route.ts
 * @description 좋아요 API
 *
 * POST /api/likes - 좋아요 추가
 * DELETE /api/likes - 좋아요 제거
 *
 * 요청 본문: { postId: string }
 *
 * @dependencies
 * - @/lib/supabase/server: 서버 사이드 Supabase 클라이언트
 * - @clerk/nextjs/server: Clerk 인증
 */

export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/likes");
    
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    console.log("Like request:", { postId, userId });

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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 좋아요 추가 (중복 방지는 UNIQUE 제약조건으로 처리)
    const { data, error } = await supabase
      .from("likes")
      .insert({
        post_id: postId,
        user_id: currentUser.id,
      })
      .select()
      .single();

    if (error) {
      // 중복 좋아요인 경우 (UNIQUE 제약조건 위반)
      if (error.code === "23505") {
        console.log("Already liked");
        return NextResponse.json(
          { error: "Already liked", alreadyLiked: true },
          { status: 409 }
        );
      }

      console.error("Like error:", error);
      return NextResponse.json(
        { error: "Failed to like post", details: error.message },
        { status: 500 }
      );
    }

    console.log("Like added successfully");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      like: data,
    });
  } catch (error) {
    console.error("[API] POST /api/likes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.group("[API] DELETE /api/likes");
    
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    console.log("Unlike request:", { postId, userId });

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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 좋아요 제거
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", currentUser.id);

    if (error) {
      console.error("Unlike error:", error);
      return NextResponse.json(
        { error: "Failed to unlike post", details: error.message },
        { status: 500 }
      );
    }

    console.log("Like removed successfully");
    console.groupEnd();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[API] DELETE /api/likes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

