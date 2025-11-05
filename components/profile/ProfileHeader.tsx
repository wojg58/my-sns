"use client";

import { useState, useEffect } from "react";
import { User, UserStats } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";

/**
 * @file components/profile/ProfileHeader.tsx
 * @description 프로필 헤더 컴포넌트
 *
 * Instagram 스타일의 프로필 헤더를 표시합니다:
 * - 프로필 이미지 (150px Desktop / 90px Mobile, 원형)
 * - 사용자명
 * - 통계: 게시물 수, 팔로워 수, 팔로잉 수
 * - "팔로우" / "팔로잉" 버튼 (다른 사람 프로필일 때)
 * - "프로필 편집" 버튼 (내 프로필일 때, 1차 제외)
 *
 * @dependencies
 * - @/lib/types: User, UserStats 타입
 * - @/components/ui/button: shadcn 버튼 컴포넌트
 * - @clerk/nextjs: 사용자 정보
 */

interface ProfileHeaderProps {
  user: User;
  stats: UserStats;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function ProfileHeader({
  user,
  stats,
  isOwnProfile,
  isFollowing: initialIsFollowing = false,
  onFollowChange,
}: ProfileHeaderProps) {
  const { user: clerkUser } = useUser();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(stats.followersCount);
  const [hoverText, setHoverText] = useState<string | null>(null);

  // props가 변경될 때 상태 업데이트
  useEffect(() => {
    setIsFollowing(initialIsFollowing);
    setFollowersCount(stats.followersCount);
  }, [initialIsFollowing, stats.followersCount]);

  const handleFollow = async () => {
    if (isLoading) return;

    console.group("[ProfileHeader] 팔로우/언팔로우 처리");
    console.log("현재 상태:", { isFollowing, userId: user.id });

    setIsLoading(true);

    try {
      if (isFollowing) {
        // 언팔로우
        const response = await fetch("/api/follows", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ followingId: user.id }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("언팔로우 실패:", error);
          throw new Error(error.error || "언팔로우에 실패했습니다");
        }

        console.log("언팔로우 성공");
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        onFollowChange?.(false);
      } else {
        // 팔로우
        const response = await fetch("/api/follows", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ followingId: user.id }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("팔로우 실패:", error);
          throw new Error(error.error || "팔로우에 실패했습니다");
        }

        console.log("팔로우 성공");
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error("[ProfileHeader] 팔로우/언팔로우 에러:", error);
      alert(error instanceof Error ? error.message : "오류가 발생했습니다");
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  };

  // 프로필 이미지 URL
  // 본인 프로필일 때만 Clerk 이미지 사용, 다른 사람은 기본 아바타
  const profileImageUrl =
    isOwnProfile && clerkUser?.id === user.clerkId
      ? clerkUser?.imageUrl || null
      : null;

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8 px-4 py-6 md:px-8 md:py-12">
      {/* 프로필 이미지 */}
      <div className="flex justify-center md:justify-start">
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt={user.name}
            className="w-[90px] h-[90px] md:w-[150px] md:h-[150px] rounded-full object-cover border border-[var(--instagram-border)]"
          />
        ) : (
          <div className="w-[90px] h-[90px] md:w-[150px] md:h-[150px] rounded-full bg-gray-200 flex items-center justify-center border border-[var(--instagram-border)]">
            <UserCircle className="w-[60px] h-[60px] md:w-[100px] md:h-[100px] text-gray-400" />
          </div>
        )}
      </div>

      {/* 프로필 정보 */}
      <div className="flex-1 flex flex-col gap-4">
        {/* 사용자명 + 버튼 */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-normal text-[var(--text-primary)]">
            {user.name}
          </h1>

          {/* 버튼 영역 */}
          {!isOwnProfile && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleFollow}
                disabled={isLoading}
                onMouseEnter={() => {
                  if (isFollowing) {
                    setHoverText("언팔로우");
                  }
                }}
                onMouseLeave={() => setHoverText(null)}
                className={`
                  px-6 py-1.5 text-sm font-semibold rounded-lg transition-colors
                  ${
                    isFollowing
                      ? hoverText === "언팔로우"
                        ? "bg-white text-red-600 border border-red-600"
                        : "bg-gray-200 text-[var(--text-primary)] hover:bg-gray-300"
                      : "bg-[var(--instagram-blue)] text-white hover:bg-[#1877f2]"
                  }
                `}
              >
                {isLoading
                  ? "처리 중..."
                  : hoverText || (isFollowing ? "팔로잉" : "팔로우")}
              </Button>
            </div>
          )}
        </div>

        {/* 통계 */}
        <div className="flex items-center gap-6 md:gap-8">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-[var(--text-primary)]">
              {stats.postsCount}
            </span>
            <span className="text-[var(--text-secondary)]">게시물</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-[var(--text-primary)]">
              {followersCount}
            </span>
            <span className="text-[var(--text-secondary)]">팔로워</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-[var(--text-primary)]">
              {stats.followingCount}
            </span>
            <span className="text-[var(--text-secondary)]">팔로잉</span>
          </div>
        </div>
      </div>
    </div>
  );
}

