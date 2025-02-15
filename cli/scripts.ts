import { Program, web3 } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';

import IDL from '../target/idl/hybrid_dex.json';
import {
  cancelOrderTx,
  changeAdminTx,
  closeMarketTx,
  createChangeConfigTx,
  createInitializeTx,
  createMarketTx,
  createOpenOrdersTx,
  findAllMarkets,
  getGlobalState,
  getMarketBookState,
  getMarketState,
  getUserMarketOrdersState,
  partialTakeOrderTx,
  placeOrderTx,
  takeOrderTx,
} from '../lib/scripts';
import { HybridDex } from '../target/types/hybrid_dex';
import { Side } from '../lib/types';

let solConnection: Connection = null;
let program: Program<HybridDex> = null;
let provider: anchor.Provider = null;
let payer: NodeWallet = null;

/**
 * Set cluster, provider, program
 * If rpc != null use rpc, otherwise use cluster param
 * @param cluster - cluster ex. mainnet-beta, devnet ...
 * @param keypair - wallet keypair
 * @param rpc - rpc
 */
export const setClusterConfig = async (
  cluster: web3.Cluster,
  keypair: string,
  rpc?: string
) => {
  if (!rpc) {
    solConnection = new web3.Connection(web3.clusterApiUrl(cluster));
  } else {
    solConnection = new web3.Connection(rpc);
  }

  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(keypair, 'utf-8'))),
    { skipValidation: true }
  );
  const wallet = new NodeWallet(walletKeypair);

  // Configure the client to use the local cluster.
  provider = new anchor.AnchorProvider(solConnection, wallet, {
    skipPreflight: false,
    commitment: 'confirmed',
  });
  anchor.setProvider(provider);
  payer = wallet;

  console.log('Wallet Address: ', wallet.publicKey.toBase58());

  // Generate the program client from IDL.
  program = new anchor.Program(IDL as HybridDex, provider);
  console.log('ProgramId: ', program.programId.toBase58());
};

/**
 * Initialize global pool
 */
export const initProject = async (
  maxOrdersPerUser: number,
  maxOrdersPerBook: number
) => {
  try {
    const tx = new Transaction().add(
      await createInitializeTx(
        payer.publicKey,
        maxOrdersPerUser,
        maxOrdersPerBook,
        program
      )
    );
    const { blockhash } = await solConnection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = payer.publicKey;

    payer.signTransaction(tx);

    const txId = await provider.sendAndConfirm(tx, [], {
      commitment: 'confirmed',
    });

    console.log('txHash: ', txId);
  } catch (e) {
    console.log(e);
  }
};

/**
 * Change admin of the program
 */
export const changeAdmin = async (newAdmin: string) => {
  let newAdminAddr = null;
  try {
    newAdminAddr = new PublicKey(newAdmin);
  } catch {
    newAdminAddr = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(fs.readFileSync(newAdmin, 'utf-8'))),
      { skipValidation: true }
    ).publicKey;
  }

  const tx = await changeAdminTx(payer.publicKey, newAdminAddr, program);

  const txId = await provider.sendAndConfirm(tx, [], {
    commitment: 'confirmed',
  });

  console.log('txHash: ', txId);
};

/**
 * Change global config as admin
 */
export const changeConfig = async (
  maxOrdersPerUser: number | undefined,
  maxOrdersPerBook: number | undefined
) => {
  try {
    const tx = new Transaction().add(
      await createChangeConfigTx(
        payer.publicKey,
        maxOrdersPerUser,
        maxOrdersPerBook,
        program
      )
    );
    const { blockhash } = await solConnection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = payer.publicKey;

    payer.signTransaction(tx);

    const txId = await provider.sendAndConfirm(tx, [], {
      commitment: 'confirmed',
    });

    console.log('txHash: ', txId);
  } catch (e) {
    console.log(e);
  }
};

/**
 * Create market
 */
export const createMarket = async (
  baseMint: PublicKey,
  quoteMint: PublicKey,
  name: string
) => {
  const tx = await createMarketTx(
    payer.publicKey,
    baseMint,
    quoteMint,
    name,
    program
  );

  const txId = await provider.sendAndConfirm(tx, [], {
    commitment: 'confirmed',
  });

  console.log('txHash: ', txId);
};

/**
 * Close market with market owner authority or global admin authority
 */
export const closeMarket = async (market: PublicKey) => {
  try {
    const tx = await closeMarketTx(payer.publicKey, market, program);

    const txId = await provider.sendAndConfirm(tx, [], {
      commitment: 'confirmed',
    });

    console.log('txHash: ', txId);
  } catch (e) {
    console.log(e);
  }
};

export const createOpenOrders = async (market: PublicKey) => {
  const tx = await createOpenOrdersTx(payer.publicKey, market, program);

  const txId = await provider.sendAndConfirm(tx, [], {
    commitment: 'confirmed',
  });

  console.log('txHash: ', txId);
};

export const placeOrder = async (
  market: PublicKey,
  side: Side,
  price: number,
  quantity: number
) => {
  const tx = await placeOrderTx(
    payer.publicKey,
    market,
    side,
    price,
    quantity,
    program
  );

  const txId = await provider.sendAndConfirm(tx, [], {
    commitment: 'confirmed',
  });

  console.log('txHash: ', txId);
};

export const cancelOrder = async (
  market: PublicKey,
  side: Side,
  orderId: number
) => {
  const tx = await cancelOrderTx(
    payer.publicKey,
    market,
    side,
    orderId,
    program
  );

  const txId = await provider.sendAndConfirm(tx, [], {
    commitment: 'confirmed',
  });

  console.log('txHash: ', txId);
};

export const takeOrder = async (
  market: PublicKey,
  maker: PublicKey,
  side: Side,
  orderId: number
) => {
  const tx = await takeOrderTx(
    payer.publicKey,
    maker,
    market,
    side,
    orderId,
    program
  );

  const txId = await provider.sendAndConfirm(tx, [], {
    commitment: 'confirmed',
  });

  console.log('txHash: ', txId);
};

export const partialTakeOrder = async (
  market: PublicKey,
  maker: PublicKey,
  side: Side,
  orderId: number,
  amount: number
) => {
  const tx = await partialTakeOrderTx(
    payer.publicKey,
    maker,
    market,
    side,
    orderId,
    amount,
    program
  );

  const txId = await provider.sendAndConfirm(tx, [], {
    commitment: 'confirmed',
  });

  console.log('txHash: ', txId);
};

export const getGlobalInfo = async () => {
  const { data, key } = await getGlobalState(program);
  console.log('global pool: ', key.toBase58());

  return {
    admin: data.admin.toBase58(),
    maxOrdersPerUser: data.maxOrdersPerUser.toNumber(),
    maxOrdersPerBook: data.maxOrdersPerBook.toNumber(),
    totalMarketCount: data.totalMarketCount.toNumber(),
    marketSeqNum: data.marketSeqNum.toNumber(),
  };
};

export const getMarketInfo = async (market: PublicKey) => {
  const { data, key } = await getMarketState(market, program);
  console.log('market info: ', key.toBase58());

  return {
    seed: data.seed.toNumber(),
    name: Buffer.from(data.name)
      .filter((buf) => buf !== 0x0)
      .toString(),
    marketAuthority: data.marketAuthority.toBase58(),
    baseMint: data.baseMint.toBase58(),
    quoteMint: data.quoteMint.toBase58(),
    baseDecimal: data.baseDecimal,
    quoteDecimal: data.quoteDecimal,
    bids: data.bids.toBase58(),
    asks: data.asks.toBase58(),
    createdAt: data.createdAt.toNumber(),
    baseTotalVolume: data.baseTotalVolume.toNumber(),
    quoteTotalVolume: data.quoteTotalVolume.toNumber(),
    orderSeqNum: data.orderSeqNum.toNumber(),
  };
};

export const getAllMarkets = async ({
  base,
  quote,
}: {
  base?: PublicKey;
  quote?: PublicKey;
}) => {
  const data = await findAllMarkets({ base, quote }, program);
  return data;
};

export const getUserOrdersInfo = async (market: PublicKey, user: PublicKey) => {
  const { data, key } = await getUserMarketOrdersState(market, user, program);
  console.log('user orders: ', key.toBase58());

  return {
    address: data.address.toBase58(),
    market: data.market.toBase58(),
    openedOrdersCount: data.openedOrdersCount.toNumber(),
    baseDepositTotal: data.baseDepositTotal.toNumber(),
    quoteDepositTotal: data.quoteDepositTotal.toNumber(),
    baseTotalVolume: data.baseTotalVolume.toNumber(),
    quoteTotalVolume: data.quoteTotalVolume.toNumber(),
  };
};

export const getOrderBooksInfo = async (market: PublicKey) => {
  const { bids, asks, key } = await getMarketBookState(market, program);
  console.log('market: ', key.toBase58());

  return {
    bids: {
      side: bids.side,
      market: bids.market.toBase58(),
      ordersCount: bids.ordersCount.toNumber(),
      orders: bids.orders.map((order) => ({
        orderId: order.orderId.toNumber(),
        owner: order.owner.toBase58(),
        price: order.price.toNumber(),
        quantity: order.quantity.toNumber(),
        createdAt: order.createdAt.toNumber(),
      })),
    },
    asks: {
      side: asks.side,
      market: asks.market.toBase58(),
      ordersCount: asks.ordersCount.toNumber(),
      orders: asks.orders.map((order) => ({
        orderId: order.orderId.toNumber(),
        owner: order.owner.toBase58(),
        price: order.price.toNumber(),
        quantity: order.quantity.toNumber(),
        createdAt: order.createdAt.toNumber(),
      })),
    },
  };
};
