import React, { useState, useCallback } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  onSearchChange: (query: string) => void;
  onFilterChange: (filters: ProjectFilters) => void;
  placeholder?: string;
}

export interface ProjectFilters {
  technologies: string[];
  status: string[];
  category: string[];
}

interface FilterDropdownProps {
  title: string;
  options: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  title,
  options,
  selected,
  onSelectionChange,
  isOpen,
  onToggle,
}) => {
  const handleOptionToggle = (option: string) => {
    if (selected.includes(option)) {
      onSelectionChange(selected.filter((item) => item !== option));
    } else {
      onSelectionChange([...selected, option]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
          isOpen || selected.length > 0
            ? 'bg-primary/20 border-primary/50 text-primary'
            : 'bg-dark-surface/50 border-gray-600 hover:border-gray-500'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">{title}</span>
        {selected.length > 0 && (
          <span className="bg-primary/80 text-primary-foreground text-xs px-2 py-0.5 rounded-full">
            {selected.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-56 bg-dark-surface border border-gray-600 rounded-lg shadow-xl z-50 p-2"
          >
            <div className="max-h-60 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionToggle(option)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selected.includes(option)
                      ? 'bg-primary/20 text-primary'
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {selected.includes(option) && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selected.length > 0 && (
              <div className="border-t border-gray-600 mt-2 pt-2">
                <button
                  onClick={() => onSelectionChange([])}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearchChange,
  onFilterChange,
  placeholder = 'Search projects...',
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ProjectFilters>({
    technologies: [],
    status: [],
    category: [],
  });
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // Technology options based on your projects
  const technologyOptions = [
    'React',
    'TypeScript',
    'Node.js',
    'Express',
    'Supabase',
    'PostgreSQL',
    'Tailwind CSS',
    'Framer Motion',
    'Next.js',
    'Vite',
    'Python',
    'FastAPI',
    'MongoDB',
    'Redis',
    'Docker',
    'AWS',
    'Vercel',
    'Firebase',
  ];

  const statusOptions = ['In Development', 'Completed', 'Planning', 'Beta', 'Live', 'Maintenance'];

  const categoryOptions = [
    'Web Application',
    'Mobile App',
    'Desktop App',
    'API/Backend',
    'Tool/Utility',
    'Game',
    'Portfolio',
    'E-commerce',
    'Blog',
    'Dashboard',
  ];

  const handleSearchChange = useCallback(
    (value: string) => {
      setQuery(value);
      onSearchChange(value);
    },
    [onSearchChange]
  );

  const handleFilterChange = useCallback(
    (newFilters: ProjectFilters) => {
      setFilters(newFilters);
      onFilterChange(newFilters);
    },
    [onFilterChange]
  );

  const clearSearch = () => {
    setQuery('');
    onSearchChange('');
  };

  const hasActiveFilters =
    filters.technologies.length > 0 || filters.status.length > 0 || filters.category.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      {/* Search Input */}
      <div className="relative mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-11 pr-12 py-3 bg-dark-surface/50 border border-gray-600 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-100 placeholder-gray-400"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <FilterDropdown
          title="Technologies"
          options={technologyOptions}
          selected={filters.technologies}
          onSelectionChange={(selected) =>
            handleFilterChange({ ...filters, technologies: selected })
          }
          isOpen={openFilter === 'technologies'}
          onToggle={() => setOpenFilter(openFilter === 'technologies' ? null : 'technologies')}
        />

        <FilterDropdown
          title="Status"
          options={statusOptions}
          selected={filters.status}
          onSelectionChange={(selected) => handleFilterChange({ ...filters, status: selected })}
          isOpen={openFilter === 'status'}
          onToggle={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
        />

        <FilterDropdown
          title="Category"
          options={categoryOptions}
          selected={filters.category}
          onSelectionChange={(selected) => handleFilterChange({ ...filters, category: selected })}
          isOpen={openFilter === 'category'}
          onToggle={() => setOpenFilter(openFilter === 'category' ? null : 'category')}
        />

        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => handleFilterChange({ technologies: [], status: [], category: [] })}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear all filters
          </motion.button>
        )}
      </div>

      {/* Active Filters Display */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {[...filters.technologies, ...filters.status, ...filters.category].map((filter) => (
              <motion.span
                key={filter}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary text-sm rounded-full border border-primary/30"
              >
                {filter}
                <button
                  onClick={() => {
                    if (filters.technologies.includes(filter)) {
                      handleFilterChange({
                        ...filters,
                        technologies: filters.technologies.filter((t) => t !== filter),
                      });
                    } else if (filters.status.includes(filter)) {
                      handleFilterChange({
                        ...filters,
                        status: filters.status.filter((s) => s !== filter),
                      });
                    } else if (filters.category.includes(filter)) {
                      handleFilterChange({
                        ...filters,
                        category: filters.category.filter((c) => c !== filter),
                      });
                    }
                  }}
                  className="hover:bg-primary/10 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${filter} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
