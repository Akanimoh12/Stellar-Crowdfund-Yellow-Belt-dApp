import { useState, useEffect, useCallback } from 'react';
import { getCampaign } from '../services/contract';
import { CampaignInfo, AppError } from '../types';

export function useCampaign() {
  const [campaign, setCampaign] = useState<CampaignInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await getCampaign();
      setCampaign(info);
    } catch (err: any) {
      setError(err as AppError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const progress = campaign
    ? Math.min(100, Math.round((campaign.totalRaised / campaign.goal) * 100))
    : 0;

  const isExpired = campaign
    ? Date.now() / 1000 > campaign.deadline
    : false;

  const goalReached = campaign
    ? campaign.totalRaised >= campaign.goal
    : false;

  return { campaign, loading, error, refetch: fetchCampaign, progress, isExpired, goalReached };
}
