/**
 * Knowledge Ingestion Component
 * Form to add new knowledge to the brain
 */

import { useDomains } from '@/brain/hooks/useDomains';
import { useIngestKnowledge } from '@/brain/hooks/useKnowledge';
import type { IngestKnowledgeInput } from '@/brain/types/brain.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';

interface KnowledgeIngestionProps {
  readonly selectedDomainId?: string | null;
}

export function KnowledgeIngestion({ selectedDomainId }: KnowledgeIngestionProps) {
  const { data: domains } = useDomains();
  const ingestKnowledge = useIngestKnowledge();

  const [formData, setFormData] = useState<IngestKnowledgeInput>({
    domainId: selectedDomainId || '',
    title: '',
    content: '',
    contentType: 'document',
    tags: [],
    metadata: {},
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.domainId || !formData.title || !formData.content) {
      return;
    }

    try {
      await ingestKnowledge.mutateAsync(formData);
      // Reset form
      setFormData({
        domainId: selectedDomainId || '',
        title: '',
        content: '',
        contentType: 'document',
        tags: [],
        metadata: {},
      });
      setTagInput('');
    } catch {
      // Error handled by hook
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Domain Selector */}
      <div>
        <Label htmlFor="domain">Domain *</Label>
        <Select
          value={formData.domainId}
          onValueChange={(value) => setFormData({ ...formData, domainId: value })}
        >
          <SelectTrigger id="domain">
            <SelectValue placeholder="Select a domain" />
          </SelectTrigger>
          <SelectContent>
            {domains?.length ? (
              domains.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  {domain.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="__no_domains__" disabled>
                No domains available. Create one first.
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {!domains?.length && (
          <p className="text-sm text-muted-foreground mt-1">
            You need to create a domain first before adding knowledge.
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Meeting Notes: Q4 Planning"
          required
        />
      </div>

      {/* Content */}
      <div>
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Enter your knowledge content here..."
          rows={10}
          required
        />
        <p className="text-sm text-muted-foreground mt-1">
          The system will automatically generate embeddings for semantic search.
        </p>
      </div>

      {/* Content Type */}
      <div>
        <Label htmlFor="contentType">Content Type</Label>
        <Select
          value={formData.contentType}
          onValueChange={(value: IngestKnowledgeInput['contentType']) =>
            setFormData({ ...formData, contentType: value })
          }
        >
          <SelectTrigger id="contentType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="document">Document</SelectItem>
            <SelectItem value="note">Note</SelectItem>
            <SelectItem value="conversation">Conversation</SelectItem>
            <SelectItem value="external">External Source</SelectItem>
            <SelectItem value="code">Code</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div>
        <Label htmlFor="tags">Tags</Label>
        <div className="flex gap-2 mb-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag and press Enter"
          />
          <Button type="button" variant="outline" onClick={addTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.tags && formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={
          !formData.domainId || !formData.title || !formData.content || ingestKnowledge.isPending
        }
        className="w-full"
      >
        {ingestKnowledge.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding Knowledge...
          </>
        ) : (
          'Add Knowledge'
        )}
      </Button>
    </form>
  );
}
