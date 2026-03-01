/**
 * Assignment Manager Component
 * For instructors to create, manage, and grade assignments
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useAssignments } from '@/hooks/useAcademyAssignments';
import { format } from 'date-fns';

interface AssignmentManagerProps {
  readonly courseId: string;
  readonly isInstructor?: boolean;
}

export function AssignmentManager({ courseId, isInstructor = false }: AssignmentManagerProps) {
  const [selectedTab, setSelectedTab] = useState('all');
  const { data: assignments, isLoading } = useAssignments(courseId);

  const now = new Date();
  const upcomingAssignments = assignments?.filter((a) => new Date(a.due_date) > now) || [];
  const overdueAssignments = assignments?.filter((a) => new Date(a.due_date) < now) || [];

  const getStatusBadge = (dueDate: string) => {
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (daysUntilDue === 0) {
      return <Badge variant="destructive">Due Today</Badge>;
    } else if (daysUntilDue <= 3) {
      return <Badge variant="outline">Due Soon</Badge>;
    }
    return <Badge variant="secondary">Upcoming</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assignments</h2>
          <p className="text-muted-foreground mt-1">{assignments?.length || 0} total assignments</p>
        </div>
        {isInstructor && (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Assignment
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Assignments</p>
                <p className="text-2xl font-bold">{assignments?.length || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingAssignments.length}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueAssignments.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Assignments</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6 text-center">Loading...</CardContent>
            </Card>
          ) : assignments && assignments.length > 0 ? (
            assignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        {getStatusBadge(assignment.due_date)}
                        <Badge variant="outline">{assignment.assignment_type}</Badge>
                      </div>
                      <CardDescription>{assignment.description}</CardDescription>
                    </div>
                    {isInstructor && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p className="font-medium">
                        {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Max Score</p>
                      <p className="font-medium">{assignment.max_score} points</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Late Submission</p>
                      <p className="font-medium">
                        {assignment.allow_late_submission ? 'Allowed' : 'Not Allowed'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Late Penalty</p>
                      <p className="font-medium">{assignment.late_penalty_percent}%</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                    {isInstructor && (
                      <Button variant="outline" size="sm" className="gap-2">
                        <Users className="w-4 h-4" />
                        View Submissions
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
                <p className="text-muted-foreground">
                  {isInstructor
                    ? 'Create your first assignment to get started'
                    : 'No assignments have been created yet'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAssignments.length > 0 ? (
            upcomingAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{assignment.title}</CardTitle>
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <CardDescription>
                    Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <p className="text-muted-foreground">No upcoming assignments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {overdueAssignments.length > 0 ? (
            overdueAssignments.map((assignment) => (
              <Card key={assignment.id} className="border-red-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-red-600">{assignment.title}</CardTitle>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <CardDescription>
                    Was due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-2" />
                <p className="text-muted-foreground">No overdue assignments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
