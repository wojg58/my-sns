import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import type { FollowResponse, Follow } from "@/lib/types";

/**
 * @file app/api/follows/route.ts
 * @description 팔로우 API
 *
 * POST /api/follows - 팔로우 추가
 * DELETE /api/follows - 팔로우 제거
 *
 * 요청 본문: { followingId: string } (팔로우할 사용자의 user_id)
 *
 * @dependencies
 * - @/lib/supabase/server: 서버 사이드 Supabase 클라이언트
 * - @clerk/nextjs/server: Clerk 인증
 */

export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/follows");

    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json(
        { error: "followingId is required" },
        { status: 400 },
      );
    }

    console.log("Follow request:", { followingId, userId });

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

    // 자기 자신 팔로우 방지
    if (currentUser.id === followingId) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 },
      );
    }

    // 팔로우할 사용자 존재 확인
    const { data: followingUser, error: followingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", followingId)
      .single();

    if (followingUserError || !followingUser) {
      console.error("Following user not found:", followingUserError);
      return NextResponse.json(
        { error: "User to follow not found" },
        { status: 404 },
      );
    }

    // 팔로우 추가 (중복 방지는 UNIQUE 제약조건으로 처리)
    const { data, error } = await supabase
      .from("follows")
      .insert({
        follower_id: currentUser.id,
        following_id: followingId,
      })
      .select()
      .single();

    if (error) {
      // 중복 팔로우인 경우 (UNIQUE 제약조건 위반)
      if (error.code === "23505") {
        console.log("Already following");
        return NextResponse.json(
          { error: "Already following", alreadyFollowing: true },
          { status: 409 },
        );
      }

      console.error("Follow error:", error);
      return NextResponse.json(
        { error: "Failed to follow user", details: error.message },
        { status: 500 },
      );
    }

    const follow: Follow = {
      id: data.id,
      followerId: data.follower_id,
      followingId: data.following_id,
      createdAt: data.created_at,
    };

    console.log("Follow added successfully");
    console.groupEnd();

    const response: FollowResponse = {
      success: true,
      follow,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] POST /api/follows error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.group("[API] DELETE /api/follows");

    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json(
        { error: "followingId is required" },
        { status: 400 },
      );
    }

    console.log("Unfollow request:", { followingId, userId });

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

    // 팔로우 제거
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUser.id)
      .eq("following_id", followingId);

    if (error) {
      console.error("Unfollow error:", error);
      return NextResponse.json(
        { error: "Failed to unfollow user", details: error.message },
        { status: 500 },
      );
    }

    console.log("Follow removed successfully");
    console.groupEnd();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[API] DELETE /api/follows error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
