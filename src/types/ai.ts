export interface AIStatusResponse {
  enabled: boolean;
  configured: boolean;
  mode: "live" | "demo" | "unavailable";
  provider: "OpenAI";
  model: string;
}

export interface AIProductCopy {
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  sellingPointsAr: string[];
  sellingPointsEn: string[];
  seoKeywords: string[];
}

export interface AIReelCopy {
  hookAr: string;
  hookEn: string;
  captionAr: string;
  captionEn: string;
  hashtags: string[];
  callToActionAr: string;
  callToActionEn: string;
}

export interface AIReelReview {
  recommendation: "approve" | "manual_review" | "reject";
  confidence: number;
  summaryAr: string;
  summaryEn: string;
  issuesAr: string[];
  issuesEn: string[];
  suggestedRejectionReasonAr: string;
  suggestedRejectionReasonEn: string;
  moderationFlagged: boolean;
}


export interface AIReelStrategy {
  titleAr: string;
  titleEn: string;
  hookAr: string;
  hookEn: string;
  captionAr: string;
  captionEn: string;
  hashtags: string[];
  callToActionAr: string;
  callToActionEn: string;
  bestPostTime: string;
  bestPostTimeReasonAr: string;
  bestPostTimeReasonEn: string;
  storyboardAr: string[];
  storyboardEn: string[];
}

export interface AIReelPerformanceAnalysis {
  score: number;
  summaryAr: string;
  summaryEn: string;
  suggestionsAr: string[];
  suggestionsEn: string[];
  nextExperimentAr: string;
  nextExperimentEn: string;
}
