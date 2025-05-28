import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Bell, Lock, CheckCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import type { ProgressResponse } from "@/lib/types";

export default function Progress() {
  const { userId, lang } = useParams();
  const { t, i18n } = useTranslation();
  const { notificationsEnabled, toggleNotifications, isWebView } = useNotifications();

  // Set language and HTML attributes based on URL
  useEffect(() => {
    if (lang && (lang === 'en' || lang === 'ar')) {
      i18n.changeLanguage(lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  }, [lang, i18n]);
  
  const { data: progressData, isLoading, error } = useQuery<ProgressResponse>({
    queryKey: ["/api/progress", userId, lang],
    queryFn: async () => {
      const response = await fetch(`/api/progress/${userId}?lang=${lang || 'en'}`);
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
              <h1 className="text-xl font-bold text-red-600 mb-2">{t('common.error')}</h1>
              <p className="text-gray-600">
                {error instanceof Error ? error.message : t('common.error')}
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
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">{t('app.title')}</h1>
          <p className="text-gray-600 text-base">{t('app.subtitle')}</p>
        </div>

        {/* Streak Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-900 font-medium">
              {t('progress.currentStreak')}: <span className="text-primary font-semibold">{streak.currentDays} {t('progress.days')}</span>
            </span>
            <span className="text-gray-600 text-sm">{progress.percentage}% {t('progress.complete')}</span>
          </div>
          
          <div className={`flex justify-between items-center mb-2 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs text-gray-500">{t('progress.dayLabel')} 1</span>
            <span className="text-xs text-gray-500">{t('progress.dayLabel')} {campaign.totalDays}</span>
          </div>
          
          <ProgressBar value={progress.percentage} className={`w-full h-2 ${lang === 'ar' ? 'transform scale-x-[-1]' : ''}`} />
          

        </div>

        {/* Streak Reminders */}
        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${lang === 'ar' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Bell className="text-white text-sm" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">{t('progress.streakReminders')}</h4>
                <p className="text-gray-600 text-xs">
                  {isWebView 
                    ? t('progress.streakRemindersWebview') 
                    : t('progress.streakRemindersDesc')
                  }
                </p>
                {isWebView && (
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs text-green-600 font-medium">
                      {t('progress.webviewMode')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={toggleNotifications}
            />
          </div>
        </div>

        {/* Reward Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className={`flex items-start ${lang === 'ar' ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
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
            {progress.percentage === 100 ? t('progress.claimReward') : t('progress.completeToUnlock')}
          </Button>
        </div>

        {/* Previous Days (if any) */}
        {previousDays.length > 0 && (
          <div className="space-y-3">
            {previousDays.map((day) => (
              <div key={day.number} className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-green-800 font-medium text-sm">{t('progress.dayCompleted', { number: day.number })}</span>
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-white text-xs" />
                  </div>
                </div>
                <p className="text-green-700 text-xs mt-1">
                  {t('progress.completedOn', { date: new Date(day.completedAt).toLocaleDateString() })}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Current Day Tasks */}
        {progress.currentDay <= campaign.totalDays && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{t('progress.day', { number: progress.currentDay })}</h3>
              <div className="text-sm text-gray-600">
                {tasks.filter(t => t.completed).length}/{tasks.length}
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              {t('progress.completeCurrentDay')}
            </p>

            {tasks.map((task) => (
              <div 
                key={task.id}
                className={`flex items-start ${lang === 'ar' ? 'space-x-reverse space-x-4' : 'space-x-4'} p-4 border rounded-xl transition-colors ${
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
                    <div className={`flex items-center ${lang === 'ar' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold bg-gray-400">
                        {dayNumber}
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">
                          {t('progress.day', { number: dayNumber })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t('progress.lockedDay', { number: dayNumber })}
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
