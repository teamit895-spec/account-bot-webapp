'use client';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ChartProps {
  data: any[];
  title?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card/95 backdrop-blur-sm border border-dark-border rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-white text-sm font-medium">
              {entry.value?.toLocaleString('ru-RU')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AreaChartCard({ data, title }: ChartProps) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4">
      {title && (
        <h3 className="text-white font-semibold mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#64748b" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString('ru-RU')}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#colorValue)"
          />
          {data[0]?.value2 !== undefined && (
            <Area
              type="monotone"
              dataKey="value2"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorValue2)"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartCard({ data, title }: ChartProps) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4">
      {title && (
        <h3 className="text-white font-semibold mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#64748b" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="тень" 
            stackId="a" 
            fill="#8b5cf6" 
            radius={[0, 0, 0, 0]}
          />
          <Bar 
            dataKey="мороз" 
            stackId="a" 
            fill="#06b6d4" 
            radius={[0, 0, 0, 0]}
          />
          <Bar 
            dataKey="вылет" 
            stackId="a" 
            fill="#f59e0b" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function DonutChart({ data, title }: ChartProps) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4">
      {title && (
        <h3 className="text-white font-semibold mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-xs text-gray-400">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
