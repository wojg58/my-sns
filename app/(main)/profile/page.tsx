import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * @file app/(main)/profile/page.tsx
 * @description 현재 사용자 프로필 페이지
 *
 * `/profile` 경로로 접근하면 현재 로그인한 사용자의 프로필로 리다이렉트합니다.
 * 현재 사용자의 userId를 찾아서 `/profile/[userId]`로 이동합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: 인증 확인
 * - @/lib/supabase/server: Supabase 클라이언트
 */

export default async function ProfilePage() {
  console.group("[ProfilePage] 현재 사용자 프로필 페이지 로드");

  // 현재 사용자 확인
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    console.log("로그인하지 않은 사용자, 홈으로 리다이렉트");
    console.groupEnd();
    redirect("/");
  }

  console.log("현재 사용자 Clerk ID:", clerkUserId);

  // Supabase에서 현재 사용자의 userId 찾기
  const supabase = createClerkSupabaseClient();
  const { data: currentUser, error } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (error || !currentUser) {
    console.error("사용자 정보를 찾을 수 없습니다:", error);
    console.groupEnd();
    redirect("/");
  }

  console.log("현재 사용자 ID:", currentUser.id);
  console.log(`/profile/${currentUser.id}로 리다이렉트`);
  console.groupEnd();

  // 사용자 프로필 페이지로 리다이렉트
  redirect(`/profile/${currentUser.id}`);
}

