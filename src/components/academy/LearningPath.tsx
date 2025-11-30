/**
 * Learning Path Component
 * Visual journey for students to follow structured courses
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Circle,
  Lock,
  Clock,
  Award,
  TrendingUp,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface PathStep {
  id: string;
  title: string;
  description: string;
  duration: string;
  courses: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  isCurrent: boolean;
  skills: string[];
}

const learningPaths: PathStep[] = [
  {
    id: '1',
    title: 'AI Fundamentals',
    description: 'Nền tảng cơ bản về AI, Machine Learning, và OpenAI APIs',
    duration: '4 tuần',
    courses: 3,
    isCompleted: true,
    isUnlocked: true,
    isCurrent: false,
    skills: ['Python Basics', 'OpenAI API', 'Prompt Engineering'],
  },
  {
    id: '2',
    title: 'Vector Database & RAG',
    description: 'Học cách build semantic search và retrieval systems',
    duration: '3 tuần',
    courses: 2,
    isCompleted: false,
    isUnlocked: true,
    isCurrent: true,
    skills: ['pgvector', 'Embeddings', 'Semantic Search', 'RAG'],
  },
  {
    id: '3',
    title: 'AI Agent Development',
    description: 'Xây dựng autonomous agents với MCP và LangGraph',
    duration: '6 tuần',
    courses: 4,
    isCompleted: false,
    isUnlocked: true,
    isCurrent: false,
    skills: ['MCP Protocol', 'LangGraph', 'Multi-Agent', 'Tool Calling'],
  },
  {
    id: '4',
    title: 'Advanced AI Features',
    description: 'Multimodal AI, Streaming, và Production Deployment',
    duration: '5 tuần',
    courses: 3,
    isCompleted: false,
    isUnlocked: false,
    isCurrent: false,
    skills: ['Vision AI', 'Audio Processing', 'Real-time Streaming', 'Observability'],
  },
  {
    id: '5',
    title: 'Production AI Systems',
    description: 'Deploy, scale, và maintain AI applications in production',
    duration: '4 tuần',
    courses: 3,
    isCompleted: false,
    isUnlocked: false,
    isCurrent: false,
    skills: ['Edge Deployment', 'Monitoring', 'Cost Optimization', 'Security'],
  },
];

export function LearningPath() {
  const completedSteps = learningPaths.filter((step) => step.isCompleted).length;
  const totalSteps = learningPaths.length;
  const overallProgress = (completedSteps / totalSteps) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold mb-2">AI Engineer Learning Path</h2>
        <p className="text-muted-foreground">
          Lộ trình học tập có cấu trúc từ beginner đến production-ready AI Engineer
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold">
                {completedSteps} / {totalSteps} Completed
              </div>
              <div className="text-sm text-muted-foreground">
                Estimated time: {learningPaths.reduce((sum, p) => sum + parseInt(p.duration), 0)}{' '}
                weeks total
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-8 w-8 text-yellow-500" />
              <div className="text-right">
                <div className="font-semibold">AI Engineer</div>
                <div className="text-sm text-muted-foreground">Certificate</div>
              </div>
            </div>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Learning Path Steps */}
      <div className="relative space-y-6">
        {/* Vertical Line */}
        <div className="absolute left-6 top-12 bottom-12 w-0.5 bg-border" />

        {learningPaths.map((step, index) => {
          const isLast = index === learningPaths.length - 1;

          return (
            <div key={step.id} className="relative pl-16">
              {/* Step Indicator */}
              <div className="absolute left-0 top-6 flex items-center justify-center">
                <div
                  className={`
                  w-12 h-12 rounded-full flex items-center justify-center z-10
                  ${
                    step.isCompleted
                      ? 'bg-green-500 text-white'
                      : step.isCurrent
                        ? 'bg-primary text-white ring-4 ring-primary/20 animate-pulse'
                        : step.isUnlocked
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-muted/50 text-muted-foreground'
                  }
                `}
                >
                  {step.isCompleted ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : step.isUnlocked ? (
                    <Circle className="h-6 w-6" />
                  ) : (
                    <Lock className="h-6 w-6" />
                  )}
                </div>
              </div>

              {/* Step Content */}
              <Card
                className={`
                transition-all duration-300
                ${step.isCurrent ? 'ring-2 ring-primary shadow-lg' : ''}
                ${step.isUnlocked ? 'hover:shadow-md cursor-pointer' : 'opacity-60'}
              `}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{step.title}</CardTitle>
                        {step.isCurrent && <Badge variant="default">Current</Badge>}
                        {step.isCompleted && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        )}
                        {!step.isUnlocked && <Badge variant="outline">Locked</Badge>}
                      </div>
                      <CardDescription className="text-base">{step.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Metadata */}
                  <div className="flex items-center gap-6 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {step.duration}
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {step.courses} courses
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Skills you'll learn:</div>
                    <div className="flex flex-wrap gap-2">
                      {step.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          <Zap className="h-3 w-3 mr-1" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  {step.isUnlocked && (
                    <Button
                      className="w-full"
                      variant={step.isCurrent ? 'default' : 'outline'}
                      disabled={!step.isUnlocked}
                    >
                      {step.isCompleted ? 'Review' : step.isCurrent ? 'Continue Learning' : 'Start'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}

                  {!step.isUnlocked && (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      Complete previous steps to unlock
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Connector to next step */}
              {!isLast && (
                <div className="absolute left-6 top-[calc(100%+0.5rem)] h-6 w-0.5 bg-border" />
              )}
            </div>
          );
        })}
      </div>

      {/* Certificate Preview */}
      <Card className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Award className="h-16 w-16 text-primary" />
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Professional AI Engineer Certificate</h3>
              <p className="text-muted-foreground mb-4">
                Hoàn thành toàn bộ learning path để nhận certificate được công nhận bởi các doanh
                nghiệp hàng đầu
              </p>
              <div className="flex items-center gap-4">
                <Progress value={overallProgress} className="flex-1 h-2" />
                <span className="text-sm font-medium">{Math.round(overallProgress)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
