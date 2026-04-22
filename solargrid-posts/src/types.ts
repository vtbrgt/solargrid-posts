export type Post = {
  id: number
  title: string
  body: string
}

export  type Comment = {
  id: number
  postId: number
  name: string
  email: string
  body: string
}