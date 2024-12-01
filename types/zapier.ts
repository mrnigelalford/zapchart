export interface ZapierChartInput {
  // Required fields for basic data
  labels: string;        // Comma-separated list: "Jan,Feb,Mar"
  data: string;         // Comma-separated numbers: "10,20,30"
  
  // Optional fields for customization
  chartType?: string;   // "bar", "line", "pie", etc.
  title?: string;       // "Monthly Sales 2024"
  xAxisLabel?: string;  // "Months"
  yAxisLabel?: string;  // "Sales ($)"
  
  // Optional: Support for Zapier table data
  tableData?: string;   // JSON stringified table data
  labelColumn?: string; // Column name for labels
  dataColumn?: string;  // Column name for values
}

export interface ZapierResponse {
  id: string;
  url: string;
  imageUrl: string;
} 