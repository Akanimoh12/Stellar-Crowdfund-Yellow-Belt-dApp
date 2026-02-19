export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

export interface CampaignInfo {
  owner: string;
  token: string;
  goal: number;
  deadline: number;
  totalRaised: number;
  claimed: boolean;
}

export interface DonationEvent {
  donor: string;
  amount: number;
  timestamp: number;
  txHash: string;
}

export enum AppErrorType {
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  CAMPAIGN_ENDED = 'CAMPAIGN_ENDED',
  GOAL_NOT_REACHED = 'GOAL_NOT_REACHED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
}

export interface AppError {
  type: AppErrorType;
  message: string;
  details?: string;
}

export type WalletType = 'freighter' | 'albedo' | 'xbull';