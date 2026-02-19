import React, { useState } from 'react';
import { FiAward, FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import { useWallet } from '../hooks/useWallet';
import { useCampaign } from '../hooks/useCampaign';
import { claimFunds } from '../services/contract';
import { AppError, AppErrorType, TransactionResult } from '../types';

const ClaimButton: React.FC = () => {
  const { wallet } = useWallet();
  const { campaign, goalReached, isExpired, refetch } = useCampaign();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  const handleClaim = async () => {
    if (!wallet) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const hash = await claimFunds(wallet.publicKey);
      setResult({ success: true, hash });
      refetch();
    } catch (err: any) {
      if (err.type) {
        setError(err as AppError);
      } else {
        setError({ type: AppErrorType.CONTRACT_ERROR, message: err.message || 'Claim failed' });
      }
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!wallet || !campaign) {
    return (
      <div>
        <h2><FiAward size={18} /> Claim Funds</h2>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          {!wallet ? 'Connect wallet to check claim eligibility.' : 'Loading campaign...'}
        </p>
      </div>
    );
  }

  // Only the campaign owner can claim
  const isOwner = wallet.publicKey === campaign.owner;

  return (
    <div>
      <h2><FiAward size={18} /> Claim Funds</h2>

      {error && (
        <div className={`error ${error.type === AppErrorType.GOAL_NOT_REACHED ? 'error-warning' : ''}`}>
          <strong>{error.type.replace(/_/g, ' ')}:</strong> {error.message}
        </div>
      )}

      {result?.success ? (
        <div className="success-box">
          <FiCheckCircle size={20} />
          <div>
            <p><strong>Funds claimed successfully!</strong></p>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`}
              target="_blank"
              rel="noreferrer"
              className="tx-link"
            >
              <FiExternalLink size={12} /> View on Stellar Expert
            </a>
          </div>
        </div>
      ) : campaign.claimed ? (
        <p style={{ color: '#6b7280' }}>Funds have already been claimed.</p>
      ) : !isOwner ? (
        <p style={{ color: '#6b7280' }}>Only the campaign owner can claim funds.</p>
      ) : (
        <div>
          {!isExpired && (
            <p className="claim-note">Campaign must end before funds can be claimed.</p>
          )}
          {isExpired && !goalReached && (
            <p className="claim-note error-text">Goal was not reached. Cannot claim.</p>
          )}
          <button
            className="btn btn-claim"
            onClick={handleClaim}
            disabled={loading || campaign.claimed}
          >
            <FiAward size={15} /> {loading ? 'Claiming...' : 'Claim Funds'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ClaimButton;
