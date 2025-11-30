import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XPBar } from "@/components/academy/XPBar";
import { BadgeShowcase } from "@/components/academy/BadgeShowcase";
import { LeaderboardCard } from "@/components/academy/LeaderboardCard";
import { StudyGroups } from "@/components/academy/StudyGroups";
import { LiveSessions } from "@/components/academy/LiveSessions";
import { ProjectSubmission } from "@/components/academy/ProjectSubmission";
import { AIAssistant } from "@/components/academy/AIAssistant";
import { BookOpen, Code } from "lucide-react";
import { useState } from "react";

export const GamingRightSidebar = () => {
  // Demo data - trong production sẽ lấy từ auth user
  const userId = "demo-user-123";
  const userLevel = 5;
  const [showProjectSubmission, setShowProjectSubmission] = useState(false);
  
  return (
    <aside className="fixed right-0 top-[70px] bottom-0 w-[300px] glass-card border-l border-border/50 hidden xl:block overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* XP Progress - REAL COMPONENT */}
        <XPBar />

        <Separator className="bg-border/50" />

        {/* Achievement Badges - REAL COMPONENT */}
        <BadgeShowcase />

        <Separator className="bg-border/50" />

        {/* Quick Actions */}
        <Card className="glass-card p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Code className="h-4 w-4" />
            NỘP DỰ ÁN
          </h3>
          <Button 
            onClick={() => setShowProjectSubmission(!showProjectSubmission)}
            className="w-full bg-gaming-purple hover:bg-gaming-purple/80 text-white"
            size="sm"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            {showProjectSubmission ? 'Ẩn Form' : 'Nộp Dự Án AI'}
          </Button>
        </Card>

        {/* Project Submission Form - Toggleable */}
        {showProjectSubmission && (
          <>
            <Separator className="bg-border/50" />
            <ProjectSubmission 
              lessonId="lesson-demo-001"
              courseId="course-ai-agents"
              userId={userId}
            />
          </>
        )}

        <Separator className="bg-border/50" />

        {/* Leaderboard - REAL COMPONENT với data thực từ database */}
        <LeaderboardCard />

        <Separator className="bg-border/50" />

        {/* Study Groups - REAL COMPONENT với join/leave functionality */}
        <StudyGroups 
          userId={userId}
          userLevel={userLevel}
        />

        <Separator className="bg-border/50" />

        {/* Live Sessions - REAL COMPONENT với registration */}
        <LiveSessions userId={userId} />

        <Separator className="bg-border/50" />

        {/* AI Assistant - REAL GPT-4 CHATBOT */}
        <AIAssistant 
          lessonId="academy-general"
          lessonTitle="Academy AI Assistant"
        />
      </div>
    </aside>
  );
};
