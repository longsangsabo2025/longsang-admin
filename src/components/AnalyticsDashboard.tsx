import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, AlertCircle, TrendingUp, Users, Code, Zap } from 'lucide-react';
import { ProjectCardData } from './ProjectCard';

interface AnalyticsDashboardProps {
  projects: ProjectCardData[];
}

interface ProjectMetric {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ projects }) => {
  // Calculate analytics metrics
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const inProgressProjects = projects.filter(p => p.status === 'In Development').length;
  const totalTechnologies = new Set(projects.flatMap(p => p.technologies)).size;
  const totalFeatures = projects.reduce((acc, p) => acc + (p.features?.length || 0), 0);
  
  const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
  const avgProjectDuration = calculateAverageProjectDuration(projects);
  
  // Technology usage analysis
  const techUsage = analyzeTechnologyUsage(projects);
  const categoryDistribution = analyzeCategoryDistribution(projects);
  const projectTimeline = analyzeProjectTimeline(projects);

  const metrics: ProjectMetric[] = [
    {
      label: 'Total Projects',
      value: totalProjects,
      icon: <Code className="w-5 h-5" />,
      color: 'text-blue-400',
      trend: 12
    },
    {
      label: 'Completed',
      value: completedProjects,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-green-400',
      trend: 8
    },
    {
      label: 'In Progress',
      value: inProgressProjects,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-yellow-400'
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-primary',
      trend: 15
    },
    {
      label: 'Technologies Used',
      value: totalTechnologies,
      icon: <Zap className="w-5 h-5" />,
      color: 'text-purple-400'
    },
    {
      label: 'Total Features',
      value: totalFeatures,
      icon: <Users className="w-5 h-5" />,
      color: 'text-cyan-400'
    },
    {
      label: 'Avg Duration',
      value: avgProjectDuration,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-orange-400'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-100 mb-4">Project Analytics</h1>
        <p className="text-gray-400 text-lg">Comprehensive insights into project development and technology usage</p>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-dark-surface/50 border border-gray-700 rounded-xl p-6 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${metric.color}`}>
                {metric.icon}
              </div>
              {metric.trend && (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <TrendingUp className="w-3 h-3" />
                  +{metric.trend}%
                </div>
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-100 mb-1">{metric.value}</div>
              <div className="text-sm text-gray-400">{metric.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Technology Usage Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-dark-surface/50 border border-gray-700 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Technology Usage
          </h3>
          <div className="space-y-3">
            {techUsage.slice(0, 8).map((tech, index) => (
              <div key={tech.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-300">{tech.name}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${tech.percentage}%` }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="h-2 bg-primary rounded-full"
                    />
                  </div>
                  <div className="text-sm text-gray-400 w-12 text-right">
                    {tech.count} ({tech.percentage}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-dark-surface/50 border border-gray-700 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Project Categories
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {categoryDistribution.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-dark-bg/50 rounded-lg p-4 text-center border border-gray-600"
              >
                <div className="text-2xl font-bold text-primary mb-1">{category.count}</div>
                <div className="text-sm text-gray-400">{category.name}</div>
                <div className="text-xs text-gray-500 mt-1">{category.percentage}%</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Project Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-dark-surface/50 border border-gray-700 rounded-xl p-6"
      >
        <h3 className="text-xl font-semibold text-gray-100 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Project Development Timeline
        </h3>
        <div className="space-y-4">
          {projectTimeline.map((item, index) => (
            <motion.div
              key={item.project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-center gap-4 p-4 bg-dark-bg/30 rounded-lg border border-gray-600"
            >
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  item.project.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                  item.project.status === 'In Development' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {item.project.status === 'Completed' ? 
                    <CheckCircle className="w-6 h-6" /> : 
                    <Clock className="w-6 h-6" />
                  }
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-200">{item.project.title}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    item.project.status === 'Completed' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    item.project.status === 'In Development' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {item.project.status}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  Started: {item.startDate} 
                  {item.endDate && ` • Completed: ${item.endDate}`}
                  <span className="ml-2 text-primary">({item.duration})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.project.technologies.slice(0, 5).map(tech => (
                    <span key={tech} className="px-2 py-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded">
                      {tech}
                    </span>
                  ))}
                  {item.project.technologies.length > 5 && (
                    <span className="px-2 py-1 text-xs bg-gray-700 text-gray-400 border border-gray-600 rounded">
                      +{item.project.technologies.length - 5}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// Helper functions for analytics calculations
function calculateAverageProjectDuration(projects: ProjectCardData[]): string {
  const completedProjects = projects.filter(p => p.completionDate && p.startDate);
  if (completedProjects.length === 0) return 'N/A';
  
  const totalDays = completedProjects.reduce((acc, project) => {
    const start = new Date(project.startDate);
    const end = new Date(project.completionDate!);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return acc + diffDays;
  }, 0);
  
  const avgDays = Math.round(totalDays / completedProjects.length);
  
  if (avgDays < 30) return `${avgDays} days`;
  if (avgDays < 365) return `${Math.round(avgDays / 30)} months`;
  return `${Math.round(avgDays / 365)} years`;
}

function analyzeTechnologyUsage(projects: ProjectCardData[]) {
  const techCount: Record<string, number> = {};
  projects.forEach(project => {
    project.technologies.forEach(tech => {
      techCount[tech] = (techCount[tech] || 0) + 1;
    });
  });
  
  return Object.entries(techCount)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / projects.length) * 100)
    }))
    .sort((a, b) => b.count - a.count);
}

function analyzeCategoryDistribution(projects: ProjectCardData[]) {
  const categoryCount: Record<string, number> = {};
  projects.forEach(project => {
    categoryCount[project.category] = (categoryCount[project.category] || 0) + 1;
  });
  
  return Object.entries(categoryCount)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / projects.length) * 100)
    }))
    .sort((a, b) => b.count - a.count);
}

function analyzeProjectTimeline(projects: ProjectCardData[]) {
  return projects
    .map(project => {
      const start = new Date(project.startDate);
      const end = project.completionDate ? new Date(project.completionDate) : new Date();
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let duration = '';
      if (diffDays < 30) duration = `${diffDays} days`;
      else if (diffDays < 365) duration = `${Math.round(diffDays / 30)} months`;
      else duration = `${Math.round(diffDays / 365)} years`;
      
      return {
        project,
        startDate: start.toLocaleDateString(),
        endDate: project.completionDate ? end.toLocaleDateString() : null,
        duration,
        daysCount: diffDays
      };
    })
    .sort((a, b) => new Date(a.project.startDate).getTime() - new Date(b.project.startDate).getTime());
}

export default AnalyticsDashboard;