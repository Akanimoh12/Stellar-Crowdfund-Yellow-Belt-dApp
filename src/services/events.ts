import * as StellarSdk from '@stellar/stellar-sdk';
import { getSorobanServer } from './soroban';
import { CONTRACT_ID } from '../config/network';
import { DonationEvent } from '../types';

export type EventCallback = (event: DonationEvent) => void;

let pollingInterval: ReturnType<typeof setInterval> | null = null;
let lastLedger = 0;

export function startEventPolling(callback: EventCallback): void {
  if (pollingInterval) return;

  pollingInterval = setInterval(async () => {
    try {
      const server = getSorobanServer();

      if (lastLedger === 0) {
        const latestLedger = await server.getLatestLedger();
        lastLedger = latestLedger.sequence - 100;
      }

      const events = await server.getEvents({
        startLedger: lastLedger,
        filters: [
          {
            type: 'contract',
            contractIds: [CONTRACT_ID],
            topics: [['*']],
          },
        ],
        limit: 20,
      });

      if (events.events && events.events.length > 0) {
        for (const event of events.events) {
          const topics = event.topic;
          if (topics.length >= 2) {
            const eventType = StellarSdk.scValToNative(topics[1]);
            if (eventType === 'donate' && event.value) {
              const val = StellarSdk.scValToNative(event.value);
              callback({
                donor: val?.donor?.toString() || 'Unknown',
                amount: Number(val?.amount || 0),
                timestamp: Date.now(),
                txHash: event.id,
              });
            }
          }

          const eventLedger =
            typeof event.ledger === 'number' ? event.ledger : parseInt(String(event.ledger));
          if (eventLedger > lastLedger) {
            lastLedger = eventLedger;
          }
        }
      }
    } catch (e) {
      console.warn('Event polling error:', e);
    }
  }, 5000);
}

export function stopEventPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}
