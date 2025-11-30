/**
 * Search Dialog Component
 * Global search functionality with keyboard shortcuts
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Bot, FileText, GraduationCap, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Search items configuration
const searchItems = [
  // Pages
  { title: "Trang chủ", href: "/", icon: FileText, category: "Pages" },
  { title: "Academy", href: "/academy", icon: GraduationCap, category: "Pages" },
  { title: "AI Marketplace", href: "/marketplace", icon: Bot, category: "Pages" },
  { title: "Dự án", href: "/project-showcase", icon: FileText, category: "Pages" },
  { title: "Tư vấn", href: "/consultation", icon: FileText, category: "Pages" },
  { title: "Pricing", href: "/pricing", icon: FileText, category: "Pages" },

  // Admin
  { title: "Admin Dashboard", href: "/admin", icon: Bot, category: "Admin" },
  { title: "Automation", href: "/automation", icon: Bot, category: "Admin" },
  { title: "Agent Center", href: "/agent-center", icon: Bot, category: "Admin" },
  { title: "Analytics", href: "/admin/analytics", icon: Bot, category: "Admin" },
];

interface SearchDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(searchItems);
  const navigate = useNavigate();

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults(searchItems);
      return;
    }

    const filtered = searchItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
    );

    setResults(filtered);
  }, [query]);

  // Handle selection
  const handleSelect = (href: string) => {
    navigate(href);
    onOpenChange(false);
    setQuery("");
  };

  // Clear search
  const handleClear = () => {
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Quick navigation to pages and features</DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Type to search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto border-t">
          {results.length > 0 ? (
            <div className="p-2">
              {/* Group by category */}
              {["Pages", "Admin"].map((category) => {
                const categoryItems = results.filter((item) => item.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {category}
                    </div>
                    {categoryItems.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={item.href}
                          onClick={() => handleSelect(item.href)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-md",
                            "hover:bg-accent transition-colors text-left"
                          )}
                        >
                          <IconComponent className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="font-medium">{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No results found for "{query}"</p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t bg-muted/30 text-xs text-muted-foreground">
          <kbd className="px-2 py-1 bg-background border rounded">Ctrl</kbd> +{" "}
          <kbd className="px-2 py-1 bg-background border rounded">K</kbd> to open search
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Search trigger button
export function SearchTrigger({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <Search className="h-4 w-4" />
      <span className="hidden md:inline">Search...</span>
      <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}
