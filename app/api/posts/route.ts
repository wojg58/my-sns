import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { auth } from "@clerk/nextjs/server";
import type { PostsResponse, PostWithRelations, Post } from "@/lib/types";

/**
 * @file app/api/posts/route.ts
 * @description 게시물 API
 *
 * GET /api/posts?page=1&limit=10
 * - 페이지네이션 지원 (기본: 10개씩)
 * - 시간 역순 정렬
 * - 게시물 + 사용자 정보 + 통계(좋아요 수, 댓글 수) 조인
 * - 현재 사용자의 좋아요 여부 확인
 *
 * POST /api/posts
 * - 이미지 업로드 (Supabase Storage)
 * - 게시물 생성 (posts 테이블)
 * - 파일 검증 (타입, 크기 최대 5MB)
 * - 업로드 경로: {clerk_user_id}/{filename}
 *
 * @dependencies
 * - @/lib/supabase/server: 서버 사이드 Supabase 클라이언트
 * - @/lib/supabase/service-role: Service Role 클라이언트 (Storage 업로드용)
 * - @clerk/nextjs/server: Clerk 인증
 */

export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/posts");

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const filterUserId = searchParams.get("userId"); // 특정 사용자 게시물 필터링
    const offset = (page - 1) * limit;

    console.log("Query params:", { page, limit, offset, filterUserId });

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 현재 사용자 ID 확인 (선택사항 - 로그인하지 않아도 게시물 조회 가능)
    const { userId: currentClerkUserId } = await auth();
    console.log("Current user ID:", currentClerkUserId || "not logged in");

    // 게시물 목록 조회 (posts + users + post_stats 조인)
    let postsQuery = supabase
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
          name
        )
      `,
      )
      .order("created_at", { ascending: false });

    // 특정 사용자 게시물 필터링 (filterUserId가 제공된 경우)
    // filterUserId는 Clerk ID이므로 Supabase user_id로 변환 필요
    if (filterUserId) {
      // Clerk ID로 user_id 찾기
      const { data: targetUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", filterUserId)
        .single();

      if (targetUser) {
        postsQuery = postsQuery.eq("user_id", targetUser.id);
      } else {
        // 사용자를 찾을 수 없으면 빈 결과 반환
        return NextResponse.json({
          posts: [],
          pagination: {
            page,
            limit,
            total: 0,
            hasMore: false,
          },
        });
      }
    }

    const { data: posts, error: postsError } = await postsQuery.range(
      offset,
      offset + limit - 1,
    );

    if (postsError) {
      console.error("Posts fetch error:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts", details: postsError.message },
        { status: 500 },
      );
    }

    console.log(`Fetched ${posts?.length || 0} posts`);

    // 각 게시물에 대한 통계 정보 가져오기 (post_stats 뷰 활용)
    const postIds = posts?.map((post) => post.id) || [];

    const { data: stats, error: statsError } = await supabase
      .from("post_stats")
      .select("post_id, likes_count, comments_count")
      .in("post_id", postIds);

    if (statsError) {
      console.error("Stats fetch error:", statsError);
      // 통계 조회 실패해도 게시물은 반환
    }

    // 현재 사용자의 좋아요 정보 가져오기 (로그인한 경우)
    let userLikes: string[] = [];
    if (currentClerkUserId && postIds.length > 0) {
      // users 테이블에서 clerk_id로 user_id 찾기
      const { data: currentUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", currentClerkUserId)
        .single();

      if (currentUser) {
        const { data: likes } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", currentUser.id)
          .in("post_id", postIds);

        userLikes = likes?.map((like) => like.post_id) || [];
      }
    }

    // 각 게시물의 최신 댓글 2개 가져오기
    const { data: recentComments, error: commentsError } = await supabase
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
      .in("post_id", postIds)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("Comments fetch error:", commentsError);
    }

    // 데이터 조합
    const postsWithStats: PostWithRelations[] =
      posts?.map((post) => {
        const postStat = stats?.find((stat) => stat.post_id === post.id);
        const isLiked = userLikes.includes(post.id);

        // 해당 게시물의 최신 댓글 2개만 가져오기
        const postComments: PostWithRelations["recentComments"] =
          recentComments
            ?.filter((comment: any) => comment.post_id === post.id)
            .slice(0, 2)
            .map((comment: any) => {
              // users는 배열이므로 첫 번째 요소 사용
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

        // users는 배열이므로 첫 번째 요소 사용
        const postUser = Array.isArray((post as any).users)
          ? (post as any).users[0]
          : (post as any).users;

        const result: PostWithRelations = {
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
            likesCount: postStat?.likes_count || 0,
            commentsCount: postStat?.comments_count || 0,
          },
          isLiked,
          recentComments: postComments,
        };

        return result;
      }) || [];

    console.log(`Returning ${postsWithStats.length} posts with stats`);
    console.groupEnd();

    const response: PostsResponse = {
      posts: postsWithStats,
      pagination: {
        page,
        limit,
        total: postsWithStats.length,
        hasMore: postsWithStats.length === limit,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] GET /api/posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/posts");

    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Post creation request from user:", userId);

    // FormData 파싱
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const caption = formData.get("caption") as string | null;

    // 파일 검증
    if (!imageFile) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 },
      );
    }

    // 이미지 타입 검증
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 },
      );
    }

    // 파일 크기 검증 (최대 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    // 캡션 길이 검증 (최대 2,200자)
    const captionText = caption?.trim() || null;
    if (captionText && captionText.length > 2200) {
      return NextResponse.json(
        { error: "Caption must be less than 2200 characters" },
        { status: 400 },
      );
    }

    console.log("File validation passed:", {
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type,
      captionLength: captionText?.length || 0,
    });

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 user_id 찾기
    console.log("Looking up user with clerk_id:", userId);
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !currentUser) {
      console.error("User not found:", userError);
      console.error("User lookup error details:", {
        message: userError?.message,
        code: userError?.code,
        details: userError?.details,
        hint: userError?.hint,
      });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("User found:", { id: currentUser.id, clerk_id: currentUser.clerk_id });

    // Service Role 클라이언트로 Storage 업로드 (RLS 우회)
    let serviceRoleClient;
    try {
      serviceRoleClient = getServiceRoleClient();
      console.log("Service role client created successfully");
    } catch (clientError) {
      console.error("Failed to create service role client:", clientError);
      const errorMessage = clientError instanceof Error ? clientError.message : "Service role client creation failed";
      return NextResponse.json(
        { 
          error: "Failed to initialize storage client",
          details: errorMessage,
        },
        { status: 500 },
      );
    }
    
    const storageBucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "uploads";
    console.log("Storage bucket:", storageBucket);

    // 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const fileExt = imageFile.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    console.log("Uploading to storage:", { filePath, bucket: storageBucket, fileSize: imageFile.size });

    // Supabase Storage에 업로드
    let uploadData;
    let uploadError;
    try {
      const uploadResult = await serviceRoleClient.storage
        .from(storageBucket)
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });
      uploadData = uploadResult.data;
      uploadError = uploadResult.error;
    } catch (uploadException) {
      console.error("Storage upload exception:", uploadException);
      const errorMessage = uploadException instanceof Error ? uploadException.message : "Upload exception occurred";
      return NextResponse.json(
        {
          error: "Failed to upload image",
          details: errorMessage,
        },
        { status: 500 },
      );
    }

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      console.error("Upload error details:", {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error,
      });
      return NextResponse.json(
        {
          error: "Failed to upload image",
          details: uploadError.message || "Unknown upload error",
        },
        { status: 500 },
      );
    }

    // 업로드된 파일의 공개 URL 가져오기
    const {
      data: { publicUrl },
    } = serviceRoleClient.storage.from(storageBucket).getPublicUrl(filePath);

    console.log("File uploaded successfully:", publicUrl);
    console.log("Upload data:", uploadData);

    // posts 테이블에 게시물 저장
    console.log("Inserting post to database:", {
      user_id: currentUser.id,
      image_url: publicUrl,
      caption_length: captionText?.length || 0,
    });

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: currentUser.id,
        image_url: publicUrl,
        caption: captionText,
      })
      .select()
      .single();

    if (postError) {
      console.error("Post creation error:", postError);
      console.error("Post error details:", {
        message: postError.message,
        code: postError.code,
        details: postError.details,
        hint: postError.hint,
      });
      
      // 업로드된 파일 삭제 시도 (실패해도 계속 진행)
      await serviceRoleClient.storage
        .from(storageBucket)
        .remove([filePath])
        .catch((err) => console.error("Failed to cleanup uploaded file:", err));

      return NextResponse.json(
        {
          error: "Failed to create post",
          details: postError.message || "Unknown database error",
        },
        { status: 500 },
      );
    }

    console.log("Post inserted successfully:", post.id);

    const createdPost: Post = {
      id: post.id,
      userId: post.user_id,
      imageUrl: post.image_url,
      caption: post.caption,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    };

    console.log("Post created successfully:", post.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      post: createdPost,
    });
  } catch (error) {
    console.error("[API] POST /api/posts error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[API] POST /api/posts error details:", {
      message: errorMessage,
      stack: errorStack,
    });
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
