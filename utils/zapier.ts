import { ZapierChartInput } from "../types/zapier";

export function transformZapierData(input: ZapierChartInput) {
  const defaultStyles = {
    backgroundColor: [
      'rgba(255, 99, 132, 0.2)',
      'rgba(54, 162, 235, 0.2)',
      'rgba(255, 206, 86, 0.2)'
    ],
    borderColor: [
      'rgba(255, 99, 132, 1)',
      'rgba(54, 162, 235, 1)',
      'rgba(255, 206, 86, 1)'
    ],
    borderWidth: 1
  };

  // Handle table data if provided
  let labels: string[] = [];
  let data: number[] = [];

  if (input.tableData && input.labelColumn && input.dataColumn) {
    try {
      const table = JSON.parse(input.tableData);
      labels = table.map((row: any) => row[input.labelColumn!]);
      data = table.map((row: any) => Number(row[input.dataColumn!]));
    } catch (error) {
      console.error('Failed to parse table data:', error);
      // Fallback to simple data
      labels = input.labels.split(',').map(label => label.trim());
      data = input.data.split(',').map(Number);
    }
  } else {
    // Use simple data
    labels = input.labels.split(',').map(label => label.trim());
    data = input.data.split(',').map(Number);
  }

  return {
    data: {
      labels,
      datasets: [{
        label: input.title || 'Data',
        data,
        backgroundColor: defaultStyles.backgroundColor,
        borderColor: defaultStyles.borderColor,
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        x: {
          title: {
            display: !!input.xAxisLabel,
            text: input.xAxisLabel
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: !!input.yAxisLabel,
            text: input.yAxisLabel
          }
        }
      },
      plugins: {
        title: {
          display: !!input.title,
          text: input.title
        }
      }
    }
  };
} 