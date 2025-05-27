import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations directly as objects
const en = {
  "app": {
    "title": "Activity Streak",
    "subtitle": "Complete daily tasks to maintain your streak"
  },
  "progress": {
    "currentStreak": "Current Streak",
    "days": "days",
    "complete": "Complete",
    "daysCompleted": "days completed",
    "streakReminders": "Streak Reminders",
    "streakRemindersDesc": "Get notified to maintain your streak"
  }
};

const ar = {
  "app": {
    "title": "سلسلة النشاط",
    "subtitle": "أكمل المهام اليومية للحفاظ على سلسلتك"
  },
  "progress": {
    "currentStreak": "السلسلة الحالية",
    "days": "أيام",
    "complete": "مكتمل",
    "daysCompleted": "أيام مكتملة",
    "streakReminders": "تذكيرات السلسلة",
    "streakRemindersDesc": "احصل على إشعارات للحفاظ على سلسلتك"
  }
};

const resources = {
  en: {
    translation: en
  },
  ar: {
    translation: ar
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'en',
    
    detection: {
      order: ['path', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0
    },

    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;