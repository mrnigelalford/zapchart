'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

export default function ChartPage() {
  const params = useParams();
  const id = params?.id;
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const response = await fetch(`/api/chart/${id}`);
        if (!response.ok) {
          throw new Error('Chart not found');
        }
        // The API redirects to the blob URL
        setImageUrl(response.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chart');
      }
    };

    if (id) {
      fetchChart();
    }
  }, [id]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!imageUrl) {
    return <div>Loading...</div>;
  }

  return (
    <div className="chart-container">
      <Image src={imageUrl} alt="Chart" />
    </div>
  );
}
