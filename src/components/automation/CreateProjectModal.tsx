import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Sparkles } from 'lucide-react';

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const PROJECT_TEMPLATES = {
  ecommerce: {
    name: 'E-Commerce Store',
    icon: '🛍️',
    description: 'Product descriptions, customer support, cart recovery',
    suggestedAgents: [
      { name: 'Product Description Writer', type: 'content_writer' },
      { name: 'Customer Review Responder', type: 'custom' },
      { name: 'Cart Recovery Agent', type: 'lead_nurture' },
    ],
  },
  crm: {
    name: 'CRM & Sales',
    icon: '🎯',
    description: 'Lead qualification, follow-ups, meeting notes',
    suggestedAgents: [
      { name: 'Lead Qualifier', type: 'analytics' },
      { name: 'Sales Follow-up Bot', type: 'lead_nurture' },
      { name: 'Meeting Notes AI', type: 'custom' },
    ],
  },
  marketing: {
    name: 'Marketing Hub',
    icon: '✍️',
    description: 'Content generation, social media, email campaigns',
    suggestedAgents: [
      { name: 'Blog Content Generator', type: 'content_writer' },
      { name: 'Social Media Manager', type: 'social_media' },
      { name: 'Email Campaign AI', type: 'lead_nurture' },
    ],
  },
  operations: {
    name: 'Operations & Productivity',
    icon: '⚡',
    description: 'Task management, document processing, reporting',
    suggestedAgents: [
      { name: 'Task Prioritizer AI', type: 'analytics' },
      { name: 'Document Summarizer', type: 'custom' },
      { name: 'Weekly Report Generator', type: 'analytics' },
    ],
  },
  website: {
    name: 'Website Automation',
    icon: '🌐',
    description: 'SEO optimization, chat support, content management',
    suggestedAgents: [
      { name: 'SEO Optimizer', type: 'content_writer' },
      { name: 'Chat Support Bot', type: 'custom' },
      { name: 'Content Scheduler', type: 'custom' },
    ],
  },
  custom: {
    name: 'Custom Project',
    icon: '🔧',
    description: 'Create your own project from scratch',
    suggestedAgents: [],
  },
};

export const CreateProjectModal = ({ open, onOpenChange, onSuccess }: CreateProjectModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form state
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof PROJECT_TEMPLATES | ''>('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  const handleTemplateSelect = (template: keyof typeof PROJECT_TEMPLATES) => {
    setSelectedTemplate(template);
    const templateData = PROJECT_TEMPLATES[template];
    
    // Auto-fill project name and description
    if (!projectName) {
      setProjectName(`My ${templateData.name}`);
    }
    if (!projectDescription) {
      setProjectDescription(templateData.description);
    }
    
    // Pre-select all suggested agents
    setSelectedAgents(templateData.suggestedAgents.map(a => a.name));
    
    setStep(2);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const template = PROJECT_TEMPLATES[selectedTemplate as keyof typeof PROJECT_TEMPLATES];
      const agentsToCreate = template.suggestedAgents.filter(a => 
        selectedAgents.includes(a.name)
      );

      // Create agents for the project
      for (const agent of agentsToCreate) {
        const { error } = await supabase
          .from('ai_agents')
          .insert({
            name: agent.name,
            type: agent.type,
            category: selectedTemplate,
            status: 'paused',
            description: `${agent.name} for ${projectName}`,
            config: {
              ai_model: 'gpt-4o-mini',
              auto_publish: false,
              require_approval: true,
              tone: 'professional',
            },
          });

        if (error) throw error;
      }

      toast({
        title: "✅ Project Created!",
        description: `${projectName} with ${agentsToCreate.length} agents created successfully`,
      });

      // Reset form
      setProjectName('');
      setProjectDescription('');
      setSelectedTemplate('');
      setSelectedAgents([]);
      setStep(1);
      
      onOpenChange(false);
      onSuccess?.();

    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setStep(1);
      setProjectName('');
      setProjectDescription('');
      setSelectedTemplate('');
      setSelectedAgents([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Set up a new automation project with pre-configured agents
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              1
            </div>
            <span className="text-sm font-medium">Choose Template</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <span className="text-sm font-medium">Configure</span>
          </div>
        </div>

        {/* Step 1: Choose Template */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose a Project Template</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(PROJECT_TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateSelect(key as keyof typeof PROJECT_TEMPLATES)}
                    className="p-4 border-2 rounded-lg hover:border-primary hover:bg-accent transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{template.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold group-hover:text-primary transition-colors">
                          {template.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        {template.suggestedAgents.length > 0 && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {template.suggestedAgents.length} agents
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Configure Project */}
        {step === 2 && selectedTemplate && (
          <div className="space-y-6">
            {/* Project Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., My E-Commerce Store"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe what this project is for..."
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>

            {/* Select Agents */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Select Agents to Create ({selectedAgents.length} selected)
              </Label>
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                {PROJECT_TEMPLATES[selectedTemplate].suggestedAgents.map((agent) => (
                  <div key={agent.name} className="flex items-start gap-3">
                    <Checkbox
                      id={agent.name}
                      checked={selectedAgents.includes(agent.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAgents([...selectedAgents, agent.name]);
                        } else {
                          setSelectedAgents(selectedAgents.filter(a => a !== agent.name));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={agent.name} 
                        className="font-medium cursor-pointer"
                      >
                        {agent.name}
                      </Label>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {agent.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                All agents will be created in 'paused' status. You can configure and activate them later.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={isLoading || !projectName.trim() || selectedAgents.length === 0}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project with {selectedAgents.length} Agent{selectedAgents.length === 1 ? '' : 's'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
