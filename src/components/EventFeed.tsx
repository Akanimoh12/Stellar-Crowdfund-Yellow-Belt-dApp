import React from 'react';
import { FiActivity, FiPlay, FiSquare } from 'react-icons/fi';
import { useEvents } from '../hooks/useEvents';

const EventFeed: React.FC = () => {
  const { events, listening, start, stop } = useEvents();

  return (
    <div>
      <h2><FiActivity size={18} /> Live Events</h2>

      <div className="event-controls">
        {listening ? (
          <button className="btn btn-sm btn-danger" onClick={stop}>
            <FiSquare size={14} /> Stop Listening
          </button>
        ) : (
          <button className="btn btn-sm" onClick={start}>
            <FiPlay size={14} /> Start Listening
          </button>
        )}
        {listening && <span className="pulse-dot" />}
        {listening && <span className="listening-text">Listening for events...</span>}
      </div>

      {events.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '1rem' }}>
          {listening ? 'Waiting for events...' : 'Start listening to see real-time donation events.'}
        </p>
      ) : (
        <div className="event-list">
          {events.map((evt, i) => (
            <div key={`${evt.txHash}-${i}`} className="event-item">
              <div className="event-header">
                <span className="event-amount">+{(evt.amount / 10_000_000).toFixed(2)} tokens</span>
                <span className="event-time">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="event-donor">
                From: {evt.donor.slice(0, 8)}...{evt.donor.slice(-8)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventFeed;
