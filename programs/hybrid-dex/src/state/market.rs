use anchor_lang::prelude::*;

use crate::HybridDexError;

#[account]
pub struct Market {
    pub seed: u64,
    pub name: [u8; 16],
    pub market_authority: Pubkey,
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub base_decimal: u8,
    pub quote_decimal: u8,
    pub bids: Pubkey,
    pub asks: Pubkey,
    pub created_at: i64,
    pub base_total_volume: u64,
    pub quote_total_volume: u64,
    pub order_seq_num: u64,
    pub extra: u128,
}

impl Default for Market {
    #[inline]
    fn default() -> Market {
        Market {
            seed: 0,
            name: [0; 16],
            market_authority: Pubkey::default(),
            base_mint: Pubkey::default(),
            quote_mint: Pubkey::default(),
            base_decimal: 0,
            quote_decimal: 0,
            bids: Pubkey::default(),
            asks: Pubkey::default(),
            created_at: 0,
            base_total_volume: 0,
            quote_total_volume: 0,
            order_seq_num: 0,
            extra: 0,
        }
    }
}

impl Market {
    pub const DATA_SIZE: usize = 8 + std::mem::size_of::<Market>();

    pub fn name(&self) -> &str {
        std::str::from_utf8(&self.name)
            .unwrap()
            .trim_matches(char::from(0))
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Eq, PartialEq)]
pub enum Side {
    Bid = 0,
    Ask = 1,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Eq, PartialEq)]
pub struct OpenedOrder {
    pub order_id: u64,
    pub owner: Pubkey,
    pub price: u64, // use same decimal with quote token
    pub quantity: u64,
    pub created_at: i64,
}

#[account]
pub struct Book {
    pub side: Side,
    pub market: Pubkey,
    pub orders_count: u64,
    pub orders: Vec<OpenedOrder>,
}

impl Book {
    pub const DATA_SIZE: usize = 8 + std::mem::size_of::<Book>();

    pub fn size(count: u64) -> usize {
        Book::DATA_SIZE + std::mem::size_of::<OpenedOrder>() * count as usize
    }

    pub fn insert_order(&mut self, new_order: OpenedOrder) {
        let idx: usize = 0;
        for idx in 0..self.orders_count as usize {
            if idx != self.orders_count as usize && self.side == Side::Bid {
                if self.orders[idx].price > new_order.price {
                    break;
                }
            } else if idx != self.orders_count as usize && self.side == Side::Ask {
                if self.orders[idx].price < new_order.price {
                    break;
                }
            }
        }
        if idx == self.orders_count as usize {
            if self.orders.len() == self.orders_count as usize {
                self.orders.push(new_order);
            } else {
                self.orders[idx] = new_order;
            }
        } else {
            self.orders.insert(idx, new_order);
        }
    }

    pub fn remove_order(&mut self, order_id: u64) -> Result<OpenedOrder> {
        if self.orders_count == 0 {
            return Err(HybridDexError::OrderNotFound.into());
        } else {
            let idx: usize = 0;
            for idx in 0..self.orders_count as usize {
                if idx != self.orders_count as usize && self.orders[idx].order_id == order_id {
                    break;
                } else if idx != self.orders_count as usize && self.orders[idx].order_id == order_id
                {
                    break;
                }
            }
            if idx == self.orders_count as usize - 1 {
                return Ok(self.orders[idx].to_owned());
            } else if idx == self.orders_count as usize {
                return Err(HybridDexError::OrderNotFound.into());
            } else {
                let order = self.orders.remove(idx);
                Ok(order)
            }
        }
    }
}
