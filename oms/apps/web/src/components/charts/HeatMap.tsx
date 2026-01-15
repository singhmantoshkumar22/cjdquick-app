"use client";

import { useMemo } from "react";
import {
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface HeatMapDataPoint {
  x: string;
  y: string;
  value: number;
}

interface HeatMapProps {
  data: HeatMapDataPoint[];
  xLabels?: string[];
  yLabels?: string[];
  colorRange?: [string, string, string]; // [low, mid, high]
  valueFormatter?: (value: number) => string;
  title?: string;
  height?: number;
}

export function HeatMap({
  data,
  xLabels,
  yLabels,
  colorRange = ["#f0f9ff", "#3b82f6", "#1d4ed8"],
  valueFormatter = (v) => v.toString(),
  title,
  height = 300,
}: HeatMapProps) {
  // Extract unique x and y values if not provided
  const { uniqueX, uniqueY, valueMap, maxValue } = useMemo(() => {
    const xSet = new Set<string>();
    const ySet = new Set<string>();
    const map = new Map<string, number>();
    let max = 0;

    for (const point of data) {
      xSet.add(point.x);
      ySet.add(point.y);
      const key = `${point.x}-${point.y}`;
      map.set(key, point.value);
      if (point.value > max) max = point.value;
    }

    return {
      uniqueX: xLabels || Array.from(xSet).sort(),
      uniqueY: yLabels || Array.from(ySet),
      valueMap: map,
      maxValue: max,
    };
  }, [data, xLabels, yLabels]);

  // Get color based on value
  const getColor = (value: number) => {
    if (maxValue === 0) return colorRange[0];
    const ratio = value / maxValue;

    if (ratio < 0.5) {
      // Interpolate between low and mid
      return colorRange[0];
    } else if (ratio < 0.8) {
      return colorRange[1];
    } else {
      return colorRange[2];
    }
  };

  const cellWidth = 100 / (uniqueX.length + 1);
  const cellHeight = (height - 40) / (uniqueY.length + 1);

  return (
    <div className="w-full" style={{ height }}>
      {title && (
        <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>
      )}
      <div className="relative w-full h-full">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-8" style={{ width: `${cellWidth}%` }}>
          {uniqueY.map((label, i) => (
            <div
              key={label}
              className="flex items-center justify-end pr-2 text-xs text-gray-600 truncate"
              style={{ height: cellHeight }}
            >
              {label.length > 15 ? `${label.slice(0, 12)}...` : label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div
          className="absolute top-0 right-0"
          style={{ left: `${cellWidth}%`, height: "100%" }}
        >
          {/* X-axis labels */}
          <div className="flex h-8">
            {uniqueX.map((label) => (
              <div
                key={label}
                className="flex-1 flex items-center justify-center text-xs text-gray-600"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                {label.length > 8 ? label.slice(-8) : label}
              </div>
            ))}
          </div>

          {/* Cells */}
          {uniqueY.map((yLabel) => (
            <div key={yLabel} className="flex" style={{ height: cellHeight }}>
              {uniqueX.map((xLabel) => {
                const value = valueMap.get(`${xLabel}-${yLabel}`) || 0;
                return (
                  <div
                    key={`${xLabel}-${yLabel}`}
                    className="flex-1 flex items-center justify-center text-xs font-medium border border-white cursor-pointer transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: getColor(value),
                      color: value > maxValue * 0.5 ? "white" : "inherit",
                    }}
                    title={`${yLabel} / ${xLabel}: ${valueFormatter(value)}`}
                  >
                    {value > 0 ? valueFormatter(value) : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="absolute bottom-0 right-0 flex items-center gap-2 text-xs">
          <span>Low</span>
          <div className="flex">
            {colorRange.map((color, i) => (
              <div
                key={i}
                className="w-6 h-3"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
