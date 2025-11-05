import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types";

/**
 * @file app/api/users/search/route.ts
 * @description 사용자 검색 API
 *
 * GET /api/users/search?q=검색어
 * - 사용자 이름으로 검색
 * - 대소문자 구분 없이 부분 일치 검색
 *
 * @dependencies
 * - @/lib/supabase/server: 서버 사이드 Supabase 클라이언트
 */

interface SearchUsersResponse {
  users: User[];
}

export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/users/search");

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ users: [] } as SearchUsersResponse);
    }

    console.log("Search query:", query);

    const supabase = createClerkSupabaseClient();

    // 사용자 이름으로 검색 (대소문자 구분 없이 부분 일치)
    const { data: users, error } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .ilike("name", `%${query.trim()}%`) // 대소문자 구분 없이 부분 일치
      .order("name", { ascending: true })
      .limit(20); // 최대 20명까지

    if (error) {
      console.error("Search error:", error);
      return NextResponse.json(
        { error: "Failed to search users", details: error.message },
        { status: 500 },
      );
    }

    const searchResults: User[] =
      users?.map((user) => ({
        id: user.id,
        clerkId: user.clerk_id,
        name: user.name,
        createdAt: user.created_at,
      })) || [];

    console.log(`Found ${searchResults.length} users`);
    console.groupEnd();

    return NextResponse.json({ users: searchResults } as SearchUsersResponse);
  } catch (error) {
    console.error("[API] GET /api/users/search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

