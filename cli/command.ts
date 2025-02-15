import { program } from 'commander';
import { PublicKey } from '@solana/web3.js';
import {
  changeAdmin,
  getGlobalInfo,
  initProject,
  setClusterConfig,
  changeConfig,
  createMarket,
  closeMarket,
  createOpenOrders,
  placeOrder,
  cancelOrder,
  takeOrder,
  getMarketInfo,
  getUserOrdersInfo,
  getOrderBooksInfo,
  getAllMarkets,
  partialTakeOrder,
} from './scripts';
import { sideFromStr } from '../lib/types';

// program.version('0.0.1');

programCommand('status')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const { env, keypair, rpc } = cmd.opts();

    console.log('Solana Cluster:', env);
    console.log('Keypair Path:', keypair);
    console.log('RPC URL:', rpc);
    await setClusterConfig(env, keypair, rpc);

    console.log(await getGlobalInfo());
  });

programCommand('init')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .requiredOption('-opu, --order_per_user <number>')
  .requiredOption('-opb, --order_per_book <number>')
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, order_per_book, order_per_user } = cmd.opts();

    console.log('Solana Cluster:', env);
    console.log('Keypair Path:', keypair);
    console.log('RPC URL:', rpc);

    await setClusterConfig(env, keypair, rpc);

    await initProject(Number(order_per_user), Number(order_per_book));
  });

programCommand('change-admin')
  .requiredOption('-a, --new_admin <string>', 'new admin address')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, new_admin } = cmd.opts();

    console.log('Solana Cluster:', env);
    console.log('Keypair Path:', keypair);
    console.log('RPC URL:', rpc);
    await setClusterConfig(env, keypair, rpc);

    //  update global info
    await changeAdmin(new_admin);
  });

programCommand('change-config')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .option('-opu, --order_per_user <number>')
  .option('-opb, --order_per_book <number>')
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, order_per_book, order_per_user } = cmd.opts();

    console.log('Solana Cluster:', env);
    console.log('Keypair Path:', keypair);
    console.log('RPC URL:', rpc);

    await setClusterConfig(env, keypair, rpc);

    await changeConfig(
      order_per_user ? Number(order_per_user) : undefined,
      order_per_book ? Number(order_per_book) : undefined
    );
  });

programCommand('create-market')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .requiredOption('-b --base_mint <string>')
  .requiredOption('-q --quote_mint <string>')
  .requiredOption('-n --name <string>')
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, base_mint, quote_mint, name } = cmd.opts();

    console.log('Solana Cluster:', env);
    console.log('Keypair Path:', keypair);
    console.log('RPC URL:', rpc);
    await setClusterConfig(env, keypair, rpc);

    await createMarket(
      new PublicKey(base_mint),
      new PublicKey(quote_mint),
      name
    );
  });

programCommand('close-market')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .requiredOption('-m, --market <string>')
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, market } = cmd.opts();

    console.log('Solana Cluster:', env);
    console.log('Keypair Path:', keypair);
    console.log('RPC URL:', rpc);

    await setClusterConfig(env, keypair, rpc);

    await closeMarket(new PublicKey(market));
  });

programCommand('create-user-orders')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .requiredOption('-m, --market <string>')
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, market } = cmd.opts();

    console.log('Solana Cluster:', env);
    console.log('Keypair Path:', keypair);
    console.log('RPC URL:', rpc);

    await setClusterConfig(env, keypair, rpc);

    await createOpenOrders(new PublicKey(market));
  });

programCommand('place-order')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .requiredOption('-m, --market <string>')
  .requiredOption('-s, --side <string>') // bid or ask
  .requiredOption('-p, --price <number>')
  .requiredOption('-q, --quantity <number>')
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, market, side, price, quantity } = cmd.opts();

    console.log('Solana Cluster:', env);
    console.log('Keypair Path:', keypair);
    console.log('RPC URL:', rpc);

    await setClusterConfig(env, keypair, rpc);

    await placeOrder(
      new PublicKey(market),
      sideFromStr(side),
      Number(price),
      Number(quantity)
    );
  });

programCommand('cancel-order')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .requiredOption('-m, --market <string>')
  .requiredOption('-s, --side <string>')
  .requiredOption('-o, --order_id <number>')
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, market, side, order_id } = cmd.opts();

    console.log('Solana Cluster:', env);
    console.log('Keypair Path:', keypair);
    console.log('RPC URL:', rpc);

    await setClusterConfig(env, keypair, rpc);

    await cancelOrder(
      new PublicKey(market),
      sideFromStr(side),
      Number(order_id)
    );
  });

programCommand('take-order')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .requiredOption('-m, --market <string>')
  .requiredOption('-a, --maker <string>')
  .requiredOption('-s, --side <string>')
  .requiredOption('-o, --order_id <number>')
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, market, maker, side, order_id } = cmd.opts();

    console.log('Solana Cluster:', env);
    console.log('Keypair Path:', keypair);
    console.log('RPC URL:', rpc);

    await setClusterConfig(env, keypair, rpc);

    await takeOrder(
      new PublicKey(market),
      new PublicKey(maker),
      sideFromStr(side),
      Number(order_id)
    );
  });

programCommand('partial-take-order')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .requiredOption('-m, --market <string>')
  .requiredOption('-a, --maker <string>')
  .requiredOption('-s, --side <string>')
  .requiredOption('-o, --order_id <number>')
  .requiredOption('-q, --quantity <number>')
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, market, maker, side, order_id, quantity } =
      cmd.opts();

    console.log('Solana Cluster:', env);
    console.log('Keypair Path:', keypair);
    console.log('RPC URL:', rpc);

    await setClusterConfig(env, keypair, rpc);

    await partialTakeOrder(
      new PublicKey(market),
      new PublicKey(maker),
      sideFromStr(side),
      Number(order_id),
      Number(quantity)
    );
  });

programCommand('market')
  .requiredOption('-m, --market <string>')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, market } = cmd.opts();

    console.log('Solana Cluster:', env);
    console.log('Keypair Path:', keypair);
    console.log('RPC URL:', rpc);

    await setClusterConfig(env, keypair, rpc);

    console.log(await getMarketInfo(new PublicKey(market)));
  });

programCommand('all-markets')
  .option('-b, --base <string>')
  .option('-q, --quote <string>')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, base, quote } = cmd.opts();

    console.log('Solana Cluster:', env);
    console.log('Keypair Path:', keypair);
    console.log('RPC URL:', rpc);

    await setClusterConfig(env, keypair, rpc);

    console.log(
      await getAllMarkets({
        base: base ? new PublicKey(base) : undefined,
        quote: quote ? new PublicKey(quote) : undefined,
      })
    );
  });

programCommand('user-orders')
  .requiredOption('-m, --market <string>')
  .requiredOption('-a, --user_address <string>')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, market, user_address } = cmd.opts();

    console.log('Solana Cluster:', env);
    console.log('Keypair Path:', keypair);
    console.log('RPC URL:', rpc);

    await setClusterConfig(env, keypair, rpc);

    console.log(
      await getUserOrdersInfo(
        new PublicKey(market),
        new PublicKey(user_address)
      )
    );
  });

programCommand('order-book')
  .requiredOption('-m, --market <string>')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, market } = cmd.opts();

    console.log('Solana Cluster:', env);
    console.log('Keypair Path:', keypair);
    console.log('RPC URL:', rpc);

    await setClusterConfig(env, keypair, rpc);

    console.dir(await getOrderBooksInfo(new PublicKey(market)), {
      depth: null,
    });
  });

function programCommand(name: string) {
  return (
    program
      .command(name)
      .option('-e, --env <string>', 'Solana cluster env name', 'devnet') //mainnet-beta, testnet, devnet
      .option(
        '-r, --rpc <string>',
        'Solana cluster RPC name'
        // 'https://devnet.helius-rpc.com/?api-key=44b7171f-7de7-4e68-9d08-eff1ef7529bd'
        // 'https://flashy-cosmological-pallet.solana-mainnet.quiknode.pro/86e2f4bc350a6fb8dbcb110df4d030a205455f70/'
      )
      // .option('-r, --rpc <string>', 'Solana cluster RPC name', 'https://mainnet.helius-rpc.com/?api-key=99c6d984-537e-4569-955b-5e4703b73c0d')
      .option(
        '-k, --keypair <string>',
        'Solana wallet Keypair Path',
        '../deploy.json'
      )
  );
}

program.parse(process.argv);

/*

yarn script init
yarn script change-admin -n J9ja5QkewwMi9kG6JkCNxfLK9CoDGk3F4hZTNKQaKZe3
yarn script lock -m BV3bvkBqVawTghH4uCaba3MGgYs63XyxwX9CeULwvmKG

https://solana-mainnet.g.alchemy.com/v2/wsOJ8IVuGPfyljRfcZjpLrsVQu0_of-j

yarn script unlock -m AXXfo3sggcMLNvz3zRS2wJz8xy78DFbxmgcsUYkM5TzQ -k ../key/G2.json

yarn script user-status -a G2sc5mU3eLRkbRupnupzB3NTzZ85bnc9L1ReAre9dzFU
yarn script user-status -a 4EjZ4sGnvfLbW89AAzSehob7Rmkym7vCH3SMcThSx9q1

yarn script get-users
yarn script status

*/
