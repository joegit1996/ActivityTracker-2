import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Bell, Lock, CheckCircle } from "lucide-react";
import { useState } from "react";
import type { ProgressResponse } from "@/lib/types";

export default function Progress() {
  const { userId } = useParams();
  
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
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
          <p className="text-gray-600 text-base">{campaign.description}</p>
        </div>

        {/* Day Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center space-y-4">
          <div className="bg-primary rounded-2xl w-24 h-24 mx-auto flex flex-col items-center justify-center text-white">
            <div className="text-3xl font-bold">{progress.currentDay}</div>
            <div className="text-sm opacity-90">of {campaign.totalDays} days</div>
          </div>
          <div className="text-sm text-gray-600">
            {progress.completedDays} days completed
          </div>
        </div>

        {/* Streak Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-900 font-medium">
              Current Streak: <span className="text-primary font-semibold">{streak.currentDays} days</span>
            </span>
            <span className="text-gray-600 text-sm">{progress.percentage}% Complete</span>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Day 1</span>
            <span className="text-xs text-gray-500">Day {campaign.totalDays}</span>
          </div>
          
          <ProgressBar value={progress.percentage} className="w-full h-2" />
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

        {/* Reminder Card */}
        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Bell className="text-white text-sm" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Streak Reminders</h4>
              <p className="text-gray-600 text-xs">Get notified to maintain your streak</p>
            </div>
          </div>
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
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Day {progress.currentDay} Tasks</h3>
              <div className="text-sm text-gray-600">
                {tasks.filter(t => t.completed).length}/{tasks.length}
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              Complete all {tasks.length} tasks to unlock the next day
            </p>

            {tasks.map((task) => (
              <div 
                key={task.id}
                className={`flex items-start space-x-4 p-4 border rounded-xl transition-colors ${
                  task.completed 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 hover:border-primary/30 cursor-pointer'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                  task.completed ? 'bg-green-500' : 'bg-primary'
                }`}>
                  {task.completed ? <CheckCircle className="w-4 h-4" /> : task.number}
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${task.completed ? 'text-green-800' : 'text-gray-900'}`}>
                    {task.title}
                  </h4>
                  <p className={`text-sm mt-1 ${task.completed ? 'text-green-600' : 'text-gray-600'}`}>
                    {task.description}
                  </p>
                </div>
                <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
                  task.completed 
                    ? 'border-green-500 bg-green-500' 
                    : 'border-gray-300'
                }`}>
                  {task.completed && <CheckCircle className="text-white text-xs" />}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Future Days Preview */}
        {nextDay && nextDay <= campaign.totalDays && (
          <div className="bg-gray-100 rounded-2xl p-6 border border-gray-200 space-y-4 opacity-75">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-700">Day {nextDay} Tasks</h3>
              <div className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Locked
              </div>
            </div>
            
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-gray-500 text-xl" />
              </div>
              <p className="text-gray-600 font-medium">Available Tomorrow</p>
              <p className="text-gray-500 text-sm mt-1">Complete today's tasks to unlock</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
