"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CtaPlacement, DailyPoint } from "@/lib/analytics/queries";

// Burton admin palette — matches AdminShell's dark sidebar / canvas-tint body.
const AXIS = "#6b7891";
const GRID = "#d4dae4";
const VIEWS = "#0066ff"; // brand
const SESSIONS = "#ff6a00"; // accent

const tooltipStyle = {
  backgroundColor: "#0b1220",
  border: "1px solid #243558",
  borderRadius: 8,
  color: "#eef1f8",
  fontSize: 13,
};

export function TrafficChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: AXIS }}
          stroke={AXIS}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 11, fill: AXIS }}
          stroke={AXIS}
          allowDecimals={false}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: AXIS }} />
        <Line
          type="monotone"
          dataKey="views"
          stroke={VIEWS}
          strokeWidth={2}
          name="Page Views"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="sessions"
          stroke={SESSIONS}
          strokeWidth={2}
          name="Sessions"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CtaPlacementChart({ data }: { data: CtaPlacement[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
        <XAxis
          dataKey="location"
          tick={{ fontSize: 11, fill: AXIS }}
          stroke={AXIS}
        />
        <YAxis
          tick={{ fontSize: 11, fill: AXIS }}
          stroke={AXIS}
          allowDecimals={false}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: AXIS }} />
        <Bar
          dataKey="phone"
          fill={VIEWS}
          name="Phone Calls"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="quote"
          fill={SESSIONS}
          name="Quote CTAs"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
