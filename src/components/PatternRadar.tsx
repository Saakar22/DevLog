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
    <div id="pattern-radar-panel" className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Radar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-mono text-slate-100 flex items-center gap-1.5">
              Pattern Radar
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                User Scoped
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Recurring failure vectors in your personal codebase
            </p>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block">RESOLUTION RATE</span>
            <span className={`font-semibold ${resolvedRate >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {resolvedRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Body: Frequency Bars */}
      <div className="mt-4">
        {topTags.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-slate-500">
            <p>No failure patterns logged yet.</p>
            <p className="mt-1 text-[11px] text-slate-600">
              Complete your first debugging session to compute tag recurring frequencies.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>FREQUENT VECTORS ({topTags.length} distinct)</span>
              {selectedTag && (
                <button
                  onClick={() => onSelectTag(null)}
                  className="text-cyan-400 hover:text-cyan-300 text-[10px] underline cursor-pointer"
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
                  className={`group relative flex flex-col p-2 rounded-lg border transition cursor-pointer ${
                    isSelected
                      ? "bg-cyan-950/60 border-cyan-500/80 text-cyan-200"
                      : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5 z-10">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Hash className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'}`} />
                      <span>{tag}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {count} {count === 1 ? 'incident' : 'incidents'}
                      </span>
                    </div>
                  </div>

                  {/* Frequency meter background bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected
                          ? "bg-cyan-400"
                          : count >= 3
                          ? "bg-amber-400 group-hover:bg-amber-300"
                          : "bg-cyan-500/70 group-hover:bg-cyan-400"
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
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Click any tag to isolate its journal entries</span>
          <span>{logs.length} total logged sessions</span>
        </div>
      )}
    </div>
  );
};
