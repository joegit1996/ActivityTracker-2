import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Trophy, Lock, CheckCircle, X } from "lucide-react";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import type { ProgressResponse } from "@/lib/types";

export default function Progress() {
  const { userId, lang, campaignId } = useParams();
  const { t, i18n } = useTranslation();

  // Set language and HTML attributes based on URL
  useEffect(() => {
    if (lang && (lang === 'en' || lang === 'ar')) {
      i18n.changeLanguage(lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  }, [lang, i18n]);
  
  const { data: progressData, isLoading, error } = useQuery<ProgressResponse>({
    queryKey: ["/api/progress", userId, campaignId, lang],
    queryFn: async () => {
      const url = campaignId 
        ? `/api/progress/${userId}/${campaignId}?lang=${lang || 'en'}`
        : `/api/progress/${userId}?lang=${lang || 'en'}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch progress");
      }
      return response.json();
    },
    enabled: !!userId,
  });

  // Check if all milestones are completed and show reward modal (must be before early returns)
  const isCompleted = progressData ? progressData.progress.percentage === 100 && progressData.progress.currentDay > progressData.campaign.totalDays : false;
  
  useEffect(() => {
    if (isCompleted && progressData) {
      // Trigger confetti animation when all milestones are completed
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      
      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };
      
      const confettiInterval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) {
          clearInterval(confettiInterval);
          return;
        }
        
        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          particleCount,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0079F2', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1']
        });
        
        confetti({
          particleCount,
          spread: 70,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        
        confetti({
          particleCount,
          spread: 70,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);
    }
  }, [isCompleted, progressData]);

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
    <div className="bg-gray-50 py-6 px-4 pb-safe-bottom min-h-screen overflow-y-auto overflow-x-hidden w-full">
      <div className="max-w-md mx-auto space-y-6 pb-8 w-full">
        
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
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">
              {i18n.language === 'ar' ? `${t('progress.dayLabel')} 1` : `${t('progress.dayLabel')} 1`}
            </span>
            <span className="text-xs text-gray-500">
              {i18n.language === 'ar' ? `${t('progress.dayLabel')} ${campaign.totalDays}` : `${t('progress.dayLabel')} ${campaign.totalDays}`}
            </span>
          </div>
          
          <ProgressBar value={progress.percentage} className={`w-full h-2 ${i18n.language === 'ar' ? 'transform scale-x-[-1]' : ''}`} />
          

        </div>



        {/* Reward Card */}
        <div className={`bg-white rounded-2xl p-6 shadow-sm border space-y-4 transition-all duration-500 ${
          isCompleted 
            ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg shadow-yellow-200/50' 
            : 'border-gray-100'
        }`}>
          <div className={`flex items-start ${lang === 'ar' ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
              isCompleted 
                ? 'bg-yellow-100 animate-pulse' 
                : 'bg-primary/10'
            }`}>
              <Trophy className={`text-xl transition-all duration-500 ${
                isCompleted 
                  ? 'text-yellow-600' 
                  : 'text-primary'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold mb-1 transition-all duration-500 ${
                isCompleted 
                  ? 'text-yellow-800' 
                  : 'text-gray-900'
              }`}>{campaign.reward.title}</h3>
              <p className={`text-sm transition-all duration-500 ${
                isCompleted 
                  ? 'text-yellow-700' 
                  : 'text-gray-600'
              }`}>{campaign.reward.description}</p>
              
              {/* Show congratulations message when completed */}
              {isCompleted && (
                <div className="mt-4 p-5 bg-yellow-100 rounded-xl border border-yellow-200 w-full max-w-full mx-auto min-w-[280px]" style={{ width: 'calc(100% - 8px)' }}>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-lg">🎉</span>
                    <p className="text-yellow-800 font-medium text-base">
                      {t('progress.congratulations')}
                    </p>
                  </div>
                  
                  {/* Display reward text if available */}
                  {(campaign as any).rewardCode && (
                    <div className="text-base text-yellow-900 font-medium text-center">
                      {(campaign as any).rewardCode}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={`font-semibold text-sm transition-all duration-500 ${
              isCompleted 
                ? 'text-yellow-600' 
                : 'text-primary'
            }`}>{progress.percentage}%</div>
          </div>
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
