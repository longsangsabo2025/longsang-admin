/**
 * Learning Path Page
 * Complete view of structured learning journey
 */

import { LearningPath } from '@/components/academy/LearningPath';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, Users, Zap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LearningPathPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <Button
            variant="ghost"
            onClick={() => navigate('/academy')}
            className="mb-6 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Academy
          </Button>

          <div className="max-w-4xl">
            <Badge className="bg-white/20 text-white mb-4">Professional Track</Badge>
            <h1 className="text-5xl font-bold mb-4">AI Engineer Learning Path</h1>
            <p className="text-xl text-white/90 mb-8">
              Lộ trình đào tạo có cấu trúc từ zero to hero. Được thiết kế bởi các AI architects với
              kinh nghiệm production thực tế.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">22 tuần</div>
                <div className="text-white/80 text-sm">Total Duration</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">15+</div>
                <div className="text-white/80 text-sm">Courses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50+</div>
                <div className="text-white/80 text-sm">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">100%</div>
                <div className="text-white/80 text-sm">Job Ready</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Target className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Structured Learning</CardTitle>
              <CardDescription>
                Step-by-step curriculum được thiết kế để build solid foundation trước khi chuyển
                sang advanced topics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Trophy className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Real Projects</CardTitle>
              <CardDescription>
                Mỗi module đều có hands-on projects thực tế để apply kiến thức ngay lập tức vào
                production scenarios
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Expert Mentorship</CardTitle>
              <CardDescription>
                Direct support từ senior AI engineers và architects với experience từ top tech
                companies
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Learning Path Component */}
        <LearningPath />

        {/* What You'll Build */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">What You'll Build</CardTitle>
              <CardDescription>
                Real-world projects bạn sẽ hoàn thành trong learning path
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Custom MCP Server',
                    description: 'Build automation tools server với 10+ custom tools',
                    tech: ['MCP', 'TypeScript', 'N8N'],
                  },
                  {
                    title: 'RAG Search Engine',
                    description: 'Semantic search engine với pgvector và OpenAI embeddings',
                    tech: ['pgvector', 'RAG', 'PostgreSQL'],
                  },
                  {
                    title: 'Multi-Agent System',
                    description: 'LangGraph workflow với 6 specialized agents',
                    tech: ['LangGraph', 'State Machines', 'Workflows'],
                  },
                  {
                    title: 'AI Chat Platform',
                    description: 'Real-time streaming chat với function calling',
                    tech: ['WebSocket', 'Streaming', 'OpenAI'],
                  },
                  {
                    title: 'Multimodal AI App',
                    description: 'Process images, audio, video với GPT-4 Vision & Whisper',
                    tech: ['Vision AI', 'Audio', 'DALL-E'],
                  },
                  {
                    title: 'Production AI System',
                    description: 'Full-stack AI application với monitoring và observability',
                    tech: ['LangSmith', 'Edge Deploy', 'Monitoring'],
                  },
                ].map((project, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Zap className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">{project.title}</h4>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold mb-4">Ready to Start Your Journey?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join 15,000+ students who are mastering AI development. Get lifetime access to all
                courses, projects, and community support.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button size="lg" onClick={() => navigate('/academy')}>
                  Browse All Courses
                </Button>
                <Button size="lg" variant="outline">
                  Talk to Advisor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
