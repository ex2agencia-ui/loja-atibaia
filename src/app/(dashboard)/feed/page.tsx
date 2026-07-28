"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { PostComposer } from "@/components/feed/post-composer"
import { PostCard, Post } from "@/components/feed/post-card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function FeedPage() {
  const qc = useQueryClient()
  const loaderRef = useRef<HTMLDivElement>(null)

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetch("/api/me").then(r => r.json()),
    staleTime: 60_000,
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) =>
      fetch(`/api/posts?limit=10${pageParam ? `&cursor=${pageParam}` : ""}`).then(r => r.json()),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? null,
  })

  const posts: Post[] = data?.pages.flatMap(p => p.posts) ?? []

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  function handleCreated(post: Post) {
    qc.setQueryData(["feed"], (old: any) => {
      if (!old) return old
      const pages = [...old.pages]
      pages[0] = { ...pages[0], posts: [post, ...pages[0].posts] }
      return { ...old, pages }
    })
  }

  function handleDelete(id: string) {
    if (!confirm("Remover esta publicação?")) return
    fetch(`/api/posts/${id}`, { method: "DELETE" }).then(res => {
      if (res.ok) {
        qc.setQueryData(["feed"], (old: any) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((p: any) => ({ ...p, posts: p.posts.filter((x: Post) => x.id !== id) })),
          }
        })
        toast.success("Publicação removida")
      } else {
        toast.error("Erro ao remover")
      }
    })
  }

  function handlePostUpdate(updated: Post) {
    qc.setQueryData(["feed"], (old: any) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map((p: any) => ({
          ...p,
          posts: p.posts.map((x: Post) => x.id === updated.id ? updated : x),
        })),
      }
    })
  }

  const isPrivileged = ["ADMIN", "SECRETARIO"].includes(me?.role)
  const hasMembro = !!me?.memberId

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mural</h1>
        <p className="text-sm text-muted-foreground">Novidades e comunicados da Loja</p>
      </div>

      {hasMembro && (
        <PostComposer
          onCreated={handleCreated}
          membroNome={me?.membroNome}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Nenhuma publicação ainda. Seja o primeiro!
        </div>
      ) : (
        <>
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              meuMemberId={me?.memberId}
              isPrivileged={isPrivileged}
              onDelete={handleDelete}
              onPostUpdate={handlePostUpdate}
            />
          ))}
          <div ref={loaderRef} className="flex justify-center py-4">
            {isFetchingNextPage && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>
        </>
      )}
    </div>
  )
}
