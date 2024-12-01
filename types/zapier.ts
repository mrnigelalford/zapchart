export interface ZapierWebhookBody {
  chartType?: string;
  labels?: string;
  data?: string;
  options?: string;
}

export interface ZapierResponse {
  id: string;
  url: string;
  imageUrl: string;
} 