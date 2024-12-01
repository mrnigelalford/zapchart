import type { ZapierWebhookBody } from '@/types/zapier';

export function transformZapierData(zapierData: ZapierWebhookBody) {
  // Handle comma-separated string data from Zapier
  const labels = zapierData.labels?.split(',') || [];
  const data = zapierData.data?.split(',').map(Number) || [];
  const options = zapierData.options ? JSON.parse(zapierData.options) : {};

  return {
    labels,
    datasets: [{
      label: 'Data from Zapier',
      data,
      ...options
    }]
  };
} 