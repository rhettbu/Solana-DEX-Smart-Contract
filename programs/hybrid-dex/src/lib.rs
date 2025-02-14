pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod utils;

use anchor_lang::prelude::*;

pub use constants::*;
pub use error::*;
pub use instructions::*;
pub use state::*;
pub use utils::*;

declare_id!("G12WABos41DU4ic2RLea5qwCfSyvB83XdKz9CMdiJLUW");

#[program]
pub mod hybrid_dex {
    use super::*;

    /**
     * Initialize global pool
     * admin initialize global configs
     */
    pub fn initialize(
        mut ctx: Context<Initialize>,
        max_orders_per_user: u64,
        max_orders_per_book: u64,
    ) -> Result<()> {
        Initialize::process_instruction(&mut ctx, max_orders_per_user, max_orders_per_book)
    }

    /** Admin can transfer admin authority */
    pub fn transfer_admin(mut ctx: Context<TransferAdmin>, new_admin: Pubkey) -> Result<()> {
        TransferAdmin::process_instruction(&mut ctx, new_admin)
    }

    /** Admin can change global config */
    pub fn change_config(
        mut ctx: Context<ChangeConfig>,
        max_orders_per_user: Option<u64>,
        max_orders_per_book: Option<u64>,
    ) -> Result<()> {
        ChangeConfig::process_instruction(&mut ctx, max_orders_per_user, max_orders_per_book)
    }

    /** Create market */
    pub fn create_market(mut ctx: Context<CreateMarket>, name: String) -> Result<()> {
        CreateMarket::process_instruction(&mut ctx, name)
    }

    /** Close market with market owner authority or global admin authority */
    pub fn close_market(mut ctx: Context<CloseMarket>, seed: u64) -> Result<()> {
        CloseMarket::process_instruction(&mut ctx, seed)
    }

    /** Create open orders PDA for user in certain market */
    pub fn create_open_orders(mut ctx: Context<CreateOpenOrders>) -> Result<()> {
        CreateOpenOrders::process_instruction(&mut ctx)
    }

    /** Place buy order as maker */
    pub fn place_buy_order(
        mut ctx: Context<PlaceBuyOrder>,
        price: u64,
        quantity: u64,
    ) -> Result<()> {
        PlaceBuyOrder::process_instruction(&mut ctx, price, quantity)
    }

    /** Place sell order as maker */
    pub fn place_sell_order(
        mut ctx: Context<PlaceSellOrder>,
        price: u64,
        quantity: u64,
    ) -> Result<()> {
        PlaceSellOrder::process_instruction(&mut ctx, price, quantity)
    }

    /** Cancel buy order as owner */
    pub fn cancel_buy_order(
        mut ctx: Context<CancelBuyOrder>,
        seed: u64,
        order_id: u64,
    ) -> Result<()> {
        CancelBuyOrder::process_instruction(&mut ctx, seed, order_id)
    }

    /** Cancel sell order as owner */
    pub fn cancel_sell_order(
        mut ctx: Context<CancelSellOrder>,
        seed: u64,
        order_id: u64,
    ) -> Result<()> {
        CancelSellOrder::process_instruction(&mut ctx, seed, order_id)
    }

    /** Take buy order as taker */
    pub fn take_buy_order(mut ctx: Context<TakeBuyOrder>, seed: u64, order_id: u64) -> Result<()> {
        TakeBuyOrder::process_instruction(&mut ctx, seed, order_id)
    }

    /** Take sell order as taker */
    pub fn take_sell_order(
        mut ctx: Context<TakeSellOrder>,
        seed: u64,
        order_id: u64,
    ) -> Result<()> {
        TakeSellOrder::process_instruction(&mut ctx, seed, order_id)
    }
}
