/**
 * 📚 Prompt Templates Dialog
 * UI để chọn và sử dụng prompt templates
 */

import { BookOpen, Check, Copy, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getTemplatesByCategory,
  PromptTemplate,
  SYSTEM_TEMPLATES,
  searchTemplates,
  TEMPLATE_CATEGORIES,
} from '@/lib/prompt-templates';

interface PromptTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: string; // Filter by category
  onSelectTemplate: (template: PromptTemplate) => void;
}

export function PromptTemplatesDialog({
  open,
  onOpenChange,
  category,
  onSelectTemplate,
}: PromptTemplatesDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(category || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let templates = SYSTEM_TEMPLATES;

    if (selectedCategory) {
      templates = getTemplatesByCategory(selectedCategory);
    }

    if (search) {
      templates = searchTemplates(search).filter(
        (t) => !selectedCategory || t.category === selectedCategory
      );
    }

    return templates;
  }, [search, selectedCategory]);

  const handleCopy = (template: PromptTemplate) => {
    navigator.clipboard.writeText(template.prompt);
    setCopiedId(template.id);
    toast.success('Đã copy prompt!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelect = (template: PromptTemplate) => {
    onSelectTemplate(template);
    toast.success(`Đã chọn template: ${template.name}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-500" />
            Thư viện Prompt Templates
          </DialogTitle>
          <DialogDescription>Chọn template có sẵn hoặc tìm kiếm theo từ khóa</DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm template..."
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Tất cả
          </Button>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Templates List */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không tìm thấy template phù hợp
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:bg-accent/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {TEMPLATE_CATEGORIES.find((c) => c.value === template.category)?.label ||
                          template.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Tags */}
                    <div className="flex gap-1 flex-wrap mb-3">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Preview */}
                    <pre className="bg-slate-950 rounded-md p-3 text-xs text-slate-300 max-h-[100px] overflow-auto mb-3 font-mono whitespace-pre-wrap">
                      {template.prompt.substring(0, 300)}...
                    </pre>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleCopy(template)}>
                        {copiedId === template.id ? (
                          <Check className="h-4 w-4 mr-1 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        Copy
                      </Button>
                      <Button size="sm" onClick={() => handleSelect(template)}>
                        Sử dụng Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="text-xs text-muted-foreground text-center pt-2">
          {filteredTemplates.length} templates • System templates by AI Marketing Expert
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PromptTemplatesDialog;
