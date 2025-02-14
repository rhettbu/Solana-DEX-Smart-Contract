import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

export interface GlobalPool {
  admin: PublicKey;
  maxOrdersPerUser: anchor.BN;
  maxOrdersPerBook: anchor.BN;
  totalMarketCount: anchor.BN;
  marketSeqNum: anchor.BN;
}

export interface UserMarketOrders {
  address: PublicKey;
  market: PublicKey;
  openedOrdersCount: anchor.BN;
  baseDepositTotal: anchor.BN;
  quoteDepositTotal: anchor.BN;
  baseTotalVolume: anchor.BN;
  quoteTotalVolume: anchor.BN;
}

export interface Market {
  seed: anchor.BN;
  name: string;
  marketAuthority: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseDecimal: number;
  quoteDecimal: number;
  bids: PublicKey;
  asks: PublicKey;
  createdAt: anchor.BN;
  baseTotalVolume: anchor.BN;
  quoteTotalVolume: anchor.BN;
  orderSeqNum: anchor.BN;
}

export const MARKET_SIZE = 8 + 8 + 16 + 32 * 5 + 8 + 8 * 4 + 16;

export enum Side {
  Bid = 0,
  Ask = 1,
}

export const sideFromStr = (side: string): Side => {
  if (side === 'bid') return Side.Bid;
  else return Side.Ask;
};

export type OpenedOrder = {
  orderId: anchor.BN;
  owner: PublicKey;
  price: anchor.BN;
  quantity: anchor.BN;
  createdAt: anchor.BN;
};

export interface Book {
  side: Side;
  market: PublicKey;
  ordersCount: anchor.BN;
  orders: OpenedOrder[];
}
