import * as anchor from '@coral-xyz/anchor';
import { PublicKey, Transaction } from '@solana/web3.js';

import {
  ASK_BOOK_SEED,
  BID_BOOK_SEED,
  GLOBAL_AUTHORITY_SEED,
  MARKET_SEED,
  USER_MARKET_ORDER_SEED,
} from './constant';
import { HybridDex } from './hybrid_dex';
import { Market, MARKET_SIZE, Side } from './types';

export const createInitializeTx = async (
  admin: PublicKey,
  maxOrdersPerUser: number,
  maxOrdersPerBook: number,
  program: anchor.Program<HybridDex>
) => {
  console.log({
    maxOrdersPerUser,
    maxOrdersPerBook,
  });

  const [globalPool] = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );
  console.log('globalPool: ', globalPool.toBase58());

  const tx = await program.methods
    .initialize(
      new anchor.BN(maxOrdersPerUser),
      new anchor.BN(maxOrdersPerBook)
    )
    .accounts({
      admin,
    })
    .transaction();

  return tx;
};

/**
 * Change admin of the program as old admin
 */
export const changeAdminTx = async (
  admin: PublicKey,
  newAdminAddr: PublicKey,
  program: anchor.Program<HybridDex>
) => {
  const [globalPool] = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );

  const tx = await program.methods
    .transferAdmin(newAdminAddr)
    .accounts({
      admin,
      globalPool,
    })
    .transaction();

  return tx;
};

/**
 * Change global config as admin
 */
export const createChangeConfigTx = async (
  admin: PublicKey,
  maxOrdersPerUser: number | undefined,
  maxOrdersPerBook: number | undefined,
  program: anchor.Program<HybridDex>
) => {
  const [globalPool] = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );

  const tx = await program.methods
    .changeConfig(
      maxOrdersPerUser ? new anchor.BN(maxOrdersPerUser) : null,
      maxOrdersPerBook ? new anchor.BN(maxOrdersPerBook) : null
    )
    .accounts({
      admin,
      globalPool,
    })
    .transaction();

  return tx;
};

/**
 * Create market
 */
export const createMarketTx = async (
  authority: PublicKey,
  baseMint: PublicKey,
  quoteMint: PublicKey,
  name: string,
  program: anchor.Program<HybridDex>
) => {
  const { data } = await getGlobalState(program);

  const [market] = PublicKey.findProgramAddressSync(
    [Buffer.from(MARKET_SEED), data.marketSeqNum.toArrayLike(Buffer, 'le', 8)],
    program.programId
  );
  console.log(data.marketSeqNum.toNumber(), 'market: ', market.toBase58());

  const tx = new Transaction();

  const txId = await program.methods
    .createMarket(name)
    .accounts({
      authority,
      baseMint,
      quoteMint,
    })
    .transaction();

  tx.add(txId);

  return tx;
};

/**
 * Close market with market owner authority or global admin authority
 */
export const closeMarketTx = async (
  authority: PublicKey,
  market: PublicKey,
  program: anchor.Program<HybridDex>
) => {
  const { data } = await getMarketState(market, program);
  console.log('market seed', data.seed);

  const tx = await program.methods
    .closeMarket(new anchor.BN(data.seed))
    .accounts({
      authority,
    })
    .transaction();

  return tx;
};

export const createOpenOrdersTx = async (
  user: PublicKey,
  market: PublicKey,
  program: anchor.Program<HybridDex>
) => {
  const tx = new Transaction();

  const txId = await program.methods
    .createOpenOrders()
    .accounts({
      user,
      market,
    })
    .transaction();

  tx.add(txId);

  return tx;
};

export const placeOrderTx = async (
  maker: PublicKey,
  market: PublicKey,
  side: Side,
  price: number, // should have base decimal value
  quantity: number, // should have quote / base decimal
  program: anchor.Program<HybridDex>
) => {
  if (side === Side.Bid) {
    const tx = new Transaction();
    const txId = await program.methods
      .placeBuyOrder(new anchor.BN(price), new anchor.BN(quantity))
      .accounts({
        maker,
        // @ts-ignore
        market,
      })
      .transaction();

    tx.add(txId);

    return tx;
  } else {
    const tx = new Transaction();
    const txId = await program.methods
      .placeSellOrder(new anchor.BN(price), new anchor.BN(quantity))
      .accounts({
        maker,
        // @ts-ignore
        market,
      })
      .transaction();

    tx.add(txId);

    return tx;
  }
};

export const cancelOrderTx = async (
  maker: PublicKey,
  market: PublicKey,
  side: Side,
  orderId: number,
  program: anchor.Program<HybridDex>
) => {
  const { data } = await getMarketState(market, program);

  if (side === Side.Bid) {
    const tx = new Transaction();

    const txId = await program.methods
      .cancelBuyOrder(new anchor.BN(data.seed), new anchor.BN(orderId))
      .accounts({ maker })
      .transaction();

    tx.add(txId);

    return tx;
  } else {
    const tx = new Transaction();

    const txId = await program.methods
      .cancelSellOrder(new anchor.BN(data.seed), new anchor.BN(orderId))
      .accounts({ maker })
      .transaction();

    tx.add(txId);

    return tx;
  }
};

export const takeOrderTx = async (
  taker: PublicKey,
  maker: PublicKey,
  market: PublicKey,
  side: Side,
  orderId: number,
  program: anchor.Program<HybridDex>
) => {
  const { data } = await getMarketState(market, program);

  if (side === Side.Bid) {
    const tx = new Transaction();

    const txId = await program.methods
      .takeBuyOrder(new anchor.BN(data.seed), new anchor.BN(orderId))
      .accounts({
        taker,
        maker,
      })
      .transaction();

    tx.add(txId);

    return tx;
  } else {
    const tx = new Transaction();

    const txId = await program.methods
      .takeSellOrder(new anchor.BN(data.seed), new anchor.BN(orderId))
      .accounts({
        taker,
        maker,
      })
      .transaction();

    tx.add(txId);

    return tx;
  }
};

export const partialTakeOrderTx = async (
  taker: PublicKey,
  maker: PublicKey,
  market: PublicKey,
  side: Side,
  orderId: number,
  amount: number,
  program: anchor.Program<HybridDex>
) => {
  const { data } = await getMarketState(market, program);

  if (side === Side.Bid) {
    const tx = new Transaction();

    const txId = await program.methods
      .partialTakeBuyOrder(
        new anchor.BN(data.seed),
        new anchor.BN(orderId),
        new anchor.BN(amount)
      )
      .accounts({
        taker,
        maker,
      })
      .transaction();

    tx.add(txId);

    return tx;
  } else {
    const tx = new Transaction();

    const txId = await program.methods
      .partialTakeSellOrder(
        new anchor.BN(data.seed),
        new anchor.BN(orderId),
        new anchor.BN(amount)
      )
      .accounts({
        taker,
        maker,
      })
      .transaction();

    tx.add(txId);

    return tx;
  }
};

/**
 * Fetch global pool PDA data
 */
export const getGlobalState = async (program: anchor.Program<HybridDex>) => {
  const [globalPool] = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    program.programId
  );

  try {
    let globalPoolData = await program.account.globalPool.fetch(globalPool);

    return {
      key: globalPool,
      data: globalPoolData,
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * Fetch market PDA data
 */
export const getMarketState = async (
  market: PublicKey,
  program: anchor.Program<HybridDex>
) => {
  try {
    let marketData = await program.account.market.fetch(market);

    return {
      key: market,
      data: marketData,
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const findAllMarkets = async (
  { base, quote }: { base?: PublicKey; quote?: PublicKey },
  program: anchor.Program<HybridDex>
) => {
  let filters: anchor.web3.GetProgramAccountsFilter[] = [
    {
      dataSize: MARKET_SIZE,
    },
  ];

  if (base) {
    filters.push({
      memcmp: { offset: 64, bytes: base.toBase58() },
    });
  }

  if (quote) {
    filters.push({
      memcmp: { offset: 96, bytes: quote.toBase58() },
    });
  }

  const marketAccs = await program.provider.connection.getProgramAccounts(
    program.programId,
    { filters, encoding: 'base64' }
  );

  return marketAccs.map((marketAcc) => {
    let data: any = program.coder.accounts.decode<Market>(
      'market',
      marketAcc.account.data
    );
    data.seed = data.seed.toNumber();
    data.name = Buffer.from(data.name)
      .filter((buf) => buf !== 0x0)
      .toString();
    data.marketAuthority = data.marketAuthority.toBase58();
    data.baseMint = data.baseMint.toBase58();
    data.quoteMint = data.quoteMint.toBase58();
    data.baseDecimal = data.baseDecimal;
    data.quoteDecimal = data.quoteDecimal;
    data.bids = data.bids.toBase58();
    data.asks = data.asks.toBase58();
    data.createdAt = data.createdAt.toNumber();
    data.baseTotalVolume = data.baseTotalVolume.toNumber();
    data.quoteTotalVolume = data.quoteTotalVolume.toNumber();
    data.orderSeqNum = data.orderSeqNum.toNumber();
    return {
      key: marketAcc.pubkey.toBase58(),
      data,
    };
  });
};

/**
 * Fetch user market orders PDA data
 */
export const getUserMarketOrdersState = async (
  market: PublicKey,
  user: PublicKey,
  program: anchor.Program<HybridDex>
) => {
  const [userOrders] = PublicKey.findProgramAddressSync(
    [Buffer.from(USER_MARKET_ORDER_SEED), market.toBuffer(), user.toBuffer()],
    program.programId
  );
  try {
    let userOrdersData = await program.account.userMarketOrders.fetch(
      userOrders
    );

    return {
      key: market,
      data: userOrdersData,
    };
  } catch (e) {
    console.error(e);

    return {
      key: market,
      data: null,
    };
  }
};

/**
 * Fetch market order book PDA data
 */
export const getMarketBookState = async (
  market: PublicKey,
  program: anchor.Program<HybridDex>
) => {
  try {
    const [bidsBook] = PublicKey.findProgramAddressSync(
      [Buffer.from(BID_BOOK_SEED), market.toBuffer()],
      program.programId
    );
    console.log('bids book: ', bidsBook.toBase58());

    const [asksBook] = PublicKey.findProgramAddressSync(
      [Buffer.from(ASK_BOOK_SEED), market.toBuffer()],
      program.programId
    );
    console.log('asks book: ', asksBook.toBase58());

    let bidsBookData = await program.account.book.fetch(bidsBook);
    let asksBookData = await program.account.book.fetch(asksBook);

    return {
      key: market,
      bids: bidsBookData,
      asks: asksBookData,
    };
  } catch (e) {
    console.error(e);

    return {
      key: market,
      bids: null,
      asks: null,
    };
  }
};
