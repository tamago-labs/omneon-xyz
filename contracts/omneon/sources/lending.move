

module omneon::lending {

    use iota::coin::{Self, Coin};
    use iota::iota::IOTA; 
    use iota::tx_context::{Self};
    use iota::object::{Self, ID, UID};
    use iota::transfer::{public_transfer,share_object};
    use iota::bag::{Self, Bag};
    use iota::balance::{Self, Supply, Balance};
    use iota::event::emit;
    use iota::table::{Self, Table};

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
        debt_positions: Table<address, DebtPosition>, // All debt positions
        override_price: u64, // For internal testing 
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

    public struct BorrowEvent has copy, drop {
        pool_name: String,
        collateral_amount: u64,
        borrow_amount: u64,
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
            sender: tx_context::sender(ctx)
        });
    }

    // Borrow more against existing collateral 
    public entry fun borrow_more() {

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
    public entry fun withdraw() {
        // Check available liquidity
        // Burn oTokens
        // Transfer assets to user
        // Update internal accounting
        // Emit event
    }

    // Liquidate undercollateralized positions
    public entry fun liquidate() {
        // Check liquidation conditions
        // Calculate collateral to seize
        // Transfer debt tokens from liquidator
        // Transfer collateral to liquidator
        // Update positions
        // Emit event
    }

    public entry fun add_collateral() {

    }

    public entry fun remove_collateral() {

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

    public entry fun is_liquidatable() {

    }

    public entry fun calculate_health_factor() {
        
    }
 
    // ======== Public Functions =========

    #[allow(lint(self_transfer))]
    public fun borrow_non_entry<X,Y>(pool: &mut POOL<X,Y>, coin_y: Coin<Y>, borrow_amount: u64, ctx: &mut TxContext): Coin<X> {

        // Update interest accrual first
        accrue_interest(pool, ctx);

        // Add collateral to pool
        let collateral_amount = coin::value(&coin_y);
        assert!(collateral_amount > 0, ERR_ZERO_AMOUNT);

        let mut collateral_balance = coin::into_balance(coin_y);
        balance::join(&mut pool.coin_y, collateral_balance);

        // Check borrow cap if it exists
        if (option::is_some(&pool.borrow_cap)) { 
            let borrow_cap = *option::borrow(&pool.borrow_cap);
            assert!(pool.total_borrows + borrow_amount <= borrow_cap, ERR_CAP_REACHED);
        };

        // Check if the pool has enough liquidity
        assert!(borrow_amount <= (balance::value(&pool.coin_x) - pool.total_borrows), ERR_INSUFFICIENT_LIQUIDITY);

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

        let mut coin_x_balance = coin::into_balance(coin_x);
        balance::join(&mut pool.coin_x, coin_x_balance);

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

        // let shares = calculate_shares_from_amount<X,Y>(pool, coin_x_value);
        let share_balance = balance::increase_supply(&mut pool.share_supply , shares_to_mint);
        coin::from_balance(share_balance, ctx)
    }

    public fun withdraw_non_entry() {

    }

    public fun liquidate_non_entry() {

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
            override_price: 10000,
            debt_positions: table::new<address, DebtPosition>(ctx),
            total_collateral: 0
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

    public entry fun update_override_price<X,Y>(global: &mut LendingGlobal, _admin_cap: &mut AdminCap, override_price: u64) {
        let pool = get_mut_pool<X, Y>(global);
        pool.override_price = override_price;
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
    fun accrue_interest<X, Y>(pool: &mut POOL<X, Y>, ctx: &mut TxContext) { 
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
        let total_supply = balance::value(&pool.coin_x);
        
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
        ((((pool.override_price as u128) * (collateral_amount as u128)) / 10000) as u64)
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