import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github, Calendar, Tag, ArrowRight } from 'lucide-react';

export interface ProjectCardData {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  technologies: string[];
  status: string;
  category: string;
  image: string;
  demoUrl?: string;
  githubUrl?: string;
  startDate: string;
  completionDate?: string;
  features: string[];
  challenges?: string[];
  achievements?: string[];
}

interface ProjectCardProps {
  project: ProjectCardData;
  onClick: () => void;
  isActive?: boolean;
}

const statusColors = {
  'In Development': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Completed': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Planning': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Beta': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Live': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Maintenance': 'bg-orange-500/20 text-orange-300 border-orange-500/30'
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onClick, 
  isActive = false 
}) => {
  const statusStyle = statusColors[project.status as keyof typeof statusColors] || 
                     'bg-gray-500/20 text-gray-300 border-gray-500/30';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`relative group cursor-pointer overflow-hidden rounded-xl border transition-all duration-300 ${
        isActive 
          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
          : 'border-gray-700 bg-dark-surface/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'
      }`}
      onClick={onClick}
    >
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Active Indicator */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute top-0 left-0 w-full h-1 bg-primary"
        />
      )}

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-100 mb-2 group-hover:text-primary transition-colors">
              {project.title}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2 mb-3">
              {project.description}
            </p>
          </div>
          
          <div className="flex gap-2 ml-4">
            {project.demoUrl && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(project.demoUrl, '_blank');
                }}
                className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                aria-label="View live demo"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
            {project.githubUrl && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(project.githubUrl, '_blank');
                }}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                aria-label="View GitHub repository"
              >
                <Github className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status and Category */}
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyle}`}>
            {project.status}
          </span>
          <span className="px-3 py-1 rounded-full text-xs bg-gray-700 text-gray-300 border border-gray-600">
            <Tag className="w-3 h-3 inline mr-1" />
            {project.category}
          </span>
        </div>

        {/* Technologies */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {project.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="px-2 py-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-md"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="px-2 py-1 text-xs bg-gray-700 text-gray-400 border border-gray-600 rounded-md">
                +{project.technologies.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Calendar className="w-4 h-4" />
          <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
          {project.completionDate && (
            <span>• Completed: {new Date(project.completionDate).toLocaleDateString()}</span>
          )}
        </div>

        {/* Features Preview */}
        {project.features.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-2">Key Features:</p>
            <ul className="text-sm text-gray-400 space-y-1">
              {project.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="line-clamp-1">{feature}</span>
                </li>
              ))}
              {project.features.length > 3 && (
                <li className="text-primary text-xs">
                  +{project.features.length - 3} more features
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Call to Action */}
        <motion.div
          className="flex items-center justify-between pt-4 border-t border-gray-700"
          initial={false}
          animate={isActive ? { opacity: 1 } : { opacity: 0.7 }}
        >
          <span className="text-sm text-gray-400">
            {isActive ? 'Currently viewing' : 'Click to explore'}
          </span>
          <ArrowRight className={`w-4 h-4 transition-all duration-300 ${
            isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary group-hover:translate-x-1'
          }`} />
        </motion.div>
      </div>

      {/* Hover Effect - Image Preview (if available) */}
      {project.image && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300">
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </motion.div>
  );
};

export default ProjectCard;