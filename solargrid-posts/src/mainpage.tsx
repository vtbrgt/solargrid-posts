import { useState, useEffect } from "react"
import { supabase } from "./database/supabase"
import type { Post } from "./types"

export function PostsList() {
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Record<number, Comment[]>>({})
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [openPostId, setOpenPostId] = useState<number | null>(null)

  useEffect(() => {
    async function checkPosts() {
      const { data: posts } = await supabase
        .from('posts')
        .select('*')

      const { data: commentsData } = await supabase.from('comments').select('*')

      const grouped = (commentsData ?? []).reduce<Record<number, Comment[]>>((acc, c) => {
        acc[c.postId] = [...(acc[c.postId] ?? []), c]
        return acc
      }, {})

      setPosts(posts ?? [])
      setComments(grouped)
      setLoading(false)
    }

    checkPosts()
  }, [])

  function toggleComments(postId: number) {
    setOpenPostId(prev => (prev === postId ? null : postId))
  }

  async function fetchFromApi() {
    setFetching(true)

    const [postsRes, commentsRes] = await Promise.all([
      fetch('https://jsonplaceholder.typicode.com/posts'),
      fetch('https://jsonplaceholder.typicode.com/comments'),
    ])

    const [newPosts, newComments] = await Promise.all([
      postsRes.json() as Promise<Post[]>,
      commentsRes.json() as Promise<Record<number, Comment[]>>,
    ])

    await Promise.all([
      supabase.from('posts').upsert(newPosts, { onConflict: 'id' }),
      supabase.from('comments').upsert(newComments, { onConflict: 'id' }),
    ])

    setPosts(newPosts)
    setComments(newComments);
    setFetching(false)
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div>
      {posts.length === 0 ? (
        <div>
          <p>Nenhum post encontrado.</p>
          <button onClick={fetchFromApi} disabled={fetching}>
            {fetching ? 'Buscando...' : 'Buscar posts'}
          </button>
        </div>
      ) : (
        <>
          <button onClick={fetchFromApi} disabled={fetching}>
              {fetching ? 'Buscando...' : 'Atualizar posts'}
          </button>

          <ul>
            {posts.map(post => {
              const isOpen = openPostId === post.id

              return (
                <li key={post.id}>
                  <span>{post.title}</span>

                  <button onClick={() => toggleComments(post.id)}>
                    {isOpen ? '▲ Ocultar' : '▼ Comentários'}
                  </button>

                  {isOpen && (
                    <ul>
                      {(comments[post.id] ?? []).map(comment => (
                        <li key={comment.id}>
                          <strong>{comment.name}</strong>
                          <span>{comment.email}</span>
                          <p>{comment.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}