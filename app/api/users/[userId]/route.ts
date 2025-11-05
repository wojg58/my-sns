import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import type { User, UserStats } from "@/lib/types";

/**
 * @file app/api/users/[userId]/route.ts
 * @description 사용자 정보 조회 API
 *
 * GET /api/users/[userId]
 * - 사용자 정보 조회
 * - 통계 정보 (user_stats 뷰 활용)
 * - 현재 사용자와의 팔로우 관계 확인
 *
 * @dependencies
 * - @/lib/supabase/server: 서버 사이드 Supabase 클라이언트
 * - @clerk/nextjs/server: Clerk 인증
 */

interface UserResponse {
  user: User;
  stats: UserStats;
  isFollowing?: boolean; // 현재 사용자가 이 사용자를 팔로우하는지 여부
  isOwnProfile?: boolean; // 본인 프로필인지 여부
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    console.group("[API] GET /api/users/[userId]");

    // 파라미터 파싱 (Clerk ID로만 조회)
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "userId (clerkId) is required" },
        { status: 400 },
      );
    }

    console.log("User request (Clerk ID):", userId);

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 현재 사용자 확인 (선택사항)
    const { userId: currentClerkUserId } = await auth();
    let currentUserId: string | null = null;
    let isOwnProfile = false;

    if (currentClerkUserId) {
      const { data: currentUser } = await supabase
        .from("users")
        .select("id, clerk_id")
        .eq("clerk_id", currentClerkUserId)
        .single();

      if (currentUser) {
        currentUserId = currentUser.id;
      }
    }

    // 사용자 조회 (Clerk ID로만 조회)
    const userQuery = supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("clerk_id", userId)
      .limit(1);

    const { data: user, error: userError } = await userQuery.single();

    if (userError || !user) {
      console.error("User not found:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 본인 프로필 확인
    if (currentUserId && user.id === currentUserId) {
      isOwnProfile = true;
    }

    // 사용자 통계 조회 (user_stats 뷰)
    const { data: stats, error: statsError } = await supabase
      .from("user_stats")
      .select("posts_count, followers_count, following_count")
      .eq("user_id", user.id)
      .single();

    if (statsError) {
      console.error("Stats fetch error:", statsError);
    }

    // 팔로우 관계 확인 (로그인한 경우에만)
    let isFollowing = false;
    if (currentUserId && !isOwnProfile) {
      const { data: follow } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", user.id)
        .single();

      isFollowing = !!follow;
    }

    const userResponse: UserResponse = {
      user: {
        id: user.id,
        clerkId: user.clerk_id,
        name: user.name,
        createdAt: user.created_at,
      },
      stats: {
        postsCount: stats?.posts_count || 0,
        followersCount: stats?.followers_count || 0,
        followingCount: stats?.following_count || 0,
      },
      isFollowing,
      isOwnProfile,
    };

    console.log("User fetched successfully:", user.id);
    console.groupEnd();

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error("[API] GET /api/users/[userId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
