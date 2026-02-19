import React from 'react';
import { FiTarget, FiClock, FiTrendingUp, FiCheckCircle, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { useCampaign } from '../hooks/useCampaign';

const fmt = (n: number) => (n / 10_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CampaignCard: React.FC = () => {
  const { campaign, loading, error, refetch, progress, isExpired, goalReached } = useCampaign();

  if (loading && !campaign) {
    return (
      <div>
        <h2><FiTarget size={18} /> Campaign</h2>
        <p className="loading-text">Loading campaign data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2><FiTarget size={18} /> Campaign</h2>
        <div className="error">{error.message}</div>
        <button className="btn btn-sm" onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div>
        <h2><FiTarget size={18} /> Campaign</h2>
        <p style={{ color: '#6b7280' }}>No campaign found. Deploy the contract and initialize first.</p>
      </div>
    );
  }

  const deadlineDate = new Date(campaign.deadline * 1000);
  const timeLeft = campaign.deadline * 1000 - Date.now();
  const daysLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

  return (
    <div>
      <div className="card-header-row">
        <h2><FiTarget size={18} /> Campaign Dashboard</h2>
      </div>

      <div className="campaign-stats">
        <div className="stat-card">
          <FiTrendingUp size={22} className="stat-icon" />
          <div className="stat-value">{fmt(campaign.totalRaised)}</div>
          <div className="stat-label">Raised</div>
        </div>
        <div className="stat-card">
          <FiTarget size={22} className="stat-icon" />
          <div className="stat-value">{fmt(campaign.goal)}</div>
          <div className="stat-label">Goal</div>
        </div>
        <div className="stat-card">
          <FiClock size={22} className="stat-icon" />
          <div className="stat-value">{isExpired ? 'Ended' : `${daysLeft}d ${hoursLeft}h`}</div>
          <div className="stat-label">{isExpired ? 'Campaign Over' : 'Time Left'}</div>
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">
          <span>{progress}% funded</span>
          <span>{fmt(campaign.totalRaised)} / {fmt(campaign.goal)}</span>
        </div>
      </div>

      <div className="campaign-status">
        {campaign.claimed ? (
          <span className="status-badge status-claimed"><FiCheckCircle size={13} /> Funds Claimed</span>
        ) : goalReached ? (
          <span className="status-badge status-success"><FiCheckCircle size={13} /> Goal Reached!</span>
        ) : isExpired ? (
          <span className="status-badge status-expired"><FiAlertTriangle size={13} /> Expired</span>
        ) : (
          <span className="status-badge status-active"><FiTrendingUp size={13} /> Active</span>
        )}
      </div>

      <div className="campaign-details">
        <p><strong>Owner:</strong></p>
        <div className="address">{campaign.owner}</div>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>Deadline:</strong> {deadlineDate.toLocaleDateString()} {deadlineDate.toLocaleTimeString()}
        </p>
      </div>

      <button className="btn btn-sm btn-outline" onClick={refetch} disabled={loading}>
        <FiRefreshCw size={14} /> {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
};

export default CampaignCard;
