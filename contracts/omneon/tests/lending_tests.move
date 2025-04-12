

module omneon::lending_tests {

    use iota::coin::{ Self, Coin, mint_for_testing as mint, burn_for_testing as burn}; 
    use iota::test_scenario::{Self, Scenario, next_tx, ctx, end};
    use iota::iota::IOTA;
    use iota::tx_context::{Self};

    use omneon::lending::{Self, LendingGlobal, AdminCap, SHARE};

    // test coins

    public struct VUSD {}

    #[test]
    fun test_pool_creation() {
        let mut scenario = scenario();
        register_pools(&mut scenario);
        end(scenario);
    }

    #[test]
    fun test_borrowing_base_rate() {
        let mut scenario = scenario();
        register_pools(&mut scenario);
        borrow_vusd_with_iota(&mut scenario);
        borrow_iota_with_vusd(&mut scenario);
        end(scenario);
    }

    #[test]
    fun test_borrowing_high_utilization() {
        let mut scenario = scenario();
        register_pools(&mut scenario);
        borrow_vusd_high_utilization(&mut scenario); // Borrow VUSD before/after target rate 
        end(scenario);
    }

    #[test]
    fun test_withdrawing() {
        let mut scenario = scenario();
        register_pools(&mut scenario);
        withdraw_shares(&mut scenario);
        end(scenario);
    }

    #[test]
    fun test_borrowing_more() {
        let mut scenario = scenario();
        register_pools(&mut scenario);
        borrow_vusd_with_iota_more(&mut scenario);
        end(scenario);
    }

    #[test]
    fun test_liquidate() {
        let mut scenario = scenario();
        register_pools(&mut scenario);
        borrow_and_liquidate(&mut scenario);
        end(scenario);
    }

    // TODO: Add/remove collateral

    // #[test]
    // fun test_add_collateral() {

    // }

    // #[test]
    // fun test_remove_collateral() {

    // }

    fun borrow_vusd_with_iota(test: &mut Scenario) {
        let (_, user, _, _) = users();

        next_tx(test, user);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);

            let pool = lending::get_mut_pool_for_testing<VUSD, IOTA>(&mut global);

            let vusd_coins = lending::borrow_non_entry(
                pool,
                mint<IOTA>(1000_000000000, ctx(test)), // 1000 IOTA 
                50_000000000, // Borrowing 50 VUSD
                ctx(test)
            );

            let burn = burn(vusd_coins);   
            assert!(burn == 50_000000000, burn); // 50 VUSD

            test_scenario::return_shared(global);
        };

        // Fast-forward 300 days
        next_tx(test, user);
        {
            tx_context::increment_epoch_timestamp( ctx(test), 25920000000);
        };

        // Checking interest first then repay all
        next_tx(test, user);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);

            // Retrieve current debt position
            let (principal, interest_accrued, collateral) = lending::get_current_debt<VUSD, IOTA>( &global, user , ctx(test) );
            
            // Assert principal remains at 50 VUSD 
            assert!(principal == 50_000000000, principal); 

            // Assert interest accrued is 0.41 VUSD (~0.82% over 300 days with a 1% annual base rate)
            assert!(interest_accrued == 410000000, interest_accrued);
            
            // Assert user collateral is 1000 IOTA
            assert!(collateral == 1000_000000000, collateral);

            // Repay the full debt (principal + interest)
            lending::repay<VUSD, IOTA>(
                &mut global,
                mint<VUSD>(60_000000000, ctx(test)), // Provide 60 VUSD for repayment
                true,  // Repay full debt including accrued interest
                ctx(test)
            );

            test_scenario::return_shared(global);
        };

        // Verifying debt is cleared
        next_tx(test, user);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);
            let vusd_token = test_scenario::take_from_sender<Coin<VUSD>>(test);
            let iota_token = test_scenario::take_from_sender<Coin<IOTA>>(test);

            // Check that the user's debt is fully repaid
            let (principal, interest_accrued, _) = lending::get_current_debt<VUSD, IOTA>(&global, user, ctx(test));
            assert!(principal == 0, 1); 
            assert!(interest_accrued == 0, 2);  

            // Expect remaining 9.59 VUSD after full repayment (60 - 50 principal - 0.41 interest)
            assert!(coin::value(&(vusd_token)) == 9_590000000, 3);

            // Expect full 1000 IOTA collateral to be returned after loan is cleared
            assert!(coin::value(&(iota_token)) == 1000_000000000, 4);

            test_scenario::return_to_sender( test, vusd_token );
            test_scenario::return_to_sender( test, iota_token );
            test_scenario::return_shared(global);
        };

    }

    fun borrow_iota_with_vusd(test: &mut Scenario) {
        let (_, user, _, _) = users();

        next_tx(test, user);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);

            let pool = lending::get_mut_pool_for_testing<IOTA, VUSD>(&mut global);

            let iota_coins = lending::borrow_non_entry(
                pool,
                mint<VUSD>(100_000000000, ctx(test)), // 100 VUSD 
                500_000000000, // Borrowing 500 IOTA
                ctx(test)
            );

            let burn = burn(iota_coins);   
            assert!(burn == 500_000000000, burn); // 500 IOTA

            test_scenario::return_shared(global);
        };

        // Fast-forward 300 days
        next_tx(test, user);
        {
            tx_context::increment_epoch_timestamp( ctx(test), 25920000000);
        };

        // Checking interest first then repay all
        next_tx(test, user);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);

            // Retrieve current debt position
            let (principal, interest_accrued, collateral) = lending::get_current_debt<IOTA, VUSD>( &global, user , ctx(test) );
            
            // Assert principal remains at 500 IOTA  
            assert!(principal == 500_000000000, principal); 

            // Assert interest accrued is 8.2 VUSD (~1.64% over 300 days with a 2% annual base rate)
            assert!(interest_accrued == 8_200000000, interest_accrued);
            
            // Assert user collateral is 100 VUSD 
            assert!(collateral == 100_000000000, collateral);

            // Repay the full debt (principal + interest)
            lending::repay<IOTA, VUSD>(
                &mut global,
                mint<IOTA>(510_000000000, ctx(test)), // Provide 510 IOTA for repayment
                true,  // Repay full debt including accrued interest
                ctx(test)
            );

            test_scenario::return_shared(global);
        };
    }

    fun register_pools(test: &mut Scenario) {
        let (owner, _, _, _) = users();

        next_tx(test, owner);
        {
            lending::test_init(ctx(test)); 
        };

        // Setup vUSD as lending, IOTA as collateral
        next_tx(test, owner);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);
            let mut admincap = test_scenario::take_from_sender<AdminCap>(test);

            lending::register_pool<VUSD, IOTA>(
                &mut global, 
                &mut admincap, 
                7500, // LTV 75%
                8000, // Liquidation Threshold
                500, // Bonus for liquidator
                2000, // 20% for protocol fees
                100, // Base interest rate when utilization is 0% (1% = 100)
                400, // Rate of increase before optimal utilization (4% = 400)
                6000, // Rate of increase after optimal utilization (60% = 6000)
                8000, // The target utilization rate (80% = 8000)
                0, // No cap
                0, // No cap
                ctx(test));

            // Update price IOTA/VUSD = 0.1
            lending::update_override_price<VUSD, IOTA>(&mut global, &mut admincap, 1000 );

            let pool = lending::get_mut_pool_for_testing<VUSD, IOTA>(&mut global);

            let shares = lending::supply_non_entry(
                pool,
                mint<VUSD>(10000_000000000, ctx(test)), // 10,000 VUSD 
                ctx(test)
            );

            let burn = burn(shares);  
            assert!(burn == 9999_999999000, burn); // 9,999 SHARE

            test_scenario::return_to_sender(test, admincap);
            test_scenario::return_shared(global);
        };

        // Then IOTA as lending, vUSD as collateral
        next_tx(test, owner);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);
            let mut admincap = test_scenario::take_from_sender<AdminCap>(test);

            lending::register_pool<IOTA, VUSD>(
                &mut global, 
                &mut admincap, 
                8000, // LTV 80%
                8500, // Liquidation Threshold
                500, // Bonus for liquidator
                2000, // 20% for protocol fees
                200, // Base interest rate when utilization is 0% (2% = 200)
                600, // Rate of increase before optimal utilization (6% = 600)
                5000, // Rate of increase after optimal utilization (50% = 5000)
                7500, // The target utilization rate (75% = 7500)
                0, // No cap
                0, // No cap
                ctx(test));

            // Update price VUSD/IOTA = 10
            lending::update_override_price<IOTA, VUSD>(&mut global, &mut admincap, 100000 );

            let pool = lending::get_mut_pool_for_testing<IOTA, VUSD>(&mut global);

            let shares = lending::supply_non_entry(
                pool,
                mint<IOTA>(100000_000000000, ctx(test)), // 100,000 IOTA 
                ctx(test)
            );

            let burn = burn(shares);   
            assert!(burn == 99999_999999000, burn); // 99,999 SHARE

            test_scenario::return_to_sender(test, admincap);
            test_scenario::return_shared(global);
        };

    }

    fun borrow_vusd_high_utilization(test: &mut Scenario) {
        let (_, user_1, user_2, user_3) = users();

        next_tx(test, user_1);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);
            let pool = lending::get_mut_pool_for_testing<VUSD, IOTA>(&mut global);
            // Borrow 4000 VUSD with 100000 IOTA
            let vusd_coins = lending::borrow_non_entry(pool, mint<IOTA>(100000_000000000, ctx(test)), 4000_000000000, ctx(test));
            let burn = burn(vusd_coins);
            assert!(burn == 4000_000000000, burn); // 4000 VUSD

            let utilization_rate = lending::get_pool_utilization_rate<VUSD, IOTA>(&global);
            assert!(utilization_rate == 4000, utilization_rate); // 40%

            test_scenario::return_shared(global);
        };

        next_tx(test, user_2);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);
            let pool = lending::get_mut_pool_for_testing<VUSD, IOTA>(&mut global);
            // Borrow 4000 VUSD with 100000 IOTA
            let vusd_coins = lending::borrow_non_entry(pool, mint<IOTA>(100000_000000000, ctx(test)), 4000_000000000, ctx(test));
            let burn = burn(vusd_coins);
            assert!(burn == 4000_000000000, burn); // 4000 VUSD

            let utilization_rate = lending::get_pool_utilization_rate<VUSD, IOTA>(&global);
            assert!(utilization_rate == 8000, utilization_rate); // 80%

            test_scenario::return_shared(global);
        };

        next_tx(test, user_3);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);
            let pool = lending::get_mut_pool_for_testing<VUSD, IOTA>(&mut global);
            // Borrow 10 VUSD with 1000 IOTA
            let vusd_coins = lending::borrow_non_entry(pool, mint<IOTA>(1000_000000000, ctx(test)), 10_000000000, ctx(test));
            let burn = burn(vusd_coins);
            assert!(burn == 10_000000000, burn); // 100 VUSD
            test_scenario::return_shared(global);
        };

        // Fast-forward 300 days
        next_tx(test, user_1);
        {
            tx_context::increment_epoch_timestamp( ctx(test), 25920000000);
        };

        // Checking interest at slope1 rates when 40% utilization
        next_tx(test, user_2);
        {
            let global = test_scenario::take_shared<LendingGlobal>(test);
            // Retrieve current debt position
            let (_, interest_accrued, _) = lending::get_current_debt<VUSD, IOTA>( &global, user_2 , ctx(test) );
            // Assert interest accrued is 98.4 VUSD (~2.46% over 300 days with a 2.993% annual rate)
            assert!(interest_accrued == 98_400000000, interest_accrued); 
            test_scenario::return_shared(global);
        };

        // Checking interest at slope2 rates when 80% utilization
        next_tx(test, user_3);
        {
            let global = test_scenario::take_shared<LendingGlobal>(test);
            // Retrieve current debt position
            let (_, interest_accrued, _) = lending::get_current_debt<VUSD, IOTA>( &global, user_3 , ctx(test) );
            // Assert interest accrued is 0.41 VUSD (~4.1% over 300 days with a 4.98% annual rate)
            assert!(interest_accrued == 410000000, interest_accrued); 
            test_scenario::return_shared(global);
        };
    }

    fun withdraw_shares(test: &mut Scenario) {
        let (supplier, user, _, _) = users();

        // User borrows from the pool
        next_tx(test, user);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);
            let pool = lending::get_mut_pool_for_testing<VUSD, IOTA>(&mut global);
            // Borrow 50% from the pool
            let vusd_coins = lending::borrow_non_entry(pool, mint<IOTA>(100000_000000000, ctx(test)), 5000_000000000, ctx(test));
            burn(vusd_coins); 
            test_scenario::return_shared(global);
        };

        // Fast-forward by 300 days
        next_tx(test, user);
        {
            tx_context::increment_epoch_timestamp( ctx(test), 25920000000);
        };

        // Supplier withdraws 25% of their share from the pool
        next_tx(test, supplier);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);
            let pool = lending::get_mut_pool_for_testing<VUSD, IOTA>(&mut global);

            // Withdraw using 25% of share tokens (2,500 out of 10,000)
            let vusd_coins = lending::withdraw_non_entry(
                pool,
                mint<SHARE<VUSD, IOTA>>(2500_000000000, ctx(test)), // 2,500 SHARE 
                ctx(test)
            );

            let burn = burn(vusd_coins);
            // Expected to receive ~25.10 VUSD (includes interest gains)
            assert!(burn == 2510_250000000, burn);
    
            test_scenario::return_shared(global);
        };

    }

    fun borrow_vusd_with_iota_more(test: &mut Scenario) {
        let ( owner , user, _, _) = users();

        // Initial borrow: User borrows 100 VUSD against 3,000 IOTA collateral
        next_tx(test, user);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);
            let pool = lending::get_mut_pool_for_testing<VUSD, IOTA>(&mut global);

            burn(lending::borrow_non_entry(
                pool,
                mint<IOTA>(3000_000000000, ctx(test)), // Provide 3,000 IOTA as collateral
                100_000000000,  // Borrow 100 VUSD
                ctx(test)
            ));    

            test_scenario::return_shared(global);
        };

        // Admin manually updates oracle price for IOTA/VUSD to 0.15
        next_tx(test, owner);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);
            let mut admincap = test_scenario::take_from_sender<AdminCap>(test);

            // Set override price to 0.15 
            lending::update_override_price<VUSD, IOTA>( &mut global, &mut admincap, 1500 );

            test_scenario::return_to_sender(test, admincap);
            test_scenario::return_shared(global);
        };

        // Check updated health factor after price change
        next_tx(test, user);
        {
            let global = test_scenario::take_shared<LendingGlobal>(test); 
            let health_factor = lending::calculate_health_factor<VUSD, IOTA>( &global, user, ctx(test)); 
            // Health factor is 3.6
            assert!(health_factor == 36000, health_factor); 
            test_scenario::return_shared(global);
        };

        // Borrow more funds
        next_tx(test, user);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);
            let pool = lending::get_mut_pool_for_testing<VUSD, IOTA>(&mut global);

            // Borrow additional 100 VUSD using existing collateral
            let vusd_coins = lending::borrow_more_non_entry(pool, 100_000000000, ctx(test));
            let vusd_amount = burn(vusd_coins); 
            // Confirm borrow amount
            assert!(vusd_amount == 100_000000000, vusd_amount); 

            test_scenario::return_shared(global);
        };

        // Recheck health factor after borrowing more
        next_tx(test, user);
        {
            let global = test_scenario::take_shared<LendingGlobal>(test); 
            let new_health_factor = lending::calculate_health_factor<VUSD, IOTA>( &global, user, ctx(test)); 
            // Health factor drops to 1.8
            assert!(new_health_factor == 18000, new_health_factor); 
            test_scenario::return_shared(global);
        };

    }

    fun borrow_and_liquidate(test: &mut Scenario) {
        let ( owner , user, liquidator, _) = users();

        // Initial borrow: User borrows 100 VUSD against 3,000 IOTA collateral
        next_tx(test, user);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);
            let pool = lending::get_mut_pool_for_testing<VUSD, IOTA>(&mut global);

            burn(lending::borrow_non_entry(
                pool,
                mint<IOTA>(3000_000000000, ctx(test)), // Provide 3,000 IOTA as collateral
                100_000000000,  // Borrow 100 VUSD
                ctx(test)
            ));    

            test_scenario::return_shared(global);
        };

        // Admin manually updates oracle price for IOTA/VUSD to 0.03
        next_tx(test, owner);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);
            let mut admincap = test_scenario::take_from_sender<AdminCap>(test);

            // Set override price to simulate IOTA dropping to 0.03 VUSD
            lending::update_override_price<VUSD, IOTA>( &mut global, &mut admincap, 300 );

            test_scenario::return_to_sender(test, admincap);
            test_scenario::return_shared(global);
        };

        // Liquidator attempts to liquidate unhealthy position
        next_tx(test, liquidator);
        {
            let mut global = test_scenario::take_shared<LendingGlobal>(test);
            
            // Health factor should drop due to price change (below 1.0)
            let health_factor = lending::calculate_health_factor<VUSD, IOTA>( &global, user, ctx(test)); 
            assert!( health_factor ==  7200, health_factor); 

            // Position should be marked as liquidatable
            let is_liquidatable = lending::is_liquidatable<VUSD, IOTA>( &global, user, ctx(test));  
            assert!( is_liquidatable == true, 0); 

            // Perform liquidation using 50 VUSD to repay part of the user's debt
            lending::liquidate<VUSD, IOTA>(&mut global, user, mint<VUSD>(50_000000000, ctx(test)), true, ctx(test));
             
            test_scenario::return_shared(global);
        };

        // Verify that liquidator receives 1,750 IOTA collateral
        next_tx(test, liquidator);
        {  
            let iota_token = test_scenario::take_from_sender<Coin<IOTA>>(test); 

            // Liquidator receives 1,750 IOTA in return for 50 VUSD repayment
            assert!(coin::value(&(iota_token)) == 1750_000000000, 0); 
            test_scenario::return_to_sender( test, iota_token ); 
        };

    }


    // utilities
    fun scenario(): Scenario { test_scenario::begin(@0x1) }

    fun users(): (address, address, address, address) { (@0xBEEF, @0x1337, @0x2448, @0x3344) }

}