

module omneon::lending_tests {

    use iota::coin::{ Self, Coin, mint_for_testing as mint, burn_for_testing as burn}; 
    use iota::test_scenario::{Self, Scenario, next_tx, ctx, end};
    use iota::iota::IOTA;
    use iota::tx_context::{Self};

    use omneon::lending::{Self, LendingGlobal, AdminCap};

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

    fun borrow_vusd_with_iota(test: &mut Scenario) {
        let (_, user) = users();

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
        let (_, user) = users();

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
        let (owner, _) = users();

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


    // utilities
    fun scenario(): Scenario { test_scenario::begin(@0x1) }

    fun users(): (address, address) { (@0xBEEF, @0x1337) }

}