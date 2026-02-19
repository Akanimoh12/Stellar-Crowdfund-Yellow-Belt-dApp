import * as StellarSdk from '@stellar/stellar-sdk';
import { getSorobanServer } from './soroban';
import { NETWORK, CONTRACT_ID, CAMPAIGN_OWNER } from '../config/network';
import { CampaignInfo, AppError, AppErrorType } from '../types';

// Dynamic import to avoid crashing if stellar-wallets-kit has module-level issues
async function loadSignWithKit() {
  const { signWithKit } = await import('../wallet/kit');
  return signWithKit;
}

const { Contract, TransactionBuilder, Networks, Address, nativeToScVal, scValToNative } = StellarSdk;

// ─── Helpers ────────────────────────────────────────────────────────────
function err(type: AppErrorType, message: string, details?: string): AppError {
  return { type, message, details };
}

function getContract(): StellarSdk.Contract {
  return new Contract(CONTRACT_ID);
}

async function buildAndSendTx(
  publicKey: string,
  operation: StellarSdk.xdr.Operation
): Promise<string> {
  const server = getSorobanServer();
  const account = await server.getAccount(publicKey);

  let tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(operation)
    .setTimeout(60)
    .build();

  // Simulate to get the proper footprint & resource limits
  const simulated = await server.simulateTransaction(tx);
  if (StellarSdk.SorobanRpc.Api.isSimulationError(simulated)) {
    const errMsg = (simulated as any).error || 'Simulation failed';
    if (errMsg.includes('campaign has ended') || errMsg.includes('deadline')) {
      throw err(AppErrorType.CAMPAIGN_ENDED, 'Campaign has ended — no more donations accepted.');
    }
    if (errMsg.includes('goal not reached')) {
      throw err(AppErrorType.GOAL_NOT_REACHED, 'Funding goal was not reached. Cannot claim.');
    }
    if (errMsg.includes('already claimed')) {
      throw err(AppErrorType.CONTRACT_ERROR, 'Funds have already been claimed.');
    }
    throw err(AppErrorType.CONTRACT_ERROR, errMsg);
  }

  // Assemble with the simulation footprint
  tx = StellarSdk.SorobanRpc.assembleTransaction(tx, simulated).build();

  // Sign via wallet kit (multi-wallet)
  let signedXdr: string;
  try {
    const signWithKit = await loadSignWithKit();
    signedXdr = await signWithKit(tx.toXDR(), publicKey, NETWORK.passphrase);
  } catch (e: any) {
    const msg = e?.message || '';
    if (msg.includes('User declined') || msg.includes('rejected') || msg.includes('cancel') || msg.includes('denied')) {
      throw err(AppErrorType.TRANSACTION_REJECTED, 'You rejected the transaction in your wallet.');
    }
    throw err(AppErrorType.TRANSACTION_REJECTED, msg || 'Wallet signing failed');
  }

  const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const response = await server.sendTransaction(signedTx as StellarSdk.Transaction);

  if (response.status === 'ERROR') {
    const errDetails = (response as any).errorResult?.toString() || 'Unknown error';
    throw err(AppErrorType.CONTRACT_ERROR, 'Transaction submission failed', errDetails);
  }
  if (response.status === 'TRY_AGAIN_LATER') {
    throw err(AppErrorType.NETWORK_ERROR, 'Network is busy. Please try again in a moment.');
  }

  // Poll for on-chain result.
  // NOTE: stellar-sdk v11 can throw "Bad union switch" when parsing newer
  // protocol result types.  Since sendTransaction already returned PENDING
  // (not ERROR), the tx is very likely to succeed, so we treat parse errors
  // as success and return the hash.
  try {
    let result = await server.getTransaction(response.hash);
    const maxRetries = 30;
    let retries = 0;
    while (result.status === 'NOT_FOUND' && retries < maxRetries) {
      await new Promise((r) => setTimeout(r, 2000));
      result = await server.getTransaction(response.hash);
      retries++;
    }

    if (result.status === 'FAILED') {
      const detail = (result as any).resultXdr?.toString() || '';
      if (detail.includes('balance') || detail.includes('insufficient')) {
        throw err(AppErrorType.INSUFFICIENT_BALANCE, 'Insufficient balance to complete this transaction.');
      }
      throw err(AppErrorType.CONTRACT_ERROR, 'Transaction failed on-chain. Check your balance and try again.', detail);
    }

    if (result.status === 'NOT_FOUND') {
      throw err(AppErrorType.NETWORK_ERROR, 'Transaction submitted but confirmation timed out. Check Stellar Expert for status.');
    }
  } catch (pollErr: any) {
    // Re-throw our own AppErrors
    if (pollErr?.type) throw pollErr;
    // SDK parse errors (e.g. "Bad union switch: 4") — tx was already
    // accepted by the network so treat as success.
    console.warn('[Crowdfund] getTransaction parse warning:', pollErr?.message);
  }

  return response.hash;
}

// ─── Public API ─────────────────────────────────────────────────────────

export async function getCampaign(): Promise<CampaignInfo> {
  const server = getSorobanServer();
  const contract = getContract();

  // For read-only calls we use the known deployer/owner account
  let account: StellarSdk.SorobanRpc.Api.Account;
  try {
    account = await server.getAccount(CAMPAIGN_OWNER);
  } catch {
    throw err(AppErrorType.NETWORK_ERROR, 'Cannot reach Stellar network');
  }

  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call('get_campaign'))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);
  if (StellarSdk.SorobanRpc.Api.isSimulationError(simulated)) {
    throw err(AppErrorType.CONTRACT_ERROR, 'Failed to read campaign from contract');
  }

  const successSim = simulated as StellarSdk.SorobanRpc.Api.SimulateTransactionSuccessResponse;
  if (!successSim.result) {
    throw err(AppErrorType.CONTRACT_ERROR, 'No result from simulation');
  }

  const raw = scValToNative(successSim.result.retval);
  return {
    owner: raw.owner?.toString() || '',
    token: raw.token?.toString() || '',
    goal: Number(raw.goal || 0),
    deadline: Number(raw.deadline || 0),
    totalRaised: Number(raw.total_raised || 0),
    claimed: Boolean(raw.claimed),
  };
}

export async function donate(publicKey: string, amount: number): Promise<string> {
  if (amount <= 0) {
    throw err(AppErrorType.CONTRACT_ERROR, 'Donation amount must be greater than zero.');
  }

  // Pre-check: make sure account exists on Soroban RPC
  try {
    const server = getSorobanServer();
    await server.getAccount(publicKey);
  } catch {
    throw err(AppErrorType.INSUFFICIENT_BALANCE, 'Account not found or not funded. Use Friendbot first.');
  }

  const contract = getContract();
  const op = contract.call(
    'donate',
    new Address(publicKey).toScVal(),
    nativeToScVal(amount, { type: 'i128' })
  );

  return buildAndSendTx(publicKey, op);
}

export async function claimFunds(publicKey: string): Promise<string> {
  const contract = getContract();
  const op = contract.call('claim');
  return buildAndSendTx(publicKey, op);
}

export async function getDonation(publicKey: string, donorAddress: string): Promise<number> {
  const server = getSorobanServer();
  const contract = getContract();
  const account = await server.getAccount(publicKey);

  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call('get_donation', new Address(donorAddress).toScVal()))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);
  if (StellarSdk.SorobanRpc.Api.isSimulationError(simulated)) return 0;
  const successSim = simulated as StellarSdk.SorobanRpc.Api.SimulateTransactionSuccessResponse;
  if (!successSim.result) return 0;
  return Number(scValToNative(successSim.result.retval));
}
