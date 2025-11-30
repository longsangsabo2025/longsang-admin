import { motion } from 'framer-motion';
import { GlowCard } from './GlowCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { ProjectData } from '@/data/projects-data';

interface StatsChartProps {
  project: ProjectData;
}

export const StatsChart = ({ project }: StatsChartProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-12"
    >
      <h2 className="font-display text-3xl font-bold mb-6 glow-text">THỐNG KÊ & HIỆU SUẤT</h2>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {project.metrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
          >
            <GlowCard className="text-center" glowColor="cyan">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                {metric.label}
              </p>
              <p className="font-display text-2xl font-bold text-neon-cyan mb-1">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.unit}</p>
              <p className="text-xs text-neon-green mt-2">{metric.trend}</p>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <GlowCard glowColor="blue">
          <h3 className="font-display text-lg font-semibold mb-4 text-neon-blue">
            Tăng Trưởng Theo Quý 2025
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={project.barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--dark-surface))',
                  border: '1px solid hsl(var(--neon-cyan))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--neon-cyan))" radius={[8, 8, 0, 0]} />
              <Bar dataKey="target" fill="hsl(var(--neon-blue))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlowCard>

        <GlowCard glowColor="green">
          <h3 className="font-display text-lg font-semibold mb-4 text-neon-green">
            Tăng Trưởng Người Dùng 2025
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={project.lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--dark-surface))',
                  border: '1px solid hsl(var(--neon-green))',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="hsl(var(--neon-green))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--neon-green))', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="performance"
                stroke="hsl(var(--neon-cyan))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--neon-cyan))', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlowCard>
      </div>
    </motion.div>
  );
};
