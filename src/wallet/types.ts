import { WalletType } from '../types';

export interface Wallet {
  publicKey: string;
  walletType: WalletType;
}