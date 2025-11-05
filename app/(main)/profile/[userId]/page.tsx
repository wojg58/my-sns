import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { PostGrid } from "@/components/profile/PostGrid";
import type { User, UserStats } from "@/lib/types";

/**
 * @file app/(main)/profile/[userId]/page.tsx
 * @description 특정 사용자 프로필 페이지
 *
 * 사용자 프로필을 표시하는 페이지입니다:
 * - ProfileHeader 컴포넌트로 프로필 정보 표시
 * - PostGrid 컴포넌트로 게시물 그리드 표시
 *
 * @dependencies
 * - @/components/profile/ProfileHeader: 프로필 헤더 컴포넌트
 * - @/components/profile/PostGrid: 게시물 그리드 컴포넌트
 * - @/lib/types: User, UserStats 타입
 * - @/lib/supabase/server: Supabase 클라이언트
 * - @clerk/nextjs/server: 인증 확인
 */

interface UserResponse {
  user: User;
  stats: UserStats;
  isFollowing?: boolean;
  isOwnProfile?: boolean;
}

async function fetchUserProfile(userId: string): Promise<UserResponse> {
  console.group("[ProfilePage] 사용자 프로필 데이터 로드");
  console.log("사용자 ID:", userId);

  try {
    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 현재 사용자 확인
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

    // 사용자 조회 (userId가 UUID 형식이면 id로, 아니면 clerk_id로 조회)
    // UUID 형식 체크: 8-4-4-4-12 형식
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    let userQuery = supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .limit(1);
    
    if (isUUID) {
      userQuery = userQuery.eq("id", userId);
    } else {
      userQuery = userQuery.eq("clerk_id", userId);
    }
    
    const { data: user, error: userError } = await userQuery.single();

    if (userError || !user) {
      console.error("사용자를 찾을 수 없습니다:", userError);
      console.groupEnd();
      notFound();
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
      console.error("통계 조회 에러:", statsError);
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

    const response: UserResponse = {
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

    console.log("사용자 프로필 데이터:", {
      userId: response.user.id,
      name: response.user.name,
      isOwnProfile: response.isOwnProfile,
      isFollowing: response.isFollowing,
      stats: response.stats,
    });
    console.groupEnd();

    return response;
  } catch (error) {
    console.error("[ProfilePage] 사용자 프로필 로드 에러:", error);
    console.groupEnd();
    throw error;
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const profileData = await fetchUserProfile(userId);

  return (
    <div className="min-h-screen bg-[var(--instagram-background)]">
      {/* 프로필 컨테이너 */}
      <div className="max-w-[935px] mx-auto pt-4 md:pt-8 lg:pt-12 pb-4 md:pb-8 lg:pb-12">
        {/* 프로필 헤더 */}
        <div className="bg-white border border-[var(--instagram-border)] rounded-sm mb-4">
          <ProfileHeader
            user={profileData.user}
            stats={profileData.stats}
            isOwnProfile={profileData.isOwnProfile || false}
            isFollowing={profileData.isFollowing}
          />
        </div>

        {/* 게시물 그리드 */}
        <PostGrid userId={profileData.user.id} />
      </div>
    </div>
  );
}

