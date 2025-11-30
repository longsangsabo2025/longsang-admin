/**
 * Project Submission Component
 * Students submit their AI agent projects for review
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { AlertCircle, CheckCircle2, ExternalLink, Github, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ProjectSubmissionProps {
  lessonId: string;
  courseId: string;
  userId: string;
}

export function ProjectSubmission({ lessonId, courseId, userId }: ProjectSubmissionProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    github_url: "",
    demo_url: "",
    screenshots: [] as string[],
  });

  const [submitting, setSubmitting] = useState(false);
  const [aiReviewing, setAiReviewing] = useState(false);
  const [aiReview, setAiReview] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error("Please fill in required fields");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Submit to database
      const { data: submission, error } = await supabase
        .from("project_submissions")
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          course_id: courseId,
          title: formData.title,
          description: formData.description,
          github_url: formData.github_url,
          demo_url: formData.demo_url,
          screenshots: formData.screenshots,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Project submitted successfully!");

      // 2. Trigger AI review
      setAiReviewing(true);
      await generateAIReview(submission.id);

      // 3. Award XP for submission
      await awardSubmissionXP(userId);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit project");
    } finally {
      setSubmitting(false);
    }
  };

  const generateAIReview = async (submissionId: string) => {
    try {
      const response = await fetch("http://localhost:3001/api/ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          title: formData.title,
          description: formData.description,
          github_url: formData.github_url,
          demo_url: formData.demo_url,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAiReview(data.review);

        // Update submission with AI review
        await supabase
          .from("project_submissions")
          .update({
            ai_review: data.review,
            status: "under_review",
          })
          .eq("id", submissionId);

        toast.success("AI review complete!");
      }
    } catch (error) {
      console.error("AI review error:", error);
    } finally {
      setAiReviewing(false);
    }
  };

  const awardSubmissionXP = async (userId: string) => {
    // Award 100 XP for project submission
    const { data: achievement } = await supabase
      .from("user_achievements")
      .insert({
        user_id: userId,
        achievement_type: "project_submitted",
        achievement_name: "Project Submitted",
        xp_awarded: 100,
        metadata: {
          lesson_id: lessonId,
          project_title: formData.title,
        },
      })
      .select()
      .single();

    if (achievement) {
      toast.success("+100 XP earned!", {
        icon: <Sparkles className="w-4 h-4 text-yellow-500" />,
      });
    }
  };

  return (
    <Card className="p-6 bg-gray-900/50 border-purple-500/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-white">Submit Your Project</h3>
          <p className="text-sm text-gray-400">Share your AI agent for review</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-white">
            Project Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            placeholder="My Awesome AI Email Assistant"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-white">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Describe what your AI agent does, what problem it solves, and how you built it..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
            required
          />
          <p className="text-xs text-gray-500">
            Tip: Include challenges you faced and how you overcame them
          </p>
        </div>

        {/* GitHub URL */}
        <div className="space-y-2">
          <Label htmlFor="github" className="text-white flex items-center gap-2">
            <Github className="w-4 h-4" />
            GitHub Repository URL
          </Label>
          <Input
            id="github"
            type="url"
            placeholder="https://github.com/yourusername/ai-email-assistant"
            value={formData.github_url}
            onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>

        {/* Demo URL */}
        <div className="space-y-2">
          <Label htmlFor="demo" className="text-white flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Live Demo URL
          </Label>
          <Input
            id="demo"
            type="url"
            placeholder="https://your-agent.railway.app"
            value={formData.demo_url}
            onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={submitting || aiReviewing}
          className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Submitting...
            </>
          ) : aiReviewing ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              AI Reviewing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Submit Project
            </>
          )}
        </Button>
      </form>

      {/* AI Review Result */}
      {aiReview && (
        <div className="mt-6 p-6 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h4 className="font-bold text-white">AI Review</h4>
            <Badge variant="outline" className="ml-auto">
              Score: {aiReview.score}/100
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Strengths */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <h5 className="font-semibold text-green-400">Strengths</h5>
              </div>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                {aiReview.strengths?.map((strength: string, i: number) => (
                  <li key={i}>{strength}</li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <h5 className="font-semibold text-yellow-400">Areas for Improvement</h5>
              </div>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                {aiReview.improvements?.map((improvement: string, i: number) => (
                  <li key={i}>{improvement}</li>
                ))}
              </ul>
            </div>

            {/* Feedback */}
            <div>
              <h5 className="font-semibold text-white mb-2">Overall Feedback</h5>
              <p className="text-sm text-gray-300">{aiReview.feedback}</p>
            </div>

            {/* Next Steps */}
            {aiReview.next_steps && (
              <div className="pt-4 border-t border-purple-500/20">
                <h5 className="font-semibold text-cyan-400 mb-2">Recommended Next Steps</h5>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                  {aiReview.next_steps.map((step: string, i: number) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
