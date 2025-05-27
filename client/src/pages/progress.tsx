import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Bell, Lock, CheckCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import type { ProgressResponse } from "@/lib/types";

export default function Progress() {
  const { userId } = useParams();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const { data: progressData, isLoading, error } = useQuery<ProgressResponse>({
    queryKey: ["/api/progress", userId],
    queryFn: async () => {
      const response = await fetch(`/api/progress/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch progress");
      }
      return response.json();
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-8 w-48 mx-auto rounded mb-2"></div>
            <div className="bg-gray-200 h-6 w-64 mx-auto rounded"></div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="animate-pulse space-y-4">
              <div className="bg-gray-200 h-24 w-24 mx-auto rounded-2xl"></div>
              <div className="bg-gray-200 h-4 w-32 mx-auto rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !progressData) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <h1 className="text-xl font-bold text-red-600 mb-2">Error Loading Progress</h1>
              <p className="text-gray-600">
                {error instanceof Error ? error.message : "Failed to load progress data"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { campaign, progress, streak, tasks, previousDays, nextDay } = progressData;

  return (
    <div className="bg-gray-50 py-6 px-4 pb-safe-bottom min-h-screen overflow-y-auto">
      <div className="max-w-md mx-auto space-y-6 pb-8">
        
        {/* Header */}
        <div className="text-left space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Activity Streak</h1>
          <p className="text-gray-600 text-base">Complete daily tasks to maintain your streak</p>
        </div>

        {/* Streak Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-900 font-bold">
              Current Streak: <span className="text-primary font-bold">{streak.currentDays} days</span>
            </span>
            <span className="text-gray-600 text-sm">{progress.percentage}% Complete</span>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Day 1</span>
            <span className="text-xs text-gray-500">Day {campaign.totalDays}</span>
          </div>
          
          <ProgressBar value={progress.percentage} className="w-full h-2" />
          

        </div>

        {/* Streak Reminders */}
        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Bell className="text-white text-sm" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Streak Reminders</h4>
                <p className="text-gray-600 text-xs">Get notified to maintain your streak</p>
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
        </div>

        {/* Reward Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trophy className="text-primary text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{campaign.reward.title}</h3>
              <p className="text-gray-600 text-sm">{campaign.reward.description}</p>
            </div>
            <div className="text-primary font-semibold text-sm">{progress.percentage}%</div>
          </div>
          
          <Button 
            className="w-full bg-primary text-white font-medium py-3 px-4 rounded-xl hover:bg-primary/90 transition-colors"
            disabled={progress.percentage < 100}
          >
            {progress.percentage === 100 ? "Claim Reward" : "Complete Milestones to Unlock"}
          </Button>
        </div>

        {/* Previous Days (if any) */}
        {previousDays.length > 0 && (
          <div className="space-y-3">
            {previousDays.map((day) => (
              <div key={day.number} className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-green-800 font-medium text-sm">Day {day.number} Completed</span>
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-white text-xs" />
                  </div>
                </div>
                <p className="text-green-700 text-xs mt-1">
                  Completed on {new Date(day.completedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Current Day Tasks */}
        {progress.currentDay <= campaign.totalDays && (
          <div className="space-y-4">
            {/* Tasks Header Card */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Day {progress.currentDay} Tasks</h3>
              <p className="text-blue-600 font-medium mb-4">
                Complete all {tasks.length} tasks to unlock the next day
              </p>
              <div className="flex items-center justify-between">
                <div className="flex-1 bg-blue-200 rounded-full h-2 mr-4">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-gray-600 font-medium">
                  {tasks.filter(t => t.completed).length}/{tasks.length}
                </span>
              </div>
            </div>

            {/* Individual Task Cards */}
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div key={task.id} className="flex items-start space-x-4">
                  {/* Task Number Circle */}
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      task.completed ? 'bg-green-500' : 'bg-blue-500'
                    }`}>
                      {task.completed ? <CheckCircle className="w-6 h-6" /> : task.number}
                    </div>
                    {/* Connection line to next task */}
                    {index < tasks.length - 1 && (
                      <div className="w-0.5 h-6 bg-blue-200 mt-2"></div>
                    )}
                  </div>
                  
                  {/* Task Content Card */}
                  <div className="flex-1 bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                    <h4 className={`font-bold text-lg mb-2 ${task.completed ? 'text-green-800' : 'text-gray-900'}`}>
                      {task.title}
                    </h4>
                    <p className={`text-base ${task.completed ? 'text-green-600' : 'text-gray-600'}`}>
                      {task.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remaining Days Overview */}
        {progress.currentDay < campaign.totalDays && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="space-y-3">
              {Array.from({ length: campaign.totalDays - progress.currentDay }, (_, index) => {
                const dayNumber = progress.currentDay + 1 + index;
              
                return (
                  <div
                    key={dayNumber}
                    className="flex items-center justify-between p-4 rounded-xl border transition-colors border-gray-200 bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold bg-gray-400">
                        {dayNumber}
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">
                          Day {dayNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          Locked
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}



      </div>
    </div>
  );
}
