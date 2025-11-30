import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Tag, ExternalLink, Github, TrendingUp, Users, Check, AlertCircle } from 'lucide-react';
import { ProjectCardData } from './ProjectCard';

interface ProjectComparisonProps {
  projects: ProjectCardData[];
  isOpen: boolean;
  onClose: () => void;
}

const ComparisonMetric: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}> = ({ icon, label, value, color = 'text-gray-300' }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface/30">
    <div className={`text-primary ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-200">{value}</p>
    </div>
  </div>
);

const TechnologyComparison: React.FC<{
  projects: ProjectCardData[];
}> = ({ projects }) => {
  // Get all unique technologies across projects
  const allTechs = Array.from(new Set(projects.flatMap(p => p.technologies)));
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <Tag className="w-4 h-4" />
        Technology Stack Comparison
      </h4>
      <div className="grid grid-cols-1 gap-2">
        {allTechs.map(tech => (
          <div key={tech} className="flex items-center gap-3 p-2 rounded bg-dark-surface/20">
            <span className="text-sm text-gray-300 flex-1">{tech}</span>
            <div className="flex gap-1">
              {projects.map((project, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full ${
                    project.technologies.includes(tech)
                      ? 'bg-primary'
                      : 'bg-gray-600'
                  }`}
                  title={`${project.title}: ${project.technologies.includes(tech) ? 'Used' : 'Not used'}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FeatureComparison: React.FC<{
  projects: ProjectCardData[];
}> = ({ projects }) => {
  // Get all unique features across projects
  const allFeatures = Array.from(new Set(projects.flatMap(p => p.features || [])));
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <Check className="w-4 h-4" />
        Feature Comparison
      </h4>
      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
        {allFeatures.slice(0, 10).map(feature => (
          <div key={feature} className="flex items-start gap-3 p-2 rounded bg-dark-surface/20">
            <span className="text-sm text-gray-300 flex-1">{feature}</span>
            <div className="flex gap-1">
              {projects.map((project, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full ${
                    project.features?.includes(feature)
                      ? 'bg-green-500'
                      : 'bg-gray-600'
                  }`}
                  title={`${project.title}: ${project.features?.includes(feature) ? 'Has feature' : 'No feature'}`}
                />
              ))}
            </div>
          </div>
        ))}
        {allFeatures.length > 10 && (
          <p className="text-xs text-gray-400 text-center">
            +{allFeatures.length - 10} more features
          </p>
        )}
      </div>
    </div>
  );
};

export const ProjectComparison: React.FC<ProjectComparisonProps> = ({
  projects,
  isOpen,
  onClose
}) => {
  if (projects.length < 2) return null;

  const calculateDuration = (startDate: string, completionDate?: string) => {
    const start = new Date(startDate);
    const end = completionDate ? new Date(completionDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Comparison Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-6xl max-h-[90vh] bg-dark-bg border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-100">Project Comparison</h2>
                <p className="text-gray-400">Compare {projects.length} projects side by side</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                aria-label="Close comparison"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Project Headers */}
              <div className={`grid grid-cols-${Math.min(projects.length, 3)} gap-6 mb-8`}>
                {projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="text-center">
                    <div className="w-full aspect-video bg-dark-surface rounded-lg mb-4 overflow-hidden">
                      {project.image ? (
                        <img
                          src={project.image}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <Tag className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-100 mb-2">{project.title}</h3>
                    <p className="text-sm text-gray-400 mb-4">{project.description}</p>
                    
                    {/* Project Links */}
                    <div className="flex justify-center gap-2">
                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                          aria-label={`View ${project.title} demo`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                          aria-label={`View ${project.title} source code`}
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Metrics */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
                    Project Metrics
                  </h3>
                  
                  {projects.slice(0, 3).map((project) => (
                    <div key={`metrics-${project.id}`} className="space-y-3">
                      <h4 className="font-medium text-primary">{project.title}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <ComparisonMetric
                          icon={<Calendar className="w-4 h-4" />}
                          label="Duration"
                          value={calculateDuration(project.startDate, project.completionDate)}
                        />
                        <ComparisonMetric
                          icon={<Tag className="w-4 h-4" />}
                          label="Category"
                          value={project.category}
                        />
                        <ComparisonMetric
                          icon={<TrendingUp className="w-4 h-4" />}
                          label="Status"
                          value={project.status}
                          color={project.status === 'Completed' ? 'text-green-400' : 
                                 project.status === 'In Development' ? 'text-yellow-400' : 
                                 'text-blue-400'}
                        />
                        <ComparisonMetric
                          icon={<Users className="w-4 h-4" />}
                          label="Technologies"
                          value={`${project.technologies.length} techs`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Technology & Feature Comparison */}
                <div className="space-y-6">
                  <TechnologyComparison projects={projects.slice(0, 3)} />
                  <FeatureComparison projects={projects.slice(0, 3)} />
                </div>
              </div>

              {/* Project Descriptions */}
              <div className="mt-8 space-y-6">
                <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
                  Detailed Descriptions
                </h3>
                {projects.slice(0, 3).map((project) => (
                  <div key={`desc-${project.id}`} className="p-4 rounded-lg bg-dark-surface/30">
                    <h4 className="font-medium text-primary mb-2">{project.title}</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {project.longDescription || project.description}
                    </p>
                    {project.challenges && project.challenges.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Key Challenges:
                        </p>
                        <ul className="text-xs text-gray-400 space-y-1">
                          {project.challenges.slice(0, 3).map((challenge, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-yellow-400">•</span>
                              {challenge}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProjectComparison;