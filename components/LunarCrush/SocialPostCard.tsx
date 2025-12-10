/**
 * Social Post Card Component
 * Individual post display with clickable link to source
 */

import React from "react";
import type { SocialPost } from "../../lib/lunarcrush/types";

interface SocialPostCardProps {
  post: SocialPost;
}

// Format large numbers (e.g., 1234567 -> "1.2M")
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

// Get sentiment color based on score (1-5 scale)
function getSentimentColor(sentiment: number): string {
  if (sentiment >= 4) return "text-bitcoin-orange";
  if (sentiment >= 3) return "text-bitcoin-white";
  return "text-bitcoin-white-60";
}

// Get sentiment label
function getSentimentLabel(sentiment: number): string {
  if (sentiment >= 4.5) return "Very Positive";
  if (sentiment >= 4) return "Positive";
  if (sentiment >= 3) return "Neutral";
  if (sentiment >= 2) return "Negative";
  return "Very Negative";
}

// Get post type icon
function getPostTypeIcon(postType: string): string {
  switch (postType) {
    case "tweet":
      return "🐦";
    case "youtube-video":
      return "📺";
    case "reddit-post":
      return "🔴";
    case "tiktok-video":
      return "🎵";
    case "news":
      return "📰";
    default:
      return "📱";
  }
}

export default function SocialPostCard({ post }: SocialPostCardProps) {
  const postDate = new Date(post.post_created * 1000);
  const timeAgo = getTimeAgo(postDate);

  return (
    <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4 hover:border-bitcoin-orange transition-all">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Creator Avatar */}
        {post.creator_avatar && (
          <img
            src={post.creator_avatar}
            alt={post.creator_name}
            className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-bitcoin-orange-20"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Creator Info */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-bitcoin-white font-semibold truncate">
              {post.creator_display_name}
            </span>
            <span className="text-bitcoin-white-60 text-sm truncate">
              @{post.creator_name}
            </span>
          </div>

          {/* Post Type & Time */}
          <div className="flex items-center gap-2 text-xs text-bitcoin-white-60">
            <span>{getPostTypeIcon(post.post_type)}</span>
            <span className="capitalize">
              {post.post_type.replace('-', ' ')}
            </span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Sentiment Badge */}
        <div className={`flex-shrink-0 px-2 py-1 rounded ${getSentimentColor(post.post_sentiment)} border border-current text-xs font-semibold`}>
          {getSentimentLabel(post.post_sentiment)}
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-3">
        <p className="text-bitcoin-white text-sm leading-relaxed line-clamp-3">
          {post.post_title}
        </p>
      </div>

      {/* Post Image (if available) */}
      {post.post_image && (
        <div className="mb-3 rounded-lg overflow-hidden border border-bitcoin-orange-20">
          <img
            src={post.post_image}
            alt="Post preview"
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.parentElement!.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-bitcoin-orange-20">
        {/* Engagement Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-bitcoin-orange">💬</span>
            <span className="text-bitcoin-white-60">
              {formatNumber(post.interactions_total)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-bitcoin-orange">👥</span>
            <span className="text-bitcoin-white-60">
              {formatNumber(parseInt(post.creator_followers))}
            </span>
          </div>
        </div>

        {/* View Source Link */}
        <a
          href={post.post_link}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-bitcoin-orange text-bitcoin-black px-4 py-2 rounded font-semibold text-sm hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange transition-all flex items-center gap-2"
        >
          View Source
          <span>→</span>
        </a>
      </div>
    </div>
  );
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
