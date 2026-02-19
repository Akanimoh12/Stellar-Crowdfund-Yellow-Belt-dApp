import { useState, useEffect, useCallback, useRef } from 'react';
import { startEventPolling, stopEventPolling } from '../services/events';
import { DonationEvent } from '../types';

export function useEvents() {
  const [events, setEvents] = useState<DonationEvent[]>([]);
  const [listening, setListening] = useState(false);
  const eventsRef = useRef<DonationEvent[]>([]);

  const handleEvent = useCallback((event: DonationEvent) => {
    eventsRef.current = [event, ...eventsRef.current].slice(0, 50);
    setEvents([...eventsRef.current]);
  }, []);

  const start = useCallback(() => {
    startEventPolling(handleEvent);
    setListening(true);
  }, [handleEvent]);

  const stop = useCallback(() => {
    stopEventPolling();
    setListening(false);
  }, []);

  useEffect(() => {
    return () => {
      stopEventPolling();
    };
  }, []);

  return { events, listening, start, stop };
}
