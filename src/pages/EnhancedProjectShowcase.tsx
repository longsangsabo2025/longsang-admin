import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Grid, BarChart3, Search as SearchIcon, Layers } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ProjectSEO } from "@/components/SEO";
import { SearchBar, ProjectFilters } from "@/components/SearchBar";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectComparison } from "@/components/ProjectComparison";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { enhancedProjectsData } from "@/data/enhanced-projects-data";

// Import existing components
import { ProjectHero } from "@/components/ProjectHero";
import { OverviewSection } from "@/components/OverviewSection";
import { TechArchitecture } from "@/components/TechArchitecture";
import { FeaturesGrid } from "@/components/FeaturesGrid";
import { StatsChart } from "@/components/StatsChart";
import { ProjectCTA } from "@/components/ProjectCTA";
import { projectsData } from "@/data/projects-data";

type ViewMode = 'showcase' | 'grid' | 'analytics';

const EnhancedProjectShowcase: React.FC = () => {
  const [activeProjectId, setActiveProjectId] = useState<string>('investment-portal');
  const [viewMode, setViewMode] = useState<ViewMode>('showcase');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProjectFilters>({
    technologies: [],
    status: [],
    category: []
  });
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  // Filter projects based on search and filters
  const filteredProjects = useMemo(() => {
    return enhancedProjectsData.filter(project => {
      // Search query filter
      const matchesSearch = searchQuery === '' || 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.technologies.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase())) ||
        project.features.some(feature => feature.toLowerCase().includes(searchQuery.toLowerCase()));

      // Technology filter
      const matchesTech = filters.technologies.length === 0 ||
        filters.technologies.some(tech => project.technologies.includes(tech));

      // Status filter
      const matchesStatus = filters.status.length === 0 ||
        filters.status.includes(project.status);

      // Category filter
      const matchesCategory = filters.category.length === 0 ||
        filters.category.includes(project.category);

      return matchesSearch && matchesTech && matchesStatus && matchesCategory;
    });
  }, [searchQuery, filters]);

  // Get active project for showcase view
  const activeProject = enhancedProjectsData.find(p => p.id === activeProjectId) || enhancedProjectsData[0];
  const legacyActiveProject = projectsData.find(p => p.id === parseInt(activeProjectId)) || projectsData[0];

  const handleProjectChange = useCallback((id: string) => {
    setActiveProjectId(id);
    setIsMobileMenuOpen(false);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFilterChange = useCallback((newFilters: ProjectFilters) => {
    setFilters(newFilters);
  }, []);

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const openComparison = () => {
    if (selectedProjects.length >= 2) {
      setIsComparisonOpen(true);
    }
  };

  const selectedProjectsData = enhancedProjectsData.filter(p => selectedProjects.includes(p.id));

  const renderGridView = () => (
    <div className="container mx-auto px-4 py-8">
      {/* Search and Filters */}
      <SearchBar 
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
      />

      {/* Selection Actions */}
      {selectedProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-primary">
              {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              {selectedProjects.length >= 2 && (
                <button
                  onClick={openComparison}
                  className="px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg transition-colors"
                >
                  Compare Projects
                </button>
              )}
              <button
                onClick={() => setSelectedProjects([])}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-gray-400">
          Showing {filteredProjects.length} of {enhancedProjectsData.length} projects
        </p>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              layout
              className="relative"
            >
              {/* Selection Checkbox */}
              <div className="absolute top-4 right-4 z-10">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProjects.includes(project.id)}
                    onChange={() => toggleProjectSelection(project.id)}
                    className="w-5 h-5 accent-primary"
                    aria-label={`Select ${project.title} for comparison`}
                  />
                </label>
              </div>
              <ProjectCard
                project={project}
                onClick={() => handleProjectChange(project.id)}
                isActive={project.id === activeProjectId}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-20">
          <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No projects found</h3>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );

  const renderShowcaseView = () => (
    <>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed left-0 top-0 h-full w-80 bg-dark-surface border-r border-gray-700 z-50 md:hidden overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-100">Projects</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-700"
                    aria-label="Close projects menu"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {enhancedProjectsData.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectChange(project.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      project.id === activeProjectId
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <div className="font-medium">{project.title}</div>
                    <div className="text-sm text-gray-400 line-clamp-1">{project.description}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 flex-shrink-0">
        <div className="h-full bg-dark-surface/50 border-r border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-100 mb-6">Projects</h2>
          <div className="space-y-3">
            {enhancedProjectsData.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectChange(project.id)}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  project.id === activeProjectId
                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-lg'
                    : 'hover:bg-gray-700 text-gray-300 border border-transparent'
                }`}
              >
                <div className="font-medium mb-1">{project.title}</div>
                <div className="text-sm text-gray-400 line-clamp-2">{project.description}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    project.status === 'Completed' ? 'bg-green-500/20 text-green-300' :
                    project.status === 'In Development' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          key={activeProject.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8 pb-8"
        >
          <ProjectHero project={legacyActiveProject} />
          <OverviewSection project={legacyActiveProject} />
          <TechArchitecture project={legacyActiveProject} />
          <FeaturesGrid project={legacyActiveProject} />
          <StatsChart project={legacyActiveProject} />
          <ProjectCTA project={legacyActiveProject} />
        </motion.div>
      </main>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg">
      <ProjectSEO project={legacyActiveProject} section="overview" />

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-primary/20 hover:bg-primary/30 backdrop-blur-sm rounded-lg p-3 border border-primary/20 transition-colors"
        aria-label="Toggle project menu"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6 text-primary" />}
      </button>

      {/* View Mode Toggle */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-dark-surface/80 backdrop-blur-sm border border-gray-700 rounded-lg p-1 hidden md:flex">
        <button
          onClick={() => setViewMode('showcase')}
          className={`p-2 rounded-md transition-colors ${
            viewMode === 'showcase' ? 'bg-primary text-primary-foreground' : 'text-gray-400 hover:text-gray-300'
          }`}
          aria-label="Showcase view"
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 rounded-md transition-colors ${
            viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-gray-400 hover:text-gray-300'
          }`}
          aria-label="Grid view"
        >
          <Grid className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode('analytics')}
          className={`p-2 rounded-md transition-colors ${
            viewMode === 'analytics' ? 'bg-primary text-primary-foreground' : 'text-gray-400 hover:text-gray-300'
          }`}
          aria-label="Analytics view"
        >
          <BarChart3 className="w-4 h-4" />
        </button>
      </div>

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {viewMode === 'showcase' && renderShowcaseView()}
        {viewMode === 'grid' && renderGridView()}
        {viewMode === 'analytics' && (
          <div className="flex-1">
            <AnalyticsDashboard projects={enhancedProjectsData} />
          </div>
        )}
      </div>

      {/* Project Comparison Modal */}
      <ProjectComparison
        projects={selectedProjectsData}
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
      />
    </div>
  );
};

export default EnhancedProjectShowcase;