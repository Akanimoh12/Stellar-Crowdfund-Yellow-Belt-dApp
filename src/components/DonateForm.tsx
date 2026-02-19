import React, { useState } from 'react';
import { FiHeart, FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import { useWallet } from '../hooks/useWallet';
import { useDonate } from '../hooks/useDonate';
import { AppErrorType } from '../types';

const DonateForm: React.FC<{ onDonated?: () => void }> = ({ onDonated }) => {
  const { wallet } = useWallet();
  const { submitDonation, result, loading, error, reset } = useDonate();
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    // Convert to 7-decimal token units
    await submitDonation(wallet.publicKey, Math.floor(numAmount * 10_000_000));
    // Only clear + refresh on success (result is set inside submitDonation)
  };

  // Watch for successful result and trigger refresh
  React.useEffect(() => {
    if (result?.success) {
      setAmount('');
      if (onDonated) onDonated();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (!wallet) {
    return (
      <div>
        <h2><FiHeart size={18} /> Donate</h2>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Connect your wallet first to make a donation.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2><FiHeart size={18} /> Donate to Campaign</h2>

      {error && (
        <div className={`error ${
          error.type === AppErrorType.TRANSACTION_REJECTED ? 'error-warning' :
          error.type === AppErrorType.INSUFFICIENT_BALANCE ? 'error-danger' :
          error.type === AppErrorType.CAMPAIGN_ENDED ? 'error-info' : ''
        }`}>
          <strong>{error.type.replace(/_/g, ' ')}:</strong> {error.message}
        </div>
      )}

      {result?.success ? (
        <div className="success-box">
          <FiCheckCircle size={20} />
          <div>
            <p><strong>Donation Successful!</strong></p>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`}
              target="_blank"
              rel="noreferrer"
              className="tx-link"
            >
              <FiExternalLink size={12} /> View on Stellar Expert
            </a>
          </div>
          <button className="btn btn-sm" onClick={reset} style={{ marginLeft: 'auto' }}>
            Donate Again
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="donate-amount">Amount (tokens)</label>
            <input
              id="donate-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 100.00"
              required
              disabled={loading}
            />
          </div>
          <button className="btn" type="submit" disabled={loading || !amount}>
            <FiHeart size={15} /> {loading ? 'Processing...' : 'Donate'}
          </button>
        </form>
      )}
    </div>
  );
};

export default DonateForm;
