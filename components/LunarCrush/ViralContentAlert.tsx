/**
 * Viral Content Alert Component
 * Displays Bitcoin content that has gone viral (>10M interactions)
 */

import React from "react";
import { useLunarCrushViral } from "../../hooks/useLunarCrush";
import { formatInteractions } from "../../lib/lunarcrush/signals";

interface ViralContentAlertProps {
  symbol: string;
  threshold?: number;
}

export default function ViralContentAlert({ 
  symbol, 
  threshold = 10000000 
}: ViralContentAlertProps) {
  const { data, loading, error } = useLunarCrushViral(symbol, threshold);

  if (loading || error || !data || data.totalViral === 0) {
    return null;
  }

  return (
    <div className="bitcoin-block border-2 border-bitcoin-orange animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🔥</span>
        <div className="flex-1">
          <h3 className="text-bitcoin-orange font-bold text-lg">
            Viral Bitcoin Content Detected
          </h3>
          <p className="text-bitcoin-white-60 text-sm">
            {data.totalViral} post{data.totalViral !== 1 ? 's' : ''} with &gt;{formatInteractions(threshold)} interactions
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {data.posts.slice(0, 3).map((post) => (
          <div
            key={post.id}
            className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-3 hover:border-bitcoin-orange transition-all"
          >
            <div className="flex items-start gap-3">
              {/* Creator Avatar */}
              {post.creator_avatar && (
                <img
                  src={post.creator_avatar}
                  alt={post.creator_name}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}

              <div className="flex-1 min-w-0">
                {/* Post Content */}
                <p className="text-bitcoin-white text-sm mb-2 line-clamp-2">
                  {post.post_title}
                </p>

                {/* Post Metadata */}
                <div className="flex items-center gap-3 text-xs text-bitcoin-white-60 mb-2">
                  <span className="capitalize">
                    {post.post_type.replace('-', ' ')}
                  </span>
                  <span>•</span>
                  <span className="text-bitcoin-orange font-bold">
                    {formatInteractions(post.interactions_total)} interactions
                  </span>
                  <span>•</span>
                  <span>Sentiment: {post.post_sentiment}/5</span>
                </div>

                {/* Creator Info */}
                <div className="flex items-center gap-2 text-xs text-bitcoin-white-60">
                  <span className="font-semibold text-bitcoin-white">
                    {post.creator_display_name}
                  </span>
                  <span>@{post.creator_name}</span>
                  <span>•</span>
                  <span>{formatInteractions(parseInt(post.creator_followers))} followers</span>
                </div>
              </div>

              {/* View Link */}
              <a
                href={post.post_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 bg-bitcoin-orange text-bitcoin-black px-3 py-1 rounded font-semibold text-sm hover:bg-bitcoin-black hover:text-bitcoin-orange border-2 border-bitcoin-orange transition-all"
              >
                View →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Data Source */}
      <div className="mt-4 pt-4 border-t border-bitcoin-orange-20">
        <p className="text-bitcoin-white-60 text-xs">
          Viral content tracked by{" "}
          <a
            href="https://lunarcrush.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bitcoin-orange hover:text-bitcoin-white transition-colors underline"
          >
            LunarCrush
          </a>
          {" "}• Updated {new Date(data.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
