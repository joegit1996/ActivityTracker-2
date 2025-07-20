import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Trophy, Lock, CheckCircle, X, Flame, Gift, Banknote } from "lucide-react";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import type { ProgressResponse, LocalizedMiniReward } from "@/lib/types";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { useUserId } from "@/hooks/use-user-id";

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
  const { lang, campaignId } = useParams();
  const { t, i18n } = useTranslation();
  const [animationsTriggered, setAnimationsTriggered] = useState(false);

  // Use the new hook for robust userId extraction
  const { userId, error: userIdError, loading: userIdLoading } = useUserId();

  // Set language and HTML attributes based on URL
  useEffect(() => {
    if (lang && (lang === 'en' || lang === 'ar')) {
      i18n.changeLanguage(lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  }, [lang, i18n]);
  
  const isValidUserId = typeof userId === 'string' && userId.trim() !== '';

  const { data: progressData, isLoading, error } = useQuery<ProgressResponse>({
    queryKey: ["/api/progress", userId, campaignId, lang],
    queryFn: async () => {
      if (!isValidUserId) {
        throw new Error('User ID is missing or invalid.');
      }
      const url = campaignId 
        ? `/api/progress/${userId}/${campaignId}?lang=${lang || 'en'}`
        : `/api/progress/${userId}?lang=${lang || 'en'}`;
      const response = await fetch(url);
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        let errorText = await response.text();
        console.error('[Progress] Error response:', errorText);
        throw new Error(`Failed to fetch progress: ${response.status}`);
      }
      if (!contentType || !contentType.includes('application/json')) {
        let errorText = await response.text();
        console.error('[Progress] Non-JSON response:', errorText);
        throw new Error('Server returned non-JSON response');
      }
      try {
        return await response.json();
      } catch (err) {
        let errorText = await response.text();
        console.error('[Progress] JSON parse error. Response body:', errorText);
        throw new Error('Invalid JSON response from server');
      }
    },
    enabled: isValidUserId,
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

  // Handle userId loading and error states
  if (!isValidUserId && !userIdLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">{t('common.error')}</h1>
          <p className="text-gray-600">User ID is missing or invalid in the URL and could not be determined automatically.</p>
        </div>
      </div>
    );
  }

  if (userIdLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  if (userIdError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">{t('common.error')}</h1>
          <p className="text-gray-600">{userIdError}</p>
        </div>
      </div>
    );
  }

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

  if (progressData?.failed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="p-8 text-center">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <X className="w-8 h-8 text-red-600" />
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-red-700 mb-3">
              {t('progress.streakFailedTitle')}
            </h1>
            
            {/* Message */}
            <p className="text-gray-700 leading-relaxed">
              {t('progress.streakFailedMessage', { day: progressData.failedDay })}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { campaign, progress, streak, tasks, previousDays, nextDay, miniRewards } = progressData;

  // Group mini rewards by after_day_number, but only for valid days
  const miniRewardsByDay = (miniRewards || []).reduce((acc: Record<number, LocalizedMiniReward[]>, reward) => {
    if (reward.after_day_number < campaign.totalDays) {
      if (!acc[reward.after_day_number]) acc[reward.after_day_number] = [];
      acc[reward.after_day_number].push(reward);
    }
    return acc;
  }, {} as Record<number, LocalizedMiniReward[]>);

  const completedDays = previousDays.length;
  const totalDays = campaign.totalDays;
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

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

        {/* Streak Progress + Reward Section (merged) */}
        <div className="bg-blue-50 rounded-2xl p-6 shadow-sm border border-blue-200">
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
          <div className={`animated-progress${i18n.language === 'ar' ? ' rtl-progress' : ''}`}> 
            <div 
              className="animated-progress-fill"
              style={{ 
                '--progress-width': `${progress.percentage}%` 
              } as React.CSSProperties}
            ></div>
          </div>

          {/* Golden Reward Section on Completion */}
          {isCompleted && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-5 my-6 flex flex-col items-center shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-500 text-2xl">🏆</span>
                <span className="font-extrabold text-yellow-800 text-lg text-center">
                  {campaign.reward.title}
                </span>
              </div>
              <div className="text-yellow-700 text-center text-base font-medium">
                {campaign.reward.description}
              </div>
            </div>
          )}

          {/* Reward merged below progress bar */}
          {!isCompleted && (
            <div className="flex flex-col items-center mt-6">
              <h3 className="font-bold text-blue-900 text-lg mb-2 text-center">
                {i18n.language === 'ar'
                  ? 'أكمل جميع المهام لتحصل على جائزة نقدية كبيرة'
                  : 'Complete all milestones for a big CASH reward'}{' '}
                <span role="img" aria-label="prize">🎁</span>
              </h3>
              <FontAwesomeIcon icon={faMoneyBillWave} beat className="mx-auto mt-2 text-blue-900 p-4" style={{ fontSize: 90 }} />
            </div>
          )}
        </div>

        {/* Unified timeline: render day card, then mini rewards (if not last day) */}
        <div className="space-y-3">
          {days.map((day) => {
            // Determine day state
            const isCompleted = previousDays.some(d => d.number === day);
            const isCurrent = progress.currentDay === day;
            const isFuture = day > progress.currentDay;
            // Render day card
            return (
              <div key={day}>
                <div
                  className={
                    isCompleted
                      ? "bg-green-50 rounded-xl p-4 border border-green-200"
                      : isCurrent
                      ? "bg-white rounded-xl p-4 border-2 border-primary"
                      : "bg-gray-50 rounded-xl p-4 border border-gray-200 opacity-80"
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className={
                      isCompleted
                        ? "text-green-800 font-medium text-sm"
                        : isCurrent
                        ? "text-primary font-semibold text-sm"
                        : "text-gray-500 font-medium text-sm"
                    }>
                      {isCompleted
                        ? t('progress.dayCompleted', { number: day })
                        : t('progress.day', { number: day })}
                    </span>
                    <div className={
                      isCompleted
                        ? "w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                        : isCurrent
                        ? "w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                        : "w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center"
                    }>
                      {isCompleted ? (
                        <CheckCircle className="text-white text-xs" />
                      ) : isCurrent ? (
                        <span className="w-5 h-5 flex items-center justify-center">
                          <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        </span>
                      ) : (
                        <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 shadow-sm">
                          <Lock className="w-4 h-4 text-gray-500" />
                        </span>
                      )}
                    </div>
                  </div>
                  {isCompleted && (
                    <>
                      <p className="text-green-700 text-xs mt-1">
                        {t('progress.completedOn', { date: new Date(previousDays.find(d => d.number === day)?.completedAt || '').toLocaleDateString() })}
                      </p>
                      {previousDays.find(d => d.number === day)?.milestones && (
                        <div className="mt-2 space-y-1">
                          {previousDays.find(d => d.number === day)?.milestones?.map((milestone: { id: number; title: string }) => (
                            <p key={milestone.id} className="text-green-600 text-xs">
                              • {milestone.title}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {isCurrent && (
                    <>
                      <p className="text-gray-600 text-xs mt-1">{t('progress.completeCurrentDay')}</p>
                      <div className="mt-4 space-y-3">
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
                              <h4 className={`font-medium ${task.completed ? 'text-green-800' : 'text-gray-900'}`}>{task.title}</h4>
                              <p className={`text-sm mt-1 ${task.completed ? 'text-green-600' : 'text-gray-600'}`}>{task.description}</p>
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
                    </>
                  )}
                </div>
                {/* Mini rewards after this day (if not last day) */}
                {day < totalDays && (miniRewardsByDay[day] || []).map((reward) => {
                  // Unlocked if the day is completed
                  const unlocked = previousDays.some(d => d.number === day);
                  return (
                    <div
                      key={reward.id}
                      className={`flex items-center gap-3 mt-2 p-3 border rounded transition-opacity ${unlocked ? "bg-yellow-50" : "bg-gray-100 opacity-60"}`}
                    >
                      <Gift className={`w-5 h-5 ${unlocked ? "text-yellow-500" : "text-gray-400"}`} />
                      <div className="flex-1">
                        <div className="font-medium">{reward.title}</div>
                        <div className="text-sm text-gray-600">{reward.description}</div>
                      </div>
                      {!unlocked && <Lock className="w-4 h-4 text-gray-400 ml-2" />}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
