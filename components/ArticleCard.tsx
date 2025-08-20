import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { Clock, User } from 'lucide-react'

export interface Article {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  publishedAt: string
  category: string
  imageUrl: string
  slug: string
  readTime: number
}

interface ArticleCardProps {
  article: Article
  featured?: boolean
}

export default function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const publishedDate = new Date(article.publishedAt)
  const timeAgo = formatDistanceToNow(publishedDate, { addSuffix: true })

  if (featured) {
    return (
      <Link href={`/article/${article.slug}`} className="group block">
        <article className="relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="relative h-64 md:h-80">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-600 text-white">
                {article.category}
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="text-xl md:text-2xl font-bold mb-2 line-clamp-2">
              {article.title}
            </h2>
            <p className="text-gray-200 text-sm mb-3 line-clamp-2">
              {article.excerpt}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-300">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{article.author}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{timeAgo}</span>
              </div>
              <span>{article.readTime} min read</span>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={`/article/${article.slug}`} className="group block">
      <article className="card transition-all duration-300 hover:shadow-lg group-hover:-translate-y-1">
        <div className="relative h-48">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
          />
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-600 text-white">
              {article.category}
            </span>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {article.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {article.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{article.author}</span>
              </div>
              <span>{article.readTime} min read</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
