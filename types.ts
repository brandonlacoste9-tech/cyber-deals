
export interface Deal {
  id: string;
  title: string;
  description: string;
  category: 'Free Trial' | 'Discount' | 'Coupon' | 'Limited Time';
  link: string;
  source: string;
  relevanceScore: number;
}

export interface SniffResult {
  text: string;
  deals: Deal[];
  sources: { title: string; uri: string }[];
  groundingMetadata?: any;
}

export enum HoundMood {
  IDLE = 'idle',
  SNIFFING = 'sniffing',
  HAPPY = 'happy',
  TIRED = 'tired',
  EXCITED = 'excited'
}
