/**
 * Learning Analytics Dashboard
 * Comprehensive student and course analytics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, CheckCircle2, Clock, Target, Award, AlertCircle } from 'lucide-react';
import { useStudentProgressReport, useClassPerformanceReport } from '@/hooks/useAcademyAnalytics';

interface LearningAnalyticsDashboardProps {
  readonly courseId: string;
  readonly userId?: string;
  readonly isInstructor?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function LearningAnalyticsDashboard({
  courseId,
  userId,
  isInstructor = false,
}: LearningAnalyticsDashboardProps) {
  const { data: studentReport } = useStudentProgressReport(userId || '', courseId);
  const { data: classReport } = useClassPerformanceReport(courseId);

  if (!isInstructor && !userId) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-2" />
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Analytics */}
      {!isInstructor && studentReport && (
        <>
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <p className="text-2xl font-bold">{studentReport.completion_percentage}%</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Engagement</p>
                    <p className="text-2xl font-bold">
                      {Math.round(studentReport.analytics.engagement_score || 0)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Time Spent</p>
                    <p className="text-2xl font-bold">
                      {studentReport.analytics.total_time_spent_minutes}m
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Quiz Score</p>
                    <p className="text-2xl font-bold">
                      {Math.round(studentReport.analytics.average_quiz_score || 0)}%
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bars */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Lessons</span>
                  <span className="text-sm text-muted-foreground">
                    {studentReport.analytics.lessons_completed} /{' '}
                    {studentReport.analytics.lessons_total}
                  </span>
                </div>
                <Progress
                  value={
                    (studentReport.analytics.lessons_completed /
                      studentReport.analytics.lessons_total) *
                    100
                  }
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Assignments</span>
                  <span className="text-sm text-muted-foreground">
                    {studentReport.analytics.assignments_completed} /{' '}
                    {studentReport.analytics.assignments_total}
                  </span>
                </div>
                <Progress
                  value={
                    (studentReport.analytics.assignments_completed /
                      studentReport.analytics.assignments_total) *
                    100
                  }
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Quizzes</span>
                  <span className="text-sm text-muted-foreground">
                    {studentReport.analytics.quizzes_completed} /{' '}
                    {studentReport.analytics.quizzes_total}
                  </span>
                </div>
                <Progress
                  value={
                    (studentReport.analytics.quizzes_completed /
                      studentReport.analytics.quizzes_total) *
                    100
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Tabs defaultValue="submissions" className="w-full">
            <TabsList>
              <TabsTrigger value="submissions">Recent Submissions</TabsTrigger>
              <TabsTrigger value="quizzes">Recent Quizzes</TabsTrigger>
            </TabsList>

            <TabsContent value="submissions" className="space-y-4">
              {studentReport.recent_submissions.length > 0 ? (
                studentReport.recent_submissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{submission.assignment?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {submission.grade ? (
                            <>
                              <p className="text-2xl font-bold">{submission.grade}</p>
                              <Badge variant="secondary">Graded</Badge>
                            </>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No submissions yet
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="quizzes" className="space-y-4">
              {studentReport.recent_quizzes.length > 0 ? (
                studentReport.recent_quizzes.map((attempt) => (
                  <Card key={attempt.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{attempt.quiz?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Completed: {new Date(attempt.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{attempt.percentage}%</p>
                          <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                            {attempt.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No quiz attempts yet
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Instructor Class Analytics */}
      {isInstructor && classReport && (
        <>
          {/* Class Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">{classReport.total_students}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Engagement</p>
                    <p className="text-2xl font-bold">{classReport.average_engagement}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold">{classReport.completion_rate}%</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Needs Support</p>
                    <p className="text-2xl font-bold">{classReport.needs_support.length}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Students with highest engagement scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classReport.top_performers.map((student, index) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <div>
                        <p className="font-medium">Student {index + 1}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.lessons_completed} lessons completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {Math.round(student.engagement_score || 0)}%
                      </p>
                      <Award className="w-4 h-4 text-yellow-500 mx-auto mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Students Needing Support */}
          <Card>
            <CardHeader>
              <CardTitle>Students Needing Support</CardTitle>
              <CardDescription>Students with engagement below 50%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classReport.needs_support.length > 0 ? (
                  classReport.needs_support.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">Student</p>
                        <p className="text-sm text-muted-foreground">
                          {student.lessons_completed} / {student.lessons_total} lessons
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          {Math.round(student.engagement_score || 0)}%
                        </p>
                        <AlertCircle className="w-4 h-4 text-red-500 mx-auto mt-1" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    All students are doing well!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
