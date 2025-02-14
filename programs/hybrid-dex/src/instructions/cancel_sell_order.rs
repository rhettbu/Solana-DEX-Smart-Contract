use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::*;

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct CancelSellOrder<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(
        has_one = base_mint,
        has_one = quote_mint,
        seeds = [MARKET_SEED.as_bytes(), seed.to_le_bytes().as_ref()],
        bump,
    )]
    pub market: Box<Account<'info, Market>>,

    #[account(
        mut,
        has_one = market,
        seeds = [USER_MARKET_ORDER_SEED.as_bytes(), market.key().as_ref(), maker.key().as_ref()],
        bump,
        constraint = user_open_orders.address.eq(&maker.key()) @ HybridDexError::InvalidAccountOwner,
    )]
    pub user_open_orders: Box<Account<'info, UserMarketOrders>>,

    pub base_mint: Box<Account<'info, Mint>>,

    pub quote_mint: Box<Account<'info, Mint>>,

    #[account(
        init_if_needed,
        associated_token::mint = base_mint,
        associated_token::authority = maker,
        payer = maker,
    )]
    pub user_base_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = base_mint,
        associated_token::authority = market,
    )]
    pub base_vault_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [ASK_BOOK_SEED.as_bytes(), market.key().as_ref()],
        bump,
    )]
    pub asks_book: Box<Account<'info, Book>>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl CancelSellOrder<'_> {
    pub fn process_instruction(ctx: &mut Context<Self>, seed: u64, order_id: u64) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let user_open_orders = &mut ctx.accounts.user_open_orders;

        let asks_book = &mut ctx.accounts.asks_book;
        let order = asks_book.remove_order(order_id)?;

        // check base token vault balance
        require!(
            ctx.accounts.base_vault_account.amount >= order.quantity,
            HybridDexError::InsufficientWithdrawBalance
        );

        asks_book.orders_count -= 1;
        user_open_orders.opened_orders_count -= 1;
        user_open_orders.base_deposit_total -= order.quantity;

        let seed_bytes = seed.to_le_bytes();
        let seeds = &[MARKET_SEED.as_bytes(), &seed_bytes, &[ctx.bumps.market]];
        let signers_seeds = &[&seeds[..]];

        // transfer base token from vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.base_vault_account.to_account_info(),
            to: ctx.accounts.user_base_token_account.to_account_info(),
            authority: market.to_account_info(),
        };

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signers_seeds,
            ),
            order.quantity,
        )?;

        Ok(())
    }
}
