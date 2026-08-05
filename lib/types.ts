export type PlatformSource = 'gmail' | 'linkedin' | 'instagram';
export type SearchMode = 'fast' | 'deep';
export type PageView = 'login' | 'dashboard' | 'engines' | 'history';

export interface ICPProfile {
  id: string;
  name: string;
  niche: string;
  jobTitles: string[];
  companySize: string[];
  locations: string[];
  industries: string[];
  keywords: string[];
  painPoints: string;
  revenueRange?: string;
  createdAt: string;
}

export interface SearchMethod {
  id: string;
  name: string;
  platform: 'linkedin' | 'google_maps' | 'instagram' | 'other';
  mode: 'fast' | 'deep';
  maxResults: number;
  queryTemplate?: string;
  createdAt: string;
}

export interface ProspectingEngine {
  id: string;
  name: string;
  icpId: string;
  searchMethodId: string;
  totalLeads: number;
  lastRunAt?: string;
  createdAt: string;
}

export interface ApexEngineConfig {
  targetIndustries: string[];
  companySizes: string[];
  requiredTitles: string[];
  excludeTitles: string[];
  dailyContactLimit: number;
  enableNPLDetection: boolean;
  batchScrapingStrategy: 'provincial' | 'alphabetical' | 'random';
}

export interface ProjectConfig {
  clientId: string;
  clientName: string;
  primaryColor: string;
  targets: {
    icp: string; // Ideal Customer Profile description
    locations: string[];
  };
  enabledPlatforms: PlatformSource[];
  searchSettings: {
    defaultDepth: number;
    defaultMode: SearchMode;
  };
  apexEngineConfig?: ApexEngineConfig;
}

export interface Lead {
  id: string;
  source: PlatformSource;
  companyName: string;
  website?: string;
  socialUrl?: string;
  location?: string;
  decisionMaker?: {
    name: string;
    role: string; // e.g., "Founder", "Owner", "CEO"
    email: string;
    phone?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  aiAnalysis: {
    summary: string;
    painPoints: string[];
    generatedIcebreaker?: string;
    fullMessage?: string;
    fullAnalysis?: string;
    psychologicalProfile?: string;
    businessMoment?: string;
    salesAngle?: string;
  };
  // New fields for Marcos' messages
  messageA?: string; // Automation-focused message
  isNPLPotential?: boolean;
  status: 'scraped' | 'enriched' | 'ready' | 'contacted' | 'replied' | 'discarded';
  // ICP-specific fields
  social_links?: Record<string, string>;
  community_size?: number;
  tech_stack?: string[];
  icp_type?: 'agency' | 'skool_creator' | 'other';
}

export interface AdvancedFilter {
  locations: string[];
  jobTitles: string[];
  companySizes: string[];
  industries: string[];
  keywords: string[];
}

export interface SearchConfigState {
  query: string;
  source: PlatformSource;
  mode: SearchMode;
  maxResults: number;
  advancedFilters?: AdvancedFilter;
  icp_type?: 'agency' | 'skool_creator' | 'other';
}

export interface SearchSession {
  id: string;
  date: Date;
  query: string;
  source: PlatformSource;
  resultsCount: number;
  leads: Lead[];
  icp_type?: 'agency' | 'skool_creator' | 'other';
  engineId?: string;
  engineName?: string;
}
