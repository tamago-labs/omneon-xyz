

// Decentralized Lending Protocol built on IOTA Move  
// Features dynamic interest rates based on pool utilization 
// Suppliers earn yield via interest-bearing tokens that represent their share of the pool.
// For simplicity, this MVP supports only one borrowable asset and one collateral asset per pool.

module omneon::lending {

    use iota::coin::{Self, Coin};
    use iota::iota::IOTA; 
    use iota::tx_context::{Self};
    use iota::object::{Self, ID, UID};
    use iota::transfer::{Self};
    use iota::bag::{Self, Bag};
    use iota::balance::{Self, Supply, Balance};
    use iota::event::emit;
    use iota::table::{Self, Table};
    use iota::clock::{Clock, Self};
    
    use pyth::price_info;
    use pyth::price_identifier;
    use pyth::price;
    use pyth::pyth;
    use pyth::price_info::PriceInfoObject;
    use pyth::i64::{Self};

    use std::string::{Self, String}; 
    use std::type_name::{get, into_string};
    use std::ascii::into_bytes; 
    use std::option::{Self, Option};

    // ======== Constants ========

    // Minimal liquidity.
    const MINIMAL_LIQUIDITY: u64 = 1000; 

    // ======== Errors ========

    const ERR_POOL_HAS_REGISTERED: u64 = 1;
    const ERR_INVALID_LTV: u64 = 2;
    const ERR_INVALID_THRESHOLD: u64  = 3;
    const ERR_RESERVE_FACTOR: u64 = 4;
    const ERR_INVALID_RATES: u64 = 5;
    const ERR_POOL_NOT_REGISTER: u64 = 6;
    const ERR_ZERO_AMOUNT: u64 = 7;
    const ERR_PAUSED: u64 = 8;
    const ERR_CAP_REACHED: u64 = 9;
    const ERR_INSUFFICIENT_SHARE_MINTED: u64 = 10;
    const ERR_SUPPLY_NOT_ENOUGH: u64 = 11;
    const ERR_INSUFFICIENT_LIQUIDITY: u64 = 12;
    const ERR_EXCEED_LTV: u64 = 13;
    const ERR_NO_ACTIVE_DEBT: u64 = 14;
    const ERR_EXCEED_DEBT: u64 = 15;
    const ERR_INSUFFICIENT_AMOUNT: u64 = 16;
    const ERR_STILL_ACTIVE_DEBT: u64 = 17;
    const ERR_INVALID_BORROWER: u64 = 18; 
    const ERR_NOT_LIQUIDABLE: u64 = 19;
    const ERR_EXCEED_LIQUIDATION_AMOUNT: u64 = 20;
    const ERR_REMOVE_WILL_LIQUIDATE: u64 = 21;
    const ERR_INVALID_PRICE_ID: u64 = 22;

    // ======== Structs =========

    // Represents the pool share token issued to users 
    public struct SHARE<phantom X, phantom Y> has drop, store {}

    // Represents a lending pool containing a lending asset and its corresponding collateral
    // - `coin_x`: The asset being lent (e.g., vUSD, USDC)
    // - `coin_y`: The collateral backing the loan (e.g., IOTA)
    public struct POOL<phantom X, phantom Y> has store {
        global: ID,
        coin_x: Balance<X>, // Lending asset
        coin_y: Balance<Y>, // Collateral asset
        ltv: u64, // Maximum loan-to-value (e.g., 75% = 7500)
        liquidation_threshold: u64, // Threshold at which liquidation can occur (e.g., 80% = 8000)
        liquidation_bonus: u64, // Bonus for liquidators (e.g., 5% = 500)
        reserve_factor: u64, // Percentage of interest set aside as reserves
        share_supply: Supply<SHARE<X, Y>>,
        min_liquidity: Balance<SHARE<X, Y>>, 
        has_paused: bool,
        // Interest rate model parameters
        base_rate: u64, // Base interest rate when utilization is 0% (e.g., 1% = 100)
        slope1: u64, // Rate of increase before optimal utilization (e.g., 4% = 400)
        slope2: u64, // Rate of increase after optimal utilization (e.g., 60% = 6000)
        optimal_utilization: u64, // The target utilization rate (e.g., 80% = 8000)
        // Tracking variables for interest accrual
        last_update_timestamp: u64, // Last time interest was accrued
        current_borrow_rate: u64, // Current borrowing interest rate
        current_supply_rate: u64, // Current supply interest rate
        total_borrows: u64, // Total amount borrowed
        total_collateral: u64,
        total_supply: u64,
        debt_positions: Table<address, DebtPosition>, // All debt positions
        current_price: u64,
        last_update_price_timestamp: u64,
        is_invert: bool,
        // TODO: Optional caps
        borrow_cap: Option<u64>, // Maximum amount that can be borrowed
        supply_cap: Option<u64> // Maximum amount that can be supplied 
    }

    // Represents a user's active debt position on each pool
    public struct DebtPosition has store {
        debt_amount: u64, // Amount of borrowed asset
        collateral_amount: u64, // Amount of collateral locked
        borrow_timestamp: u64, // Timestamp when the debt was initiated
        borrow_rate_snapshot: u64, // Borrow rate at the time of borrowing
        ltv_snapshot: u64, // Loan-to-Value ratio at the time of borrowing
        liquidation_threshold_snapshot: u64, // Liquidation threshold captured at borrowing
        holder: address // Address of the borrower
    }

    // The global state
    public struct LendingGlobal has key {
        id:UID,
        pools: Bag  // Collection of all lending pools in the system
    }

    // For admin permission
    public struct AdminCap has key {
        id: UID
    }

    public struct RegisterPoolEvent has copy, drop {
        global: ID,
        pool_name: String
    }

    public struct InterestAccrualEvent has copy, drop {
        pool_name: String,
        interest_accrued: u64,
        reserve_amount: u64,
        new_borrow_rate: u64,
        new_supply_rate: u64
    }

    public struct SupplyEvent has copy, drop {
        pool_name: String,
        supply_amount: u64,
        shares: u64,
        sender: address
    }

    public struct WithdrawEvent has copy, drop {
        pool_name: String,
        shares: u64,
        withdraw_amount: u64,
        sender: address
    }

    public struct BorrowEvent has copy, drop {
        pool_name: String,
        collateral_amount: u64,
        borrow_amount: u64,
        is_more: bool,
        sender: address
    }

    public struct LiquidationEvent has copy, drop {
        pool_name: String,
        borrower: address,
        repay_amount: u64,
        seized_collateral: u64,
        remaining_debt: u64,
        liquidation_bonus: u64, 
        sender: address
    }

    public struct RepayEvent has copy, drop {
        pool_name: String,
        repay_amount: u64,
        interest_paid: u64,
        principal_paid: u64,
        remaining_debt: u64,
        sender: address
    }

    public struct CollateralAddedEvent has copy, drop {
        pool_name: String,
        additional_collateral: u64,
        new_total_collateral: u64,
        debt_amount: u64, 
        sender: address
    }

    public struct CollateralRemovedEvent has copy, drop {
        pool_name: String,
        removed_amount: u64,
        remaining_collateral: u64,
        debt_amount: u64,
        sender: address
    }

    // Initializes the global state
    fun init(ctx: &mut TxContext) {
        
        transfer::transfer(
            AdminCap {id: object::new(ctx)},
            tx_context::sender(ctx)
        );

        let global = LendingGlobal {
            id: object::new(ctx),
            pools: bag::new(ctx)
        };

        transfer::share_object(global)
    }

    // ======== Entry Points =========

    // User borrow assets
    public entry fun borrow<X,Y>(global: &mut LendingGlobal, coin_y: Coin<Y>, borrow_amount: u64, ctx: &mut TxContext) {
        assert!(has_registered<X, Y>(global), ERR_POOL_NOT_REGISTER);
        assert!(!is_paused<X,Y>(global), ERR_PAUSED);

        let collateral_amount = coin::value(&coin_y);
        let pool = get_mut_pool<X, Y>(global);

        let coin_x = borrow_non_entry<X,Y>(pool, coin_y, borrow_amount, ctx);

        transfer::public_transfer(coin_x, tx_context::sender(ctx));

        // Emit borrow event
        emit(BorrowEvent {
            pool_name: generate_pool_name<X, Y>(),  
            collateral_amount,
            borrow_amount, 
            is_more: false,
            sender: tx_context::sender(ctx)
        });
    }

    // Borrow more against existing collateral 
    public entry fun borrow_more<X,Y>(global: &mut LendingGlobal, additional_borrow_amount: u64, ctx: &mut TxContext) {
        assert!(has_registered<X, Y>(global), ERR_POOL_NOT_REGISTER);
        assert!(!is_paused<X,Y>(global), ERR_PAUSED);

        let pool = get_mut_pool<X, Y>(global);

        let coin_x = borrow_more_non_entry<X,Y>(pool, additional_borrow_amount, ctx);

        transfer::public_transfer(coin_x, tx_context::sender(ctx));

        // Emit borrow event
        emit(BorrowEvent {
            pool_name: generate_pool_name<X, Y>(),  
            collateral_amount: 0,
            borrow_amount: additional_borrow_amount,
            is_more: true,
            sender: tx_context::sender(ctx)
        });

    }

    // User repay borrowed assets
    public entry fun repay<X,Y>(
        global: &mut LendingGlobal, 
        repay_coin: Coin<X>, 
        repay_all: bool,
        ctx: &mut TxContext
    ) {
        assert!(has_registered<X, Y>(global), ERR_POOL_NOT_REGISTER);
        assert!(!is_paused<X,Y>(global), ERR_PAUSED);
 
        let pool = get_mut_pool<X, Y>(global); 
        let mut repay_amount = coin::value(&repay_coin);

        // Update interest accrual first
        accrue_interest(pool, ctx);

        // Get current debt position WITH ACCRUED INTEREST
        let (principal, interest, collateral_amount) = get_debt_with_interest<X, Y>(pool, tx_context::sender(ctx), ctx);
        let total_debt = principal + interest;
        assert!( total_debt > 0, ERR_NO_ACTIVE_DEBT );

        let mut repay_balance = coin::into_balance(repay_coin);

        // If repaying all, adjust amount to not exceed debt
        if (repay_all) {
            if (repay_amount >= total_debt) {
                // Return excess coins to user 
                if (repay_amount > total_debt) {
                    transfer::public_transfer(
                        coin::from_balance(balance::split(&mut repay_balance, repay_amount - total_debt) , ctx),
                        tx_context::sender(ctx)
                    );
                };
                repay_amount = total_debt;
            } else {
                // If repay_all is true but amount is insufficient
                assert!(false, ERR_INSUFFICIENT_AMOUNT);
            };
        } else {
            // Make sure not repaying more than debt
            assert!(repay_amount <= total_debt, ERR_EXCEED_DEBT);
        };

        // Add repayment to pool
        balance::join(&mut pool.coin_x, repay_balance);
        
        // Update total borrows 
        pool.total_borrows = if (pool.total_borrows > repay_amount) {
            pool.total_borrows - repay_amount
        } else {
            0
        };

        // Determine how much goes to interest vs principal
        let interest_payment = if (repay_amount >= interest) { 
            interest 
        } else { 
            repay_amount 
        };
        let principal_payment = repay_amount - interest_payment;
        
        // Update debt position
        if (repay_amount == total_debt) {
            // Full repayment - return collateral
            let collateral_coin = coin::take(&mut pool.coin_y, collateral_amount, ctx);
            transfer::public_transfer(collateral_coin, tx_context::sender(ctx));
            // Close debt position
            close_debt_position<X, Y>(pool, tx_context::sender(ctx));
        
            pool.total_collateral = if (pool.total_collateral > collateral_amount) {
                pool.total_collateral - collateral_amount
            } else {
                0
            };

            // Emit event
            emit(RepayEvent {
                pool_name: generate_pool_name<X, Y>(), 
                repay_amount,
                interest_paid: interest_payment,
                principal_paid: principal_payment,
                remaining_debt: 0,
                sender: tx_context::sender(ctx)
            });
        } else {
            // Partial repayment - update debt
            update_debt_position<X, Y>(pool, tx_context::sender(ctx), principal - principal_payment, collateral_amount, ctx);
        
            // Emit event
            emit(RepayEvent {
                pool_name: generate_pool_name<X, Y>(), 
                repay_amount,
                interest_paid: interest_payment,
                principal_paid: principal_payment,
                remaining_debt: 0,
                sender: tx_context::sender(ctx)
            });
        }

    }

    // Entrypoint for the supply function that returns SHARE<X,Y> back to the sender.
    public entry fun supply<X,Y>(global: &mut LendingGlobal, coin_x: Coin<X>, ctx: &mut TxContext) {
        assert!(has_registered<X, Y>(global), ERR_POOL_NOT_REGISTER);
        assert!(!is_paused<X,Y>(global), ERR_PAUSED);

        let supply_amount = coin::value(&coin_x);
        let pool = get_mut_pool<X, Y>(global);

        let shares = supply_non_entry<X,Y>(
            pool,
            coin_x,
            ctx
        );
        let shares_amount = coin::value(&shares);

        transfer::public_transfer(shares, tx_context::sender(ctx));

        // Emit supply event
        emit(SupplyEvent {
            pool_name: generate_pool_name<X, Y>(), 
            supply_amount,
            shares: shares_amount,
            sender: tx_context::sender(ctx)
        });
    }

    // User withdraw assets
    public entry fun withdraw<X,Y>(global: &mut LendingGlobal, share_coin: Coin<SHARE<X,Y>>, ctx: &mut TxContext ) {
        assert!(has_registered<X, Y>(global), ERR_POOL_NOT_REGISTER);
        assert!(!is_paused<X,Y>(global), ERR_PAUSED);

        let share_amount = coin::value(&share_coin);
        let pool = get_mut_pool<X, Y>(global);

        let withdraw_coin = withdraw_non_entry<X,Y>(
            pool,
            share_coin,
            ctx
        );
        let withdraw_amount = coin::value(&(withdraw_coin));

        transfer::public_transfer(withdraw_coin, tx_context::sender(ctx));

        // Emit supply event
        emit(WithdrawEvent {
            pool_name: generate_pool_name<X, Y>(), 
            shares: share_amount,
            withdraw_amount,
            sender: tx_context::sender(ctx)
        });        
    }

    // Liquidate undercollateralized positions
    public entry fun liquidate<X,Y>(
        global: &mut LendingGlobal,
        borrower: address,
        repay_coin: Coin<X>,
        receive_underlying: bool, // whether receives collateral or shares
        ctx: &mut TxContext
    ) {
        assert!(has_registered<X, Y>(global), ERR_POOL_NOT_REGISTER);
        assert!(!is_paused<X,Y>(global), ERR_PAUSED);

        let pool = get_mut_pool<X, Y>(global);

        // Update interest accrual first
        accrue_interest(pool, ctx);

        let liquidator = tx_context::sender(ctx);
        assert!(liquidator != borrower, ERR_INVALID_BORROWER );

        let (principal, interest, collateral_amount) = get_debt_with_interest<X, Y>(pool, borrower, ctx);
        let total_current_debt = principal + interest;
        assert!(total_current_debt > 0, ERR_NO_ACTIVE_DEBT);

        // Check if position is liquidatable
        let collateral_value = get_collateral_value_in_x<X, Y>(pool, collateral_amount);
        let liquidation_threshold_value = (collateral_value * pool.liquidation_threshold) / 10000;
        assert!(total_current_debt > liquidation_threshold_value, ERR_NOT_LIQUIDABLE);

        // Determine how much can be repaid in this liquidation
        let liquidator_repay_amount = coin::value(&repay_coin);
        assert!(liquidator_repay_amount > 0, ERR_ZERO_AMOUNT);

        let max_liquidation_amount = (total_current_debt * 5000) / 10000; // 50% of debt
        assert!(liquidator_repay_amount <= max_liquidation_amount, ERR_EXCEED_LIQUIDATION_AMOUNT );

        // Calculate collateral to seize with bonus
        let collateral_to_seize_value = (liquidator_repay_amount * (10000 + pool.liquidation_bonus)) / 10000;
        
        // Convert value to actual collateral amount
        let collateral_to_seize = (((collateral_to_seize_value as u128) * (collateral_amount as u128)) / (collateral_value as u128) as u64);
        assert!(collateral_amount >= collateral_to_seize, ERR_INSUFFICIENT_AMOUNT);

        // Process repayment
        let repay_balance = coin::into_balance(repay_coin);
        balance::join(&mut pool.coin_x, repay_balance);
        
        pool.total_borrows = if (pool.total_borrows > liquidator_repay_amount) {
            pool.total_borrows - liquidator_repay_amount
        } else {
            0
        };

        // Update borrower's debt position
        update_debt_position<X, Y>(pool, borrower, total_current_debt-liquidator_repay_amount, collateral_amount-collateral_to_seize, ctx);

        // Transfer seized collateral to liquidator
        if (receive_underlying) {
            // Liquidator receives the underlying collateral token
            let seized_collateral = coin::take(&mut pool.coin_y, collateral_to_seize, ctx);
            transfer::public_transfer(seized_collateral, liquidator);
        } else {
            // Liquidator receives share tokens (this gives them interest-bearing position)  
            let ratio: u128 = ((collateral_to_seize as u128) * 10000) / (balance::value(&pool.coin_x) as u128);
            let shares_to_mint: u64 = ((((balance::supply_value(&pool.share_supply) as u128) * ratio) / 10000) as u64);
            let share_balance = balance::increase_supply(&mut pool.share_supply , shares_to_mint);
            transfer::public_transfer(coin::from_balance(share_balance, ctx), liquidator);
        };

        // Emit liquidation event  
        emit(LiquidationEvent {
            pool_name: generate_pool_name<X, Y>(), 
            borrower,
            repay_amount: liquidator_repay_amount,
            seized_collateral: collateral_to_seize,
            remaining_debt: total_current_debt - liquidator_repay_amount,
            liquidation_bonus: pool.liquidation_bonus,
            sender: liquidator
        });
    }

    // Add additional collateral to an existing debt position
    public entry fun add_collateral<X,Y>(global: &mut LendingGlobal, collateral_coin: Coin<Y>, ctx: &mut TxContext) {
        assert!(has_registered<X, Y>(global), ERR_POOL_NOT_REGISTER);
        assert!(!is_paused<X,Y>(global), ERR_PAUSED);

        let pool = get_mut_pool<X, Y>(global);
        assert!(table::contains( &pool.debt_positions, tx_context::sender(ctx) ), ERR_INVALID_BORROWER );

        let (principal, interest, collateral_amount) = get_debt_with_interest<X, Y>(pool, tx_context::sender(ctx), ctx);
        let total_current_debt = principal + interest;
        assert!(total_current_debt > 0, ERR_NO_ACTIVE_DEBT);
        
        // Add additional collateral
        let additional_collateral = coin::value(&collateral_coin);
        assert!(additional_collateral > 0, ERR_ZERO_AMOUNT);
        let collateral_balance = coin::into_balance(collateral_coin);
        balance::join(&mut pool.coin_y, collateral_balance);

        // Update debt position with new total collateral with no rate reset
        let current_position = table::borrow_mut( &mut pool.debt_positions,  tx_context::sender(ctx) );
        current_position.collateral_amount = collateral_amount + additional_collateral;

        // Emit event
        emit(CollateralAddedEvent {
            pool_name: generate_pool_name<X, Y>(),  
            additional_collateral,
            new_total_collateral: collateral_amount + additional_collateral,
            debt_amount: total_current_debt,
            sender: tx_context::sender(ctx)
        });
    }

    // Remove excess collateral if it doesn't violate LTV limits
    public entry fun remove_collateral<X,Y>(global: &mut LendingGlobal, amount: u64, ctx: &mut TxContext) {
        assert!(has_registered<X, Y>(global), ERR_POOL_NOT_REGISTER);
        assert!(!is_paused<X,Y>(global), ERR_PAUSED);
        assert!(amount > 0, ERR_ZERO_AMOUNT);

        let pool = get_mut_pool<X, Y>(global);
        assert!(table::contains( &pool.debt_positions, tx_context::sender(ctx) ), ERR_INVALID_BORROWER );

        // Update interest accrual first
        accrue_interest(pool, ctx);

        let (principal, interest, collateral_amount) = get_debt_with_interest<X, Y>(pool, tx_context::sender(ctx), ctx);
        let total_current_debt = principal + interest;
        assert!(total_current_debt > 0, ERR_NO_ACTIVE_DEBT); 
        assert!(collateral_amount >= amount, ERR_INSUFFICIENT_AMOUNT);

        // Calculate remaining collateral after removal
        let remaining_collateral = collateral_amount - amount;

        // Get current values in terms of asset X
        let remaining_collateral_value = get_collateral_value_in_x<X, Y>(pool, remaining_collateral);

        // Check if removing collateral would violate LTV
        // We need: total_debt <= remaining_collateral_value * ltv / 10000
        let minimum_required_collateral_value = (total_current_debt * 10000) / pool.ltv;
        assert!(remaining_collateral_value >= minimum_required_collateral_value, ERR_EXCEED_LTV);

        // Perform health check to ensure position won't be immediately liquidatable
        let liquidation_threshold_value = (remaining_collateral_value * pool.liquidation_threshold) / 10000;
        assert!(liquidation_threshold_value >= total_current_debt, ERR_REMOVE_WILL_LIQUIDATE);

        // Update debt position with new total collateral with no rate reset
        let current_position = table::borrow_mut( &mut pool.debt_positions,  tx_context::sender(ctx) );
        current_position.collateral_amount = remaining_collateral;

        // Transfer removed collateral back to user
        let collateral_coin = coin::take(&mut pool.coin_y, amount, ctx);
        transfer::public_transfer(collateral_coin, tx_context::sender(ctx));

        // Emit event
        emit(CollateralRemovedEvent {
            pool_name: generate_pool_name<X, Y>(),   
            removed_amount: amount,
            remaining_collateral,
            debt_amount: total_current_debt,
            sender: tx_context::sender(ctx)
        });
 
    }
 
    public entry fun get_current_debt<X,Y>(global: &LendingGlobal, borrower_address: address, ctx: &TxContext): (u64, u64, u64) {
        assert!(has_registered<X, Y>(global), ERR_POOL_NOT_REGISTER);
        let pool_name = generate_pool_name<X, Y>(); 
        let pool = bag::borrow<String, POOL<X, Y>>(&global.pools, pool_name);
        ( get_debt_with_interest<X,Y>(pool, borrower_address, ctx) )
    }

    public entry fun get_pool_debt<X,Y>(global: &LendingGlobal): (u64, u64) {
        assert!(has_registered<X, Y>(global), ERR_POOL_NOT_REGISTER);
        let pool_name = generate_pool_name<X, Y>(); 
        let pool = bag::borrow<String, POOL<X, Y>>(&global.pools, pool_name);
        (pool.total_borrows, pool.total_collateral)
    }

    public entry fun get_pool_utilization_rate<X,Y>(global: &LendingGlobal): u64 {
        assert!(has_registered<X, Y>(global), ERR_POOL_NOT_REGISTER);
        let pool_name = generate_pool_name<X, Y>(); 
        let pool = bag::borrow<String, POOL<X, Y>>(&global.pools, pool_name);
        (calculate_utilization_rate(pool))
    }

    public entry fun is_liquidatable<X,Y>(global: &LendingGlobal, borrower_address: address, ctx: &TxContext ) : bool {
        assert!(has_registered<X, Y>(global), ERR_POOL_NOT_REGISTER);
        let pool_name = generate_pool_name<X, Y>(); 
        let pool = bag::borrow<String, POOL<X, Y>>(&global.pools, pool_name);
        (is_liquidatable_non_entry(pool, borrower_address, ctx))
    }

    // Provides a risk metric for positions (>1 is healthy, <1 is liquidatable)
    public entry fun calculate_health_factor<X,Y>(global: &LendingGlobal, borrower_address: address, ctx: &TxContext): u64 {
        assert!(has_registered<X, Y>(global), ERR_POOL_NOT_REGISTER);
        let pool_name = generate_pool_name<X, Y>(); 
        let pool = bag::borrow<String, POOL<X, Y>>(&global.pools, pool_name); 
        let (debt_amount, interest_amount, collateral_amount) = get_debt_with_interest<X,Y>(pool, borrower_address, ctx);

        let total_debt = debt_amount+interest_amount;

        if (total_debt == 0) {
            10000 // 1.0 when no outstanding debt
        } else {
            let collateral_value = get_collateral_value_in_x<X, Y>(pool, collateral_amount);
            let liquidation_threshold_value = (collateral_value * pool.liquidation_threshold) / 10000;
            ((liquidation_threshold_value * 10000) / total_debt)
        }

    }
 
    // ======== Public Functions =========

    #[allow(lint(self_transfer))]
    public fun borrow_non_entry<X,Y>(pool: &mut POOL<X,Y>, coin_y: Coin<Y>, borrow_amount: u64, ctx: &mut TxContext): Coin<X> {

        // Update interest accrual first
        accrue_interest(pool, ctx);

        // Add collateral to pool
        let collateral_amount = coin::value(&coin_y);
        assert!(collateral_amount > 0, ERR_ZERO_AMOUNT);

        let collateral_balance = coin::into_balance(coin_y);
        balance::join(&mut pool.coin_y, collateral_balance);

        // Check borrow cap if it exists
        if (option::is_some(&pool.borrow_cap)) { 
            let borrow_cap = *option::borrow(&pool.borrow_cap);
            assert!(pool.total_borrows + borrow_amount <= borrow_cap, ERR_CAP_REACHED);
        };
 
        // Check if the pool has enough liquidity
        assert!(borrow_amount <= (balance::value(&pool.coin_x)), ERR_INSUFFICIENT_LIQUIDITY);

        // Calculate maximum borrow amount based on collateral value and LTV
        let collateral_value = get_collateral_value_in_x<X, Y>(pool, collateral_amount); 
        let max_borrow_amount = ((((collateral_value as u128) * (pool.ltv as u128)) / 10000) as u64); 
        assert!(borrow_amount <= max_borrow_amount, ERR_EXCEED_LTV);

        // Create debt record
        create_debt_position<X,Y>(
            pool,
            tx_context::sender(ctx),
            borrow_amount,
            collateral_amount,
            ctx
        );
        
        // Transfer borrowed assets
        coin::from_balance(balance::split(&mut pool.coin_x, borrow_amount) , ctx)
    }

    #[allow(lint(self_transfer))]
    public fun borrow_more_non_entry<X,Y>(pool: &mut POOL<X,Y>, additional_borrow_amount: u64, ctx: &mut TxContext): Coin<X> {
        
        // Update interest accrual first
        accrue_interest(pool, ctx);

        // Get current debt position with accrued interest
        let (principal, interest, collateral_amount) = get_debt_with_interest<X, Y>(pool, tx_context::sender(ctx), ctx);
        let total_current_debt = principal + interest;
        assert!(total_current_debt > 0, ERR_NO_ACTIVE_DEBT);

        // Calculate total new debt after additional borrowing
        let total_new_debt = total_current_debt + additional_borrow_amount;

        // Check borrow cap if it exists
        if (option::is_some(&pool.borrow_cap)) { 
            let borrow_cap = *option::borrow(&pool.borrow_cap);
            assert!(pool.total_borrows + additional_borrow_amount <= borrow_cap, ERR_CAP_REACHED);
        };
 
        // Check if the pool has enough liquidity
        assert!(additional_borrow_amount <= (balance::value(&pool.coin_x)), ERR_INSUFFICIENT_LIQUIDITY);

        // Calculate maximum borrow amount based on collateral value and LTV 
        let collateral_value = get_collateral_value_in_x<X, Y>(pool, collateral_amount);  
        let max_borrow_amount = ((((collateral_value as u128) * (pool.ltv as u128)) / 10000) as u64);
        assert!(total_new_debt <= max_borrow_amount, ERR_EXCEED_LTV);

        // Update total borrows
        pool.total_borrows = pool.total_borrows + additional_borrow_amount;

        // Update debt position with new total and reset interest accrual
        update_debt_position<X, Y>(pool, tx_context::sender(ctx), total_new_debt, collateral_amount, ctx);
        
        // Transfer borrowed assets
        coin::from_balance(balance::split(&mut pool.coin_x, additional_borrow_amount) , ctx)
    }

    #[allow(lint(self_transfer))]
    public fun supply_non_entry<X,Y>(
        pool: &mut POOL<X,Y>,
        coin_x: Coin<X>,
        ctx: &mut TxContext
    ): Coin<SHARE<X,Y>> {
        
        // Update interest accrual first
        accrue_interest(pool, ctx);

        // Extract amount and add to pool
        let coin_x_value = coin::value(&coin_x);
        assert!(coin_x_value > 0, ERR_ZERO_AMOUNT);

        let coin_x_balance = coin::into_balance(coin_x);
        balance::join(&mut pool.coin_x, coin_x_balance);

        pool.total_supply = pool.total_supply+coin_x_value;

        // Check supply cap if it exists
        if (option::is_some(&pool.supply_cap)) {
            let supply_cap = *option::borrow(&pool.supply_cap);
            assert!(balance::value(&pool.coin_x) <= supply_cap, ERR_CAP_REACHED);
        };

        // Calculate and mint share tokens to the user
        let total_supply = balance::supply_value(&pool.share_supply);
        let current_balance = balance::value(&pool.coin_x);

        // Calculate the amount of share tokens to mint
        let shares_to_mint = if (total_supply == 0) {
            // Check if initial liquidity is sufficient.
            assert!(coin_x_value > MINIMAL_LIQUIDITY, ERR_SUPPLY_NOT_ENOUGH);

            let minimal_liquidity = balance::increase_supply(
                &mut pool.share_supply,
                MINIMAL_LIQUIDITY
            );
            balance::join(&mut pool.min_liquidity, minimal_liquidity);
            // Calculate the initial share amount
            coin_x_value - MINIMAL_LIQUIDITY
        } else { 
            let ratio: u128 = ((coin_x_value as u128) * 10000) / (current_balance as u128);
            let total_share: u128 = ((total_supply as u128) * ratio) / 10000;
            (total_share as u64)
        };

         // Ensure a valid amount of share tokens 
        assert!(shares_to_mint > 0, ERR_INSUFFICIENT_SHARE_MINTED);

        let share_balance = balance::increase_supply(&mut pool.share_supply , shares_to_mint);
        coin::from_balance(share_balance, ctx)
    }

    #[allow(lint(self_transfer))]
    public fun withdraw_non_entry<X,Y>(pool: &mut POOL<X,Y>, share_coin: Coin<SHARE<X,Y>>, ctx: &mut TxContext ) : Coin<X> {

        // Update interest accrual first
        accrue_interest(pool, ctx);

        let share_amount = coin::value(&share_coin);
        assert!( share_amount > 0, ERR_ZERO_AMOUNT);

        // Calculate the maximum amount that can be withdrawn with these shares
        let withdraw_amount = calculate_amount_from_shares(pool, share_amount);

        // Check if pool has enough liquidity
        let available_liquidity = balance::value(&pool.coin_x); 
        assert!(available_liquidity >= withdraw_amount, ERR_INSUFFICIENT_LIQUIDITY);

        balance::decrease_supply(&mut pool.share_supply, coin::into_balance(share_coin));

        pool.total_supply = if (pool.total_supply > withdraw_amount) {
            pool.total_supply - withdraw_amount
        } else {
            0
        };

        coin::from_balance(balance::split(&mut pool.coin_x, withdraw_amount) , ctx)        
    }


    public fun get_mut_pool<X, Y>(global: &mut LendingGlobal): &mut POOL<X, Y> {
        let pool_name = generate_pool_name<X, Y>();
        let has_registered = bag::contains_with_type<String, POOL<X, Y>>(&global.pools, pool_name);
        assert!(has_registered, ERR_POOL_NOT_REGISTER);

        bag::borrow_mut<String, POOL<X, Y>>(&mut global.pools, pool_name)
    }

    public fun is_paused<X,Y>(global: &mut LendingGlobal): bool { 
        let pool = get_mut_pool<X, Y>(global);
        pool.has_paused
    }

    // Updates the current price in the lending pool using Pyth Oracle.
    // This implementation is currently fixed to the IOTA/USD feed for simplicity.
    public fun update_current_price<X,Y>(global: &mut LendingGlobal, clock: &Clock, price_info_object: &PriceInfoObject ) {
        let pool = get_mut_pool<X, Y>(global);

        let max_age = 60;
        let price_struct = pyth::get_price_no_older_than(price_info_object, clock, max_age);
        let price_info = price_info::get_price_info_from_price_info_object(price_info_object);
        let price_id = price_identifier::get_bytes(&price_info::get_price_identifier(&price_info));

        assert!(price_id!=x"c7b72e5d860034288c9335d4d325da4272fe50c92ab72249d58f6cbba30e4c44", ERR_INVALID_PRICE_ID);
    
        let price_i64 = price::get_price(&price_struct);

        if (i64::get_is_negative(&price_i64) == false) {
            let final_price: u64 = i64::get_magnitude_if_positive(&price_i64)/10000;
            pool.current_price = final_price;
            pool.last_update_price_timestamp = clock::timestamp_ms(clock);
        };
        
    }

    // ======== Only Governance =========

    // Allows admin to register a new lending pool
    public entry fun register_pool<X,Y>(
        global: &mut LendingGlobal,
        _admin_cap: &mut AdminCap,
        ltv: u64,
        liquidation_threshold: u64,
        liquidation_bonus: u64,
        reserve_factor: u64, 
        base_rate: u64,
        slope1: u64,
        slope2: u64,
        optimal_utilization: u64,
        borrow_cap_amount: u64, // 0 is none
        supply_cap_amount: u64, // 0 is none
        ctx: &mut TxContext
    ) {
        // Validate parameters
        assert!(ltv <= liquidation_threshold, ERR_INVALID_LTV);
        assert!(liquidation_threshold <= 10000, ERR_INVALID_THRESHOLD);
        assert!(reserve_factor <= 5000, ERR_RESERVE_FACTOR); 
        assert!( base_rate > 0 && slope1 > 0 && slope2 > 0 &&  optimal_utilization > 0 , ERR_INVALID_RATES);

        // Check if the pool already exists
        let pool_name = generate_pool_name<X, Y>();
        let has_registered = bag::contains_with_type<String, POOL<X, Y>>(&global.pools, pool_name);
        assert!(!has_registered, ERR_POOL_HAS_REGISTERED);

        let share_supply = balance::create_supply(SHARE<X, Y> {});

        let borrow_cap = if (borrow_cap_amount == 0) {
            option::none()
        } else {
            option::some<u64>(borrow_cap_amount)
        };

        let supply_cap = if (supply_cap_amount == 0) {
            option::none()
        } else {
            option::some<u64>(supply_cap_amount)
        };

        bag::add(&mut global.pools, pool_name, POOL {
            global: object::uid_to_inner(&global.id),
            coin_x: balance::zero<X>(),
            coin_y: balance::zero<Y>(),
            ltv,
            liquidation_threshold,
            liquidation_bonus,
            reserve_factor,
            share_supply,
            min_liquidity: balance::zero<SHARE<X, Y>>(), 
            has_paused: false,
            base_rate,
            slope1,
            slope2,
            optimal_utilization,
            borrow_cap,
            supply_cap,
            last_update_timestamp: 0,
            total_borrows: 0,
            current_borrow_rate: 0,
            current_supply_rate: 0,
            current_price: 10000,
            is_invert: false,
            last_update_price_timestamp: 0,
            debt_positions: table::new<address, DebtPosition>(ctx),
            total_collateral: 0,
            total_supply: 0
        });

        emit(
            RegisterPoolEvent {
                global: object::id(global),
                pool_name
            }
        )

    }

    public entry fun update_pool_ltv<X,Y>(global: &mut LendingGlobal, _admin_cap: &mut AdminCap, ltv: u64, liquidation_threshold: u64, liquidation_bonus: u64, _ctx: &mut TxContext ) {
        let pool = get_mut_pool<X, Y>(global);

        assert!(ltv <= liquidation_threshold, ERR_INVALID_LTV);
        assert!(liquidation_threshold <= 10000, ERR_INVALID_THRESHOLD);

        pool.ltv = ltv;
        pool.liquidation_threshold = liquidation_threshold;
        pool.liquidation_bonus = liquidation_bonus;
    }

    public entry fun update_pool_rates<X,Y>(global: &mut LendingGlobal,  _admin_cap: &mut AdminCap, reserve_factor: u64, base_rate: u64, slope1: u64, slope2: u64, optimal_utilization: u64, _ctx: &mut TxContext) {
        let pool = get_mut_pool<X, Y>(global);
        
        assert!(reserve_factor <= 5000, ERR_RESERVE_FACTOR); 
        assert!( base_rate > 0 && slope1 > 0 && slope2 > 0 &&  optimal_utilization > 0 , ERR_INVALID_RATES);

        pool.reserve_factor = reserve_factor;
        pool.base_rate = base_rate;
        pool.slope1 = slope1;
        pool.slope2 = slope2;
        pool.optimal_utilization = optimal_utilization;
    }

    public entry fun update_pool_caps<X,Y>(global: &mut LendingGlobal, _admin_cap: &mut AdminCap, borrow_cap_amount: u64, supply_cap_amount: u64, _ctx: &mut TxContext) {
        let pool = get_mut_pool<X, Y>(global);

        pool.borrow_cap = if (borrow_cap_amount == 0) {
            option::none()
        } else {
            option::some<u64>(borrow_cap_amount)
        };

        pool.supply_cap = if (supply_cap_amount == 0) {
            option::none()
        } else {
            option::some<u64>(supply_cap_amount)
        };
    }

    public entry fun pause<X,Y>(global: &mut LendingGlobal, _admin_cap: &mut AdminCap, is_pause: bool) {
        let pool = get_mut_pool<X, Y>(global);
        pool.has_paused = is_pause;
    }

    public entry fun update_override_price<X,Y>(global: &mut LendingGlobal, _admin_cap: &mut AdminCap, override_price: u64, is_invert:  bool) {
        let pool = get_mut_pool<X, Y>(global);
        pool.current_price = override_price;
        pool.is_invert = is_invert;
    }

  

    // ======== Internal Functions =========

    fun generate_pool_name<X, Y>(): String {
        let mut lp_name = string::utf8(b"");
        string::append_utf8(&mut lp_name, b"POOL-"); 
        string::append_utf8(&mut lp_name, into_bytes(into_string(get<X>())));
        string::append_utf8(&mut lp_name, b"-");
        string::append_utf8(&mut lp_name, into_bytes(into_string(get<Y>())));

        lp_name
    }

    // Helper function to calculate accrued interest
    fun accrue_interest<X, Y>(pool: &mut POOL<X, Y>, ctx: &TxContext) { 
        let current_time = tx_context::epoch_timestamp_ms(ctx); 

        let time_elapsed_sec = if (current_time > pool.last_update_timestamp) {
            ((current_time-pool.last_update_timestamp) / 1000)
        } else {
            0
        };
        
        if (time_elapsed_sec > 0) {
            // Calculate interest based on current borrow rate
            let interest_factor = (pool.current_borrow_rate  * (time_elapsed_sec)) / (365 * 86400);
            let interest_accrued = (pool.total_borrows * interest_factor) / 10000;
 
            // Update total borrows with accrued interest
            pool.total_borrows = pool.total_borrows + interest_accrued;
            
            // Calculate reserve portion 
            let reserve_amount = (interest_accrued * pool.reserve_factor) / 10000;

            // Update rates based on new utilization
            let utilization_rate = calculate_utilization_rate(pool);

            pool.current_borrow_rate = calculate_borrow_rate(pool, utilization_rate);
            pool.current_supply_rate = calculate_supply_rate(pool, utilization_rate);
            
            // Update timestamp
            pool.last_update_timestamp = current_time;
            
            // Emit interest accrual event
            emit(InterestAccrualEvent {
                pool_name: generate_pool_name<X, Y>(),
                interest_accrued,
                reserve_amount,
                new_borrow_rate: pool.current_borrow_rate,
                new_supply_rate: pool.current_supply_rate
            });
        } else {
            // Only update rates
            let utilization_rate = calculate_utilization_rate(pool);
            pool.current_borrow_rate = calculate_borrow_rate(pool, utilization_rate);
            pool.current_supply_rate = calculate_supply_rate(pool, utilization_rate);
        }
    }

    // Helper function to calculate utilization rate
    fun calculate_utilization_rate<X, Y>(pool: &POOL<X, Y>): u64 {
        let total_supply = pool.total_supply;
        
        if (total_supply == 0) {
            0
        } else {
            ((pool.total_borrows * 10000) / total_supply)
        }
    }

    // Helper function to calculate borrow rate from utilization
    fun calculate_borrow_rate<X, Y>(pool: &POOL<X, Y>, utilization_rate: u64): u64 {
        if (utilization_rate <= pool.optimal_utilization) {
            pool.base_rate + ((utilization_rate * pool.slope1) / pool.optimal_utilization)
        } else {
            pool.base_rate + pool.slope1 + (((utilization_rate - pool.optimal_utilization) * pool.slope2) / (10000 - pool.optimal_utilization))
        }
    }

    // Helper function to calculate supply rate from borrow rate
    fun calculate_supply_rate<X, Y>(pool: &POOL<X, Y>, utilization_rate: u64): u64 {
        let borrow_rate = calculate_borrow_rate(pool, utilization_rate);
        (borrow_rate * utilization_rate * (10000 - pool.reserve_factor)) / (10000 * 10000)
    }

    fun create_debt_position<X, Y>(pool: &mut POOL<X,Y>, borrower: address, debt_amount: u64, collateral_amount:u64, ctx: &TxContext) {

        if ( table::contains( &pool.debt_positions, borrower ) ) {
            let current_position = table::borrow_mut( &mut pool.debt_positions, borrower );
            assert!( current_position.debt_amount == 0, ERR_STILL_ACTIVE_DEBT );
            current_position.debt_amount = debt_amount;
            current_position.collateral_amount = collateral_amount;
            current_position.borrow_timestamp = tx_context::epoch_timestamp_ms(ctx);
            current_position.borrow_rate_snapshot = pool.current_borrow_rate;
            current_position.ltv_snapshot = pool.ltv;
            current_position.liquidation_threshold_snapshot = pool.liquidation_threshold;
        } else {
            let new_position = DebtPosition {
                debt_amount,
                collateral_amount,
                borrow_timestamp: tx_context::epoch_timestamp_ms(ctx),
                borrow_rate_snapshot: pool.current_borrow_rate,
                ltv_snapshot: pool.ltv,
                liquidation_threshold_snapshot: pool.liquidation_threshold,
                holder: borrower
            };
            table::add( &mut pool.debt_positions, borrower, new_position );
        };

        pool.total_collateral = pool.total_collateral+collateral_amount;
        pool.total_borrows = pool.total_borrows+debt_amount;
    }

    fun update_debt_position<X,Y>(pool: &mut POOL<X,Y>, borrower: address, debt_amount: u64, collateral_amount:u64, ctx: &TxContext) {
        assert!( table::contains( &pool.debt_positions, borrower ), ERR_INVALID_BORROWER );

        let current_position = table::borrow_mut( &mut pool.debt_positions, borrower );

        current_position.debt_amount = debt_amount;
        current_position.collateral_amount = collateral_amount;
        current_position.borrow_timestamp = tx_context::epoch_timestamp_ms(ctx);
        current_position.borrow_rate_snapshot = pool.current_borrow_rate;
        current_position.ltv_snapshot = pool.ltv;
        current_position.liquidation_threshold_snapshot = pool.liquidation_threshold;
    }

    fun close_debt_position<X,Y>(pool: &mut POOL<X,Y>, borrower: address) {
        let current_position = table::borrow_mut( &mut pool.debt_positions, borrower );
        current_position.debt_amount = 0;
        current_position.collateral_amount = 0;
    }

    fun get_collateral_value_in_x<X, Y>(pool: &POOL<X, Y>, collateral_amount: u64): u64 {
        if (pool.is_invert == false) {
            ((((pool.current_price as u128) * (collateral_amount as u128)) / 10000) as u64)
        } else {
            (((10000 * (collateral_amount as u128)) / (pool.current_price as u128)) as u64)
        }
    }
 
    fun get_debt_with_interest<X,Y>(pool: &POOL<X, Y>, borrower_address: address, ctx: &TxContext) : (u64, u64, u64) {
        assert!( table::contains( &pool.debt_positions, borrower_address ), ERR_INVALID_BORROWER );

        let position = table::borrow( &pool.debt_positions, borrower_address );
        let principal = position.debt_amount;
        
        if (principal == 0) {
            (0,0,0)
        } else {
            let collateral = position.collateral_amount;  

            // Calculate accrued interest 
            let accrued_interest = calculate_accrued_interest(
                principal, 
                position.borrow_timestamp,
                tx_context::epoch_timestamp_ms(ctx),
                position.borrow_rate_snapshot
            );

            (principal, accrued_interest, collateral)
        }

    }

    // Helper for calculate accrued interest
    fun calculate_accrued_interest(principal: u64, borrow_timestamp: u64, current_timestamp: u64, borrow_rate_snapshot: u64): u64 {
        // Convert milliseconds to seconds and ensure we don't have negative time
        let time_elapsed_sec = if (current_timestamp > borrow_timestamp) {
            (current_timestamp - borrow_timestamp) / 1000
        } else {
            0
        };
        
        // Calculate interest factor based on time elapsed
        let interest_factor = (borrow_rate_snapshot * time_elapsed_sec) / (365 * 86400);
        
        // Calculate interest amount
        let interest_amount = (principal * interest_factor) / 10000;
        
        interest_amount
    }

    // Helper function to calculate underlying amount from shares
    fun calculate_amount_from_shares<X, Y>(pool: &POOL<X, Y>, share_amount: u64): u64 {
        let total_shares = balance::supply_value(&pool.share_supply); 
        
        // If no shares exist yet, return 0
        if (total_shares == 0) {
            0
        } else {
            // Calculate total pool value including outstanding debt
            let total_pool_value = balance::value(&pool.coin_x) + pool.total_borrows;
            // Calculate proportional amount
            (((share_amount as u128) * (total_pool_value as u128)) / (total_shares as u128) as u64)
        }
    }

    // Check if position is liquidatable 
    fun is_liquidatable_non_entry<X, Y>(pool: &POOL<X, Y>, borrower: address, ctx: &TxContext): bool {
        let (principal, interest, collateral_amount) = get_debt_with_interest<X, Y>(pool, borrower, ctx);
        let total_current_debt = principal + interest; 
        if (total_current_debt == 0) {
            false
        } else {
            let collateral_value = get_collateral_value_in_x<X, Y>(pool, collateral_amount);
            let liquidation_threshold_value = (collateral_value * pool.liquidation_threshold) / 10000;
            (total_current_debt > liquidation_threshold_value)
        }

    }

    fun has_registered<X, Y>(global: &LendingGlobal): bool {
        let pool_name = generate_pool_name<X, Y>();
        bag::contains_with_type<String, POOL<X, Y>>(&global.pools, pool_name)
    }

    // ======== Test-related Functions =========

    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        init(ctx);
    }

    #[test_only]
    public fun get_mut_pool_for_testing<X, Y>(
        global: &mut LendingGlobal
    ): &mut POOL<X, Y> {
        get_mut_pool<X, Y>(global)
    }

}