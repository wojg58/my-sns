"use client";

import { useState, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import type { User } from "@/lib/types";

/**
 * @file components/search/SearchModal.tsx
 * @description 사용자 검색 모달 컴포넌트
 *
 * Instagram 스타일의 검색 모달입니다.
 * - 사용자 검색 (이름으로 검색)
 * - 검색 결과 표시
 * - 사용자 프로필로 이동
 *
 * @dependencies
 * - @/components/ui/dialog: Dialog 모달
 * - @/components/ui/input: Input 컴포넌트
 */

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const { user: clerkUser } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 검색어가 변경될 때마다 검색 실행
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setUsers([]);
      setError(null);
      return;
    }

    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setUsers([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.group("[SearchModal] Searching users");
        console.log("Search query:", searchQuery);

        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`,
        );

        if (!response.ok) {
          throw new Error("검색에 실패했습니다.");
        }

        const data = await response.json();
        console.log("Search results:", data.users?.length || 0);
        console.groupEnd();

        setUsers(data.users || []);
      } catch (err) {
        console.error("[SearchModal] Search error:", err);
        setError(err instanceof Error ? err.message : "검색 중 오류가 발생했습니다.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    // 디바운스: 300ms 후 검색 실행
    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[90vw] p-0 flex flex-col max-h-[80vh] bg-white border-[var(--instagram-border)]">
        <DialogHeader className="px-4 py-3 border-b border-[var(--instagram-border)]">
          <DialogTitle className="text-lg font-semibold text-[var(--text-primary)]">
            검색
          </DialogTitle>
        </DialogHeader>

        {/* 검색 입력 */}
        <div className="px-4 py-3 border-b border-[var(--instagram-border)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[var(--instagram-background)] border-[var(--instagram-border)] rounded-lg focus:border-[var(--instagram-blue)] focus:ring-1 focus:ring-[var(--instagram-blue)]"
              autoFocus
            />
          </div>
        </div>

        {/* 검색 결과 */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--instagram-blue)]" />
            </div>
          )}

          {error && (
            <div className="px-4 py-8 text-center text-red-600 text-sm">{error}</div>
          )}

          {!loading && !error && searchQuery.trim() && users.length === 0 && (
            <div className="px-4 py-8 text-center text-[var(--text-secondary)] text-sm">
              검색 결과가 없습니다.
            </div>
          )}

          {!loading && !error && !searchQuery.trim() && (
            <div className="px-4 py-8 text-center text-[var(--text-secondary)] text-sm">
              검색어를 입력하세요.
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <ul className="divide-y divide-[var(--instagram-border)]">
              {users.map((user) => (
                <li key={user.id}>
                  <Link
                    href={`/profile/${user.clerkId}`}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--instagram-background)] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {user.name}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

