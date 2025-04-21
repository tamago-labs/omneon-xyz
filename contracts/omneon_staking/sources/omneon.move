
// Implementation of the Omneon token with staking mechanism for lenders
// This is a simplified version for testnet deployment

module omneon_staking::omneon {

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

    use std::string::{Self, String}; 
    use std::type_name::{get, into_string};
    use std::ascii::into_bytes;  

    // ======== Constants ========


    // ======== Errors ========

    const ERR_ZERO_VALUE: u64 = 1;
    const ERR_POOL_NOT_FOUND: u64  = 2;
    const ERR_INCORRECT_POOL: u64 = 3;

    // ======== Structs =========

    public struct OMNEON has drop {}

    // Staking position for a user
    public struct StakingPosition<phantom X> has key, store {
        id: UID,
        share_coin: Balance<X>, // share coin locked in the object 
        share_type: String,
        start_time: u64,
        last_claim_time: u64,
        rewards_per_token_paid: u64,
        owner: address
    }

    // For admin permission
    public struct AdminCap has key {
        id: UID
    }

    public struct StakeEvent has copy, drop {
        asset_type: String,
        share_amount: u64,
        timestamp: u64,
        sender: address
    }

    public struct ClaimRewardsEvent has copy, drop {
        asset_type: String,
        reward_amount: u64,
        timestamp: u64,
        sender: address
    }

    public struct UnstakeEvent has copy, drop {
        asset_type: String,
        unstake_amount: u64,
        timestamp: u64,
        sender: address
    }
 
    // Global state of the staking system
    public struct StakingGlobal has key {
        id: UID, 
        total_supply: u64, // Total supply of Omneon tokens (1 billion with 9 decimals)
        supply: Supply<OMNEON>,
        rewards_allocation: Balance<OMNEON>, // Tokens allocated for rewards 
        pools: Bag, // Collection of all staking pools  
        emission_rates: Table<String, u64>, // Emission rate per second per token type
        total_staked: Table<String, u64>, // Total staked amount per token type
        rewards_per_token: Table<String, u64>, // Accumulated rewards per token
        last_update_time: u64 // Last update time
    }

    // ======== Entry Points =========

    // Initializes the global state
    fun init(witness: OMNEON, ctx: &mut TxContext) {
        
        let (treasury_cap, metadata) = coin::create_currency<OMNEON>(witness, 9, b"OMNEON TOKEN", b"OMN", b"", option::none(), ctx);
        transfer::public_freeze_object(metadata);

        transfer::transfer(
            AdminCap {id: object::new(ctx)},
            tx_context::sender(ctx)
        );

        let global = StakingGlobal {
            id: object::new(ctx),
            total_supply: 1_000000000_000000000, // 1B tokens with 9 decimals
            supply: coin::treasury_into_supply<OMNEON>(treasury_cap),
            rewards_allocation: balance::zero<OMNEON>(),
            pools: bag::new(ctx),
            emission_rates: table::new(ctx),
            total_staked: table::new(ctx),
            rewards_per_token: table::new(ctx),
            last_update_time: tx_context::epoch(ctx)
        };

        transfer::share_object(global)
    }

    // Stake share tokens to earn Omneon rewards
    public entry fun stake<X>( 
        global: &mut StakingGlobal,
        share_coin: Coin<X>,
        clock: &Clock,
        ctx: &mut TxContext
    ) { 
        let asset_type = generate_pool_name<X>(); 

        // Check if asset type is supported
        assert!(table::contains(&global.emission_rates, asset_type), ERR_POOL_NOT_FOUND);
        
        // Update rewards state
        update_rewards(global, asset_type, clock);

        let share_amount = coin::value(&(share_coin));

        // Increase total staked for this asset type
        let total = table::borrow_mut(&mut global.total_staked, asset_type);
        *total = *total + share_amount;

        // Create staking position
        let staking_position = StakingPosition<X> {
            id: object::new(ctx), 
            share_coin: coin::into_balance(share_coin) ,
            share_type: asset_type,
            start_time: clock::timestamp_ms(clock),
            last_claim_time: clock::timestamp_ms(clock),
            rewards_per_token_paid: *table::borrow(&global.rewards_per_token, asset_type),
            owner: tx_context::sender(ctx)
        };
        
        // Transfer staking position to sender
        transfer::public_transfer(staking_position, tx_context::sender(ctx));
        
        // Emit stake event
        emit(StakeEvent {
            asset_type,
            share_amount: share_amount,
            sender: tx_context::sender(ctx), 
            timestamp: clock::timestamp_ms(clock)
        });
    }

    // Unstake share tokens and claim rewards
    public entry fun unstake<X>(
        global: &mut StakingGlobal,
        staking_position: StakingPosition<X>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let asset_type = generate_pool_name<X>(); 

        assert!( asset_type == staking_position.share_type , ERR_INCORRECT_POOL);
        // Check if asset type is supported
        assert!(table::contains(&global.emission_rates, asset_type), ERR_POOL_NOT_FOUND);
        
        // Update rewards state
        update_rewards(global, staking_position.share_type, clock);
        
        // Calculate pending rewards
        let pending_reward = calculate_rewards(
            &staking_position,
            global
        );
        
        // Transfer rewards if any
        if (pending_reward > 0) {
            // Extract rewards from the pool
            let reward_coin = coin::from_balance(
                balance::split(&mut global.rewards_allocation, pending_reward),
                ctx
            );
            
            // Transfer rewards to user
            transfer::public_transfer(reward_coin, staking_position.owner);
            
            // Emit claim event
            emit(ClaimRewardsEvent {
                asset_type: staking_position.share_type,
                reward_amount: pending_reward,
                timestamp: clock::timestamp_ms(clock),
                sender: staking_position.owner
            });
        };

        // Decrease total staked for this asset type
        let total = table::borrow_mut(&mut global.total_staked, staking_position.share_type);
        let share_amount = balance::value(&staking_position.share_coin);
        *total = *total - share_amount;
        
        // Emit unstake event
        emit(UnstakeEvent {
            asset_type: staking_position.share_type,
            unstake_amount: share_amount,
            timestamp: clock::timestamp_ms(clock),
            sender: staking_position.owner
        });
         
        // Consume the staking position
        let StakingPosition { id, share_coin, share_type: _, start_time: _,last_claim_time: _, rewards_per_token_paid:_, owner  } = staking_position;
        object::delete(id);
        // Transfer the share token to the user 
        transfer::public_transfer( coin::from_balance( share_coin, ctx), owner);
    }

    // Claim rewards without unstaking
    public entry fun claim<X>(
        global: &mut StakingGlobal,
        staking_position: &mut StakingPosition<X>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let asset_type = generate_pool_name<X>(); 

        assert!( asset_type == staking_position.share_type , ERR_INCORRECT_POOL);
        // Check if asset type is supported
        assert!(table::contains(&global.emission_rates, asset_type), ERR_POOL_NOT_FOUND);

        // Update rewards state
        update_rewards(global, staking_position.share_type, clock);
        
        // Calculate pending rewards
        let pending_reward = calculate_rewards(
            staking_position,
            global
        );
        
        // Transfer rewards if any
        if (pending_reward > 0) {
            // Extract rewards from the pool
            let reward_coin = coin::from_balance(
                balance::split(&mut global.rewards_allocation, pending_reward),
                ctx
            );
            
            // Transfer rewards to user
            transfer::public_transfer(reward_coin, staking_position.owner);
            
            // Update staking position
            staking_position.last_claim_time = clock::timestamp_ms(clock);
            staking_position.rewards_per_token_paid = *table::borrow(&global.rewards_per_token, staking_position.share_type);
            
            // Emit claim event
            emit(ClaimRewardsEvent {
                asset_type: staking_position.share_type,
                reward_amount: pending_reward,
                timestamp: clock::timestamp_ms(clock),
                sender: staking_position.owner
            });
        }
    }

    // ======== Public Functions =========

    // ======== Only Governance =========

    // Configure reward rate for an asset type
    public entry fun configure_reward_rate<X>(global: &mut StakingGlobal, _admin_cap: &mut AdminCap, rate:u64, _ctx: &mut TxContext ) {
        assert!( rate > 0 , ERR_ZERO_VALUE  );
        let pool_name = generate_pool_name<X>();

        if (!table::contains(&global.emission_rates, pool_name)) {
            table::add(&mut global.emission_rates, pool_name, rate);
            table::add(&mut global.total_staked, pool_name, 0);
            table::add(&mut global.rewards_per_token, pool_name, 0);
        } else {
            // Update existing rate
            *table::borrow_mut(&mut global.emission_rates, pool_name) = rate;
        }

    }

    // Add tokens to the staking rewards allocation, 50% will go to the treasury 
    // for future community airdrops, team allocation, and other initiatives
    public entry fun add_rewards(
        global: &mut StakingGlobal,
        _admin_cap: &mut AdminCap,  
        treasury_address: address,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!( amount > 0 , ERR_ZERO_VALUE  );
        // Calculate amounts
        let treasury_amount = amount / 2;  // 50% to treasury
        let rewards_amount = amount - treasury_amount;  // Remaining to rewards pool

        let mut minted_balance = balance::increase_supply<OMNEON>(&mut global.supply, amount);
        // Add to rewards pool
        balance::join(&mut global.rewards_allocation, balance::split(&mut minted_balance, rewards_amount));

        // Send to treasury address
        transfer::public_transfer(coin::from_balance(minted_balance, ctx), treasury_address);
    }

    // ======== Internal Functions =========

    fun generate_pool_name<X>(): String {
        let mut pool_name = string::utf8(b"");
        string::append_utf8(&mut pool_name, b"REWARDS-POOL-"); 
        string::append_utf8(&mut pool_name, into_bytes(into_string(get<X>())));  
        pool_name
    }

    // Update the global rewards state
    fun update_rewards(
        global: &mut StakingGlobal,
        asset_type: String,
        clock: &Clock
    ) {
        let current_time = clock::timestamp_ms(clock);
        
        // Skip if no time has passed
        if ( current_time > global.last_update_time ) {

            let total_staked = *table::borrow(&global.total_staked, asset_type);
        
            // Skip if nothing is staked
            if (total_staked > 0) {
                
                // Calculate time elapsed in seconds
                let time_elapsed = (current_time - global.last_update_time) / 1000;
            
                // Calculate new rewards
                let emission_rate = *table::borrow(&global.emission_rates, asset_type);
                let new_rewards = (time_elapsed * emission_rate) / 10000;
                
                // Update rewards per token
                let rewards_per_token = table::borrow_mut(&mut global.rewards_per_token, asset_type);
                *rewards_per_token = *rewards_per_token + ((new_rewards * 1000000000) / total_staked);
                
            };

            // Update last update time
            global.last_update_time = current_time;
            
        };
        
        
    }

    // Calculate pending rewards for a staking position
    fun calculate_rewards<X>(
        staking_position: &StakingPosition<X>,
        global: &StakingGlobal
    ): u64 {
        let current_rewards_per_token = *table::borrow(&global.rewards_per_token, staking_position.share_type);
        let rewards_delta = current_rewards_per_token - staking_position.rewards_per_token_paid;
        let share_amount = balance::value(&staking_position.share_coin);

        // Calculate pending rewards
        (share_amount * rewards_delta) / 1_000000000
    }

    // ======== Test-related Functions =========

     #[test_only]
    /// Wrapper of module initializer for testing
    public fun test_init(ctx: &mut TxContext) {
        init(OMNEON {}, ctx)
    }
}