"use client";

import { useState, KeyboardEvent } from "react";
import { Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import type { CommentWithUser } from "@/lib/types";

/**
 * @file components/comment/CommentForm.tsx
 * @description 댓글 작성 폼 컴포넌트
 *
 * Instagram 스타일의 댓글 작성 폼입니다.
 * - "댓글 달기..." 입력창
 * - Enter 키 또는 "게시" 버튼으로 댓글 작성
 * - 최대 2,200자 제한
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증
 * - @/lib/types: 타입 정의
 */

interface CommentFormProps {
  postId: string;
  onCommentAdded?: (comment: CommentWithUser) => void; // 댓글 작성 성공 콜백
  placeholder?: string;
  className?: string;
}

export function CommentForm({
  postId,
  onCommentAdded,
  placeholder = "댓글 달기...",
  className = "",
}: CommentFormProps) {
  const { user, isLoaded } = useUser();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 댓글 작성
  const handleSubmit = async () => {
    if (!isLoaded || !user) {
      setError("로그인이 필요합니다.");
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    // 최대 길이 검증 (2,200자)
    if (trimmedContent.length > 2200) {
      setError("댓글은 최대 2,200자까지 입력할 수 있습니다.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.group("[CommentForm] Submitting comment");
      console.log("Post ID:", postId);
      console.log("Content length:", trimmedContent.length);

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content: trimmedContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "댓글 작성에 실패했습니다.");
      }

      const data = await response.json();
      console.log("Comment created:", data.comment?.id);
      console.groupEnd();

      // 성공 처리
      setContent("");
      setError(null);

      // 콜백 호출 (댓글 목록 새로고침 등)
      if (onCommentAdded && data.comment) {
        onCommentAdded(data.comment);
      }
    } catch (err) {
      console.error("[CommentForm] Submit error:", err);
      setError(
        err instanceof Error ? err.message : "댓글 작성에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enter 키 처리
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift + Enter는 줄바꿈, Enter만 누르면 제출
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 비로그인 상태
  if (!isLoaded || !user) {
    return null;
  }

  const canSubmit = content.trim().length > 0 && !isSubmitting;
  const contentLength = content.length;
  const maxLength = 2200;

  return (
    <div className={`border-t border-[var(--instagram-border)] ${className}`}>
      {/* 에러 메시지 */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* 댓글 작성 영역 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex items-center gap-2 px-4 py-3"
      >
        <textarea
          value={content}
          onChange={(e) => {
            if (e.target.value.length <= maxLength) {
              setContent(e.target.value);
              setError(null);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 border-0 focus:outline-none focus:ring-0 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none"
          rows={1}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className={`px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            canSubmit
              ? "text-[var(--instagram-blue)] hover:text-[var(--instagram-blue)]/80"
              : "text-[var(--text-secondary)]"
          }`}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "게시"}
        </button>
      </form>

      {/* 글자 수 표시 (거의 가득 찬 경우만) */}
      {contentLength > maxLength * 0.9 && (
        <div className="px-4 pb-2 flex justify-end">
          <span
            className={`text-xs ${
              contentLength >= maxLength
                ? "text-red-500"
                : "text-[var(--text-secondary)]"
            }`}
          >
            {contentLength}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
}
