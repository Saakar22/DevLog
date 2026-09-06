import React, { useMemo } from "react";
import { 
  Radar, 
  Tag, 
  TrendingUp, 
  AlertCircle, 
  Hash, 
  Flame,
  BarChart3,
  Layers
} from "lucide-react";
import { DevLogDocument } from "../types";

interface PatternRadarProps {
  logs: DevLogDocument[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export const PatternRadar: React.FC<PatternRadarProps> = ({
  logs,
  selectedTag,
  onSelectTag,
}) => {
  // Aggregate tag frequency across THIS user's personal logs strictly
  const { tagCounts, topTags, totalTagsCount, resolvedRate } = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    let resolvedCount = 0;

    for (const log of logs) {
      if (log.resolved) resolvedCount++;
      if (Array.isArray(log.tags)) {
        for (const rawTag of log.tags) {
          const t = String(rawTag).toLowerCase().trim();
          if (!t) continue;
          counts[t] = (counts[t] || 0) + 1;
          total++;
        }
      }
    }

    // Sort descending by occurrence
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));

    const rate = logs.length > 0 ? Math.round((resolvedCount / logs.length) * 100) : 0;

    return {
      tagCounts: counts,
      topTags: sorted,
      totalTagsCount: total,
      resolvedRate: rate,
    };
  }, [logs]);

  const maxFrequency = topTags[0]?.count || 1;

  return (
    <div id="pattern-radar-panel" className="glass-panel rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg glass-panel-secondary flex items-center justify-center text-[#E8E8EA]">
            <Radar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#E8E8EA] flex items-center gap-2">
              <span>Pattern radar</span>
              <span className="text-[11px] px-2 py-0.5 rounded glass-panel-secondary text-[#9A9AA2]">
                User scoped
              </span>
            </h3>
            <p className="text-xs text-[#9A9AA2] mt-0.5">
              Recurring failure vectors in your personal codebase
            </p>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="text-xs text-[#9A9AA2] block">Resolution rate</span>
            <span className="text-sm font-medium text-[#E8E8EA]">
              {resolvedRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Body: Frequency Bars */}
      <div className="mt-4">
        {topTags.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#9A9AA2]">
            <p>No failure patterns logged yet.</p>
            <p className="mt-1 text-xs text-[#9A9AA2]/70">
              Complete your first debugging session to compute tag recurring frequencies.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#9A9AA2] mb-1">
              <span>Frequent vectors ({topTags.length} distinct)</span>
              {selectedTag && (
                <button
                  onClick={() => onSelectTag(null)}
                  className="text-[#6EA8FE] hover:underline text-xs cursor-pointer"
                >
                  Clear filter ({selectedTag})
                </button>
              )}
            </div>

            {topTags.slice(0, 8).map(({ tag, count }) => {
              const isSelected = selectedTag === tag;
              const percentage = Math.round((count / maxFrequency) * 100);

              return (
                <div
                  key={tag}
                  onClick={() => onSelectTag(isSelected ? null : tag)}
                  className={`group relative flex flex-col p-3 rounded-lg glass-panel-secondary transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-white/[0.08] border border-[#6EA8FE]/40"
                      : "hover:bg-white/[0.08]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2 z-10">
                    <div className="flex items-center gap-1.5 font-medium text-[#E8E8EA]">
                      <Hash className={`w-3.5 h-3.5 ${isSelected ? 'text-[#6EA8FE]' : 'text-[#9A9AA2]'}`} />
                      <span>{tag}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#9A9AA2]">
                        {count} {count === 1 ? 'incident' : 'incidents'}
                      </span>
                    </div>
                  </div>

                  {/* Frequency meter background bar */}
                  <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected
                          ? "bg-[#6EA8FE]"
                          : "bg-[#E8E8EA]/40 group-hover:bg-[#E8E8EA]/60"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {topTags.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#9A9AA2]">
          <span>Click any tag to isolate its journal entries</span>
          <span>{logs.length} total logged sessions</span>
        </div>
      )}
    </div>
  );
};
