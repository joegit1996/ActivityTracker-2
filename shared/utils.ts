import type { Campaign, Milestone } from './schema';

export type SupportedLanguage = 'en' | 'ar';

export function getLocalizedCampaign(campaign: Campaign, language: SupportedLanguage = 'en') {
  return {
    id: campaign.id,
    title: language === 'ar' ? campaign.title_ar : campaign.title_en,
    description: language === 'ar' ? campaign.description_ar : campaign.description_en,
    totalDays: campaign.total_days,
    reward: {
      title: language === 'ar' ? campaign.reward_title_ar : campaign.reward_title_en,
      description: language === 'ar' ? campaign.reward_description_ar : campaign.reward_description_en
    },
    rewardCode: language === 'ar' ? (campaign as any).reward_code_ar : (campaign as any).reward_code_en
  };
}

export function getLocalizedMilestone(milestone: Milestone, language: SupportedLanguage = 'en') {
  return {
    id: milestone.id,
    title: language === 'ar' ? milestone.title_ar : milestone.title_en,
    description: language === 'ar' ? milestone.description_ar : milestone.description_en,
    completed: false, // This will be set by the calling function
    number: milestone.order_index + 1
  };
}