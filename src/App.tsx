import React, { useState } from 'react';
import { HiOutlineGlobeAlt } from 'react-icons/hi';
import { SiStellar } from 'react-icons/si';
import { FiTarget, FiHeart, FiActivity, FiAward } from 'react-icons/fi';
import WalletConnect from './components/WalletConnect';
import CampaignCard from './components/CampaignCard';
import DonateForm from './components/DonateForm';
import ClaimButton from './components/ClaimButton';
import EventFeed from './components/EventFeed';
import { WalletProvider, useWallet } from './hooks/useWallet';
import { useCampaign } from './hooks/useCampaign';

type Tab = 'dashboard' | 'donate' | 'events' | 'claim';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <FiTarget size={16} /> },
  { id: 'donate', label: 'Donate', icon: <FiHeart size={16} /> },
  { id: 'events', label: 'Events', icon: <FiActivity size={16} /> },
  { id: 'claim', label: 'Claim', icon: <FiAward size={16} /> },
];

const AppContent: React.FC = () => {
  const { wallet } = useWallet();
  const { refetch } = useCampaign();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="app-layout">
      {/* Top nav bar */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-brand">
            <SiStellar size={22} />
            <span className="topbar-title">Stellar Crowdfund</span>
            <span className="topbar-badge">Testnet</span>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="tab-nav">
        <div className="tab-nav-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main content area */}
      <main className="main-content">
        <div className="content-container">
          {activeTab === 'dashboard' && (
            <section className="page-section">
              <CampaignCard />
            </section>
          )}

          {activeTab === 'donate' && (
            <section className="page-section">
              {!wallet ? (
                <div className="empty-state">
                  <FiHeart size={40} className="empty-icon" />
                  <h3>Connect Wallet to Donate</h3>
                  <p>Connect your Stellar wallet to make a donation to this campaign.</p>
                </div>
              ) : (
                <div className="donate-layout">
                  <div className="card">
                    <DonateForm onDonated={refetch} />
                  </div>
                  <div className="card donate-info-card">
                    <h3>How Donations Work</h3>
                    <ul className="info-list">
                      <li>Donations use native XLM on Stellar Testnet</li>
                      <li>Tokens are transferred to the campaign contract</li>
                      <li>Your wallet will prompt for signature approval</li>
                      <li>All transactions are recorded on-chain</li>
                    </ul>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'events' && (
            <section className="page-section">
              <div className="card">
                <EventFeed />
              </div>
            </section>
          )}

          {activeTab === 'claim' && (
            <section className="page-section">
              {!wallet ? (
                <div className="empty-state">
                  <FiAward size={40} className="empty-icon" />
                  <h3>Connect Wallet to Claim</h3>
                  <p>Only the campaign owner can claim funds after the goal is reached.</p>
                </div>
              ) : (
                <div className="card">
                  <ClaimButton />
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <HiOutlineGlobeAlt size={14} />
        <span>Built on Stellar Soroban &bull; Multi-Wallet Support &bull; Yellow Belt Challenge</span>
      </footer>
    </div>
  );
};

function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}

export default App;
