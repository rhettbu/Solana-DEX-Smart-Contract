use anchor_lang::prelude::*;

#[error_code]
pub enum HybridDexError {
    #[msg("Admin address dismatch")]
    InvalidAdmin,
    #[msg("Name lenght above limit")]
    InvalidInputNameLength,
    #[msg("The signer of this transaction is not this market's authority or admin.")]
    InvalidCloseMarketAdmin,
    #[msg("Cannot close a non-empty market")]
    NonEmptyMarket,
    #[msg("Account owner does not match with passed address")]
    InvalidAccountOwner,
    #[msg("No free order index in user open orders account")]
    OpenOrdersFull,
    #[msg("Deposit token account balance insufficient")]
    InsufficientDepositBalance,
    #[msg("Market token vault balance insufficient")]
    InsufficientWithdrawBalance,
    #[msg("Not found order id from market order book")]
    OrderNotFound,
    #[msg("Order maker address not matched with passed maker")]
    IncorrectMakerAddress,
    #[msg("Partial take order amount exceed order quantity")]
    PartialOrderAmountExceed,
}
