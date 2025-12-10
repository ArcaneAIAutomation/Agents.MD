/**
 * Social Feed Widget Component
 * Scrollable feed of social media posts with filtering
 */

import React, { useState } from "react";
import { useLunarCrushPosts } from "../../hooks/useLunarCrush";
import SocialPostCard from "./SocialPostCard";

interface SocialFeedWidgetProps {
  symbol: string;
  limit?: number;
}

const POST_TYPE_FILTERS = [
  { value: "all", label: "All Posts", icon: "📱" },
  { value: "tweet", label: "Twitter", icon: "🐦" },
  { value: "youtube-video", label: "YouTube", icon: "📺" },
  { value: "reddit-post", label: "Reddit", icon: "🔴" },
  { value: "tiktok-video", label: "TikTok", icon: "🎵" },
  { value: "news", label: "News", icon: "📰" },
];

export default function SocialFeedWidget({ symbol, limit = 50 }: SocialFeedWidgetProps) {
  const [filter, setFilter] = useState("all");
  const { data, loading, error, refresh } = useLunarCrushPosts(symbol, limit, filter);

  if (loading) {
    return (
      <div className="bitcoin-block">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-bitcoin-orange-20 rounded w-1/3 mb-4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-bitcoin-orange-10 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bitcoin-block border-2 border-bitcoin-white-60">
        <h3 className="text-bitcoin-white font-bold mb-2">Social Feed</h3>
        <p className="text-bitcoin-white-60 text-sm mb-3">{error}</p>
        <button
          onClick={refresh}
          className="bg-bitcoin-orange text-bitcoin-black px-4 py-2 rounded font-semibold hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bitcoin-block">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-bitcoin-white font-bold text-lg mb-1">
            Social Feed
          </h3>
          <p className="text-bitcoin-white-60 text-sm">
            {data.totalPosts} posts • {(data.totalInteractions / 1000000).toFixed(1)}M interactions
          </p>
        </div>
        <button
          onClick={refresh}
          className="text-bitcoin-orange hover:text-bitcoin-white transition-colors text-sm"
          title="Refresh feed"
        >
          🔄
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-bitcoin-orange-20">
        {POST_TYPE_FILTERS.map((filterOption) => (
          <button
            key={filterOption.value}
            onClick={() => setFilter(filterOption.value)}
            className={`px-3 py-2 rounded text-sm font-semibold transition-all border-2 ${
              filter === filterOption.value
                ? "bg-bitcoin-orange text-bitcoin-black border-bitcoin-orange"
                : "bg-transparent text-bitcoin-white-80 border-bitcoin-orange-20 hover:border-bitcoin-orange"
            }`}
          >
            <span className="mr-1">{filterOption.icon}</span>
            {filterOption.label}
            {filterOption.value !== "all" && data.postTypeDistribution[filterOption.value] && (
              <span className="ml-1 opacity-60">
                ({data.postTypeDistribution[filterOption.value]})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-bitcoin-orange-20">
        <div>
          <label className="text-bitcoin-white-60 text-xs uppercase tracking-wider block mb-1">
            Avg Sentiment
          </label>
          <p className="text-bitcoin-orange font-mono text-lg font-bold">
            {data.averageSentiment.toFixed(1)}/5
          </p>
        </div>
        <div>
          <label className="text-bitcoin-white-60 text-xs uppercase tracking-wider block mb-1">
            Total Posts
          </label>
          <p className="text-bitcoin-white font-mono text-lg font-bold">
            {data.totalPosts}
          </p>
        </div>
        <div>
          <label className="text-bitcoin-white-60 text-xs uppercase tracking-wider block mb-1">
            Interactions
          </label>
          <p className="text-bitcoin-white font-mono text-lg font-bold">
            {(data.totalInteractions / 1000000).toFixed(1)}M
          </p>
        </div>
        <div>
          <label className="text-bitcoin-white-60 text-xs uppercase tracking-wider block mb-1">
            Top Creators
          </label>
          <p className="text-bitcoin-white font-mono text-lg font-bold">
            {data.topCreators.length}
          </p>
        </div>
      </div>

      {/* Top Creators */}
      {data.topCreators.length > 0 && (
        <div className="mb-4 pb-4 border-b border-bitcoin-orange-20">
          <h4 className="text-bitcoin-white font-semibold text-sm mb-3">
            Top Contributors
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.topCreators.slice(0, 5).map((creator) => (
              <div
                key={creator.name}
                className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg px-3 py-2 text-xs"
              >
                <div className="text-bitcoin-white font-semibold mb-1">
                  {creator.displayName}
                </div>
                <div className="text-bitcoin-white-60">
                  {creator.posts} posts • {(creator.totalInteractions / 1000000).toFixed(1)}M interactions
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
        {data.posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-bitcoin-white-60 text-sm">
              No posts found for this filter
            </p>
          </div>
        ) : (
          data.posts.map((post) => (
            <SocialPostCard key={post.id} post={post} />
          ))
        )}
      </div>

      {/* Data Source */}
      <div className="mt-4 pt-4 border-t border-bitcoin-orange-20">
        <p className="text-bitcoin-white-60 text-xs">
          Social data from{" "}
          <a
            href="https://lunarcrush.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bitcoin-orange hover:text-bitcoin-white transition-colors underline"
          >
            LunarCrush
          </a>
          {" "}• Real-time social sentiment tracking
        </p>
      </div>
    </div>
  );
}
