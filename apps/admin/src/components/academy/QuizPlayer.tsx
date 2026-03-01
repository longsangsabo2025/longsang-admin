/**
 * Quiz Player Component
 * Interactive quiz taking experience
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  useQuiz,
  useStartQuizAttempt,
  useSaveQuizAnswers,
  useSubmitQuiz,
} from '@/hooks/useAcademyQuizzes';

interface QuizPlayerProps {
  readonly quizId: string;
  readonly onComplete?: (score: number, passed: boolean) => void;
}

export function QuizPlayer({ quizId, onComplete }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: quiz, isLoading } = useQuiz(quizId);
  const startAttempt = useStartQuizAttempt();
  const saveAnswers = useSaveQuizAnswers();
  const submitQuiz = useSubmitQuiz();

  // Initialize quiz attempt
  useEffect(() => {
    if (quiz && !attemptId) {
      startAttempt.mutate(quizId, {
        onSuccess: (data) => {
          setAttemptId(data.id);
          setStartTime(new Date());
          if (quiz.time_limit_minutes) {
            setTimeRemaining(quiz.time_limit_minutes * 60);
          }
        },
      });
    }
  }, [quiz, quizId, attemptId, startAttempt]);

  // Timer countdown
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Auto-save answers
  useEffect(() => {
    if (attemptId && Object.keys(answers).length > 0) {
      const timer = setTimeout(() => {
        saveAnswers.mutate({ attemptId, answers });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [answers, attemptId, saveAnswers]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">Loading quiz...</CardContent>
      </Card>
    );
  }

  if (!quiz || !quiz.questions) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">Quiz not found</CardContent>
      </Card>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isTimeWarning = timeRemaining !== null && timeRemaining < 300; // 5 minutes
  const isTimeUp = timeRemaining === 0;

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!attemptId || !startTime) return;

    setIsSubmitting(true);
    const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

    submitQuiz.mutate(
      { attemptId, timeSpentSeconds: timeSpent },
      {
        onSuccess: (result) => {
          setIsSubmitting(false);
          onComplete?.(result.score || 0, result.passed || false);
        },
      }
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{quiz.title}</CardTitle>
              <CardDescription>{quiz.description}</CardDescription>
            </div>
            <div className="text-right">
              <Badge variant={quiz.quiz_type === 'exam' ? 'destructive' : 'secondary'}>
                {quiz.quiz_type}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress and Timer */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </span>
                {timeRemaining !== null && (
                  <span
                    className={`text-sm font-medium flex items-center gap-1 ${
                      isTimeUp ? 'text-red-600' : isTimeWarning ? 'text-amber-600' : ''
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    {formatTime(timeRemaining)}
                  </span>
                )}
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {isTimeUp && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-600">Time is up! Please submit your quiz.</span>
              </div>
            )}

            {isTimeWarning && !isTimeUp && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-amber-600">
                  Time is running out! {formatTime(timeRemaining)} remaining.
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.question_text}</CardTitle>
          <CardDescription>
            {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {currentQuestion.question_type === 'multiple_choice' && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="cursor-pointer flex-1">
                      {option.option_text}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {currentQuestion.question_type === 'true_false' && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true" className="cursor-pointer">
                    True
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false" className="cursor-pointer">
                    False
                  </Label>
                </div>
              </div>
            </RadioGroup>
          )}

          {currentQuestion.question_type === 'short_answer' && (
            <input
              type="text"
              placeholder="Enter your answer"
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md"
            />
          )}

          {currentQuestion.question_type === 'essay' && (
            <Textarea
              placeholder="Enter your essay answer"
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              rows={6}
            />
          )}

          {currentQuestion.explanation && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Explanation:</strong> {currentQuestion.explanation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <Button onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
            {quiz.questions.map((_, index) => (
              <Button
                key={index}
                variant={index === currentQuestionIndex ? 'default' : 'outline'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {answers[quiz.questions[index].id] ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
