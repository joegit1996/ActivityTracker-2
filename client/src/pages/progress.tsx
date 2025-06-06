import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Trophy, Lock, CheckCircle, X, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import type { ProgressResponse } from "@/lib/types";

// Custom hook for animated counter
function useAnimatedCounter(end: number, duration: number = 500) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCurrent(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return current;
}

export default function Progress() {
  const { userId, lang, campaignId } = useParams();
  const { t, i18n } = useTranslation();
  const [animationsTriggered, setAnimationsTriggered] = useState(false);

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

  // ALL HOOKS MUST BE CALLED AT TOP LEVEL - BEFORE ANY EARLY RETURNS
  
  // Animated counter for percentage (always call hooks at top level)
  const animatedPercentage = useAnimatedCounter(progressData?.progress?.percentage || 0, 500);

  // Trigger animations when data loads
  useEffect(() => {
    if (progressData && !animationsTriggered) {
      setAnimationsTriggered(true);
    }
  }, [progressData, animationsTriggered]);

  // Check if all milestones are completed and show reward modal (must be before early returns)
  const isCompleted = progressData ? progressData.progress.percentage === 100 && progressData.progress.currentDay > progressData.campaign.totalDays : false;
  
  useEffect(() => {
    if (isCompleted && progressData) {
      // Trigger confetti animation when all milestones are completed
      try {
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
      } catch (error) {
        console.warn('Confetti animation failed:', error);
      }
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
          <div className="flex items-center justify-center gap-3">
            <Flame className="text-orange-500 text-3xl" size={28} />
            <h1 className="text-2xl font-bold text-gray-900">{t('app.title')}</h1>
          </div>
          <p className="text-gray-600 text-base">{t('app.subtitle')}</p>
        </div>

        {/* Streak Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-900 font-medium">
              {t('progress.currentStreak')}: <span className="text-primary font-semibold">{streak.currentDays} {t('progress.days')}</span>
            </span>
            <span className="text-2xl font-bold text-primary">
              {animatedPercentage}% 
              <span className="text-sm font-normal text-gray-600 ml-1">{t('progress.complete')}</span>
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-gray-500">
              {i18n.language === 'ar' ? `${t('progress.dayLabel')} 1` : `${t('progress.dayLabel')} 1`}
            </span>
            <span className="text-xs text-gray-500">
              {i18n.language === 'ar' ? `${t('progress.dayLabel')} ${campaign.totalDays}` : `${t('progress.dayLabel')} ${campaign.totalDays}`}
            </span>
          </div>
          
          {/* Animated Progress Bar */}
          <div className={`animated-progress ${i18n.language === 'ar' ? 'transform scale-x-[-1]' : ''}`}>
            <div 
              className="animated-progress-fill"
              style={{ 
                '--progress-width': `${progress.percentage}%` 
              } as React.CSSProperties}
            ></div>
          </div>
          

        </div>



        {/* Reward Card */}
        {!isCompleted ? (
          // Normal state - clean and simple with subtle distinction
          <div className="bg-blue-50/30 rounded-2xl p-6 shadow-md border-l-4 border-blue-500 border border-gray-100 space-y-4">
            <div className={`flex items-start ${lang === 'ar' ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trophy className={`text-primary text-xl ${animationsTriggered ? 'animated-trophy' : ''}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">{campaign.reward.title}</h3>
                <p className="text-gray-600 text-sm">{campaign.reward.description}</p>
              </div>
              <div className="text-primary font-semibold text-sm">{animatedPercentage}%</div>
            </div>
          </div>
        ) : (
          // Completed state - refined celebration
          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-6 shadow-lg border-2 border-yellow-300">
            {/* Header with trophy */}
            <div className="text-center mb-4">
              <div className="mx-auto w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center mb-3">
                <Trophy className="text-yellow-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-yellow-800 mb-1">{campaign.reward.title}</h3>
              <p className="text-yellow-700 text-sm">{campaign.reward.description}</p>
              <div className="inline-block bg-yellow-200 rounded-full px-3 py-1 mt-2">
                <span className="text-yellow-800 font-semibold text-sm">100% {t('progress.complete')}</span>
              </div>
            </div>
            
            {/* Congratulations section */}
            <div className="bg-white/80 rounded-xl p-4 text-center">
              <div className={`flex items-center justify-center gap-2 mb-3 ${
                lang === 'ar' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                <span className="text-xl">🎉</span>
                <h4 className="text-lg font-bold text-gray-800">
                  {t('progress.congratulations')}
                </h4>
              </div>
              
              {/* Reward message */}
              {(campaign as any).rewardCode && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <p className="text-gray-800 font-medium text-base leading-relaxed">
                    {(campaign as any).rewardCode}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

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
                className={`flex items-center ${lang === 'ar' ? 'space-x-reverse space-x-4' : 'space-x-4'} p-4 border rounded-xl transition-colors ${
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
