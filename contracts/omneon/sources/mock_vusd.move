

// Mock VUSD for testing

module omneon::mock_vusd {

    use iota::object::{ Self, UID }; 
    use std::option;
    use iota::coin::{Self, Coin };
    use iota::balance::{ Self, Supply };
    use iota::transfer;
    use iota::tx_context::{ TxContext};

    public struct MOCK_VUSD has drop {}

    public struct VUSDGlobal has key {
        id: UID,
        supply: Supply<MOCK_VUSD>
    }

    fun init(witness: MOCK_VUSD, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency<MOCK_VUSD>(witness, 9, b"MOCK VUSD TOKEN", b"MOCK-VUSD", b"", option::none(), ctx);
        transfer::public_freeze_object(metadata);
        
        transfer::share_object(VUSDGlobal {
            id: object::new(ctx),
            supply: coin::treasury_into_supply<MOCK_VUSD>(treasury_cap)
        })
    }

    public entry fun mint(
        global: &mut VUSDGlobal, amount: u64, recipient: address, ctx: &mut TxContext
    ) {
        let minted_balance = balance::increase_supply<MOCK_VUSD>(&mut global.supply, amount);
        transfer::public_transfer(coin::from_balance(minted_balance, ctx), recipient);
    }

    public entry fun burn(global: &mut VUSDGlobal, coin: Coin<MOCK_VUSD>) {
        balance::decrease_supply(&mut global.supply, coin::into_balance(coin));
    }

    #[test_only]
    /// Wrapper of module initializer for testing
    public fun test_init(ctx: &mut TxContext) {
        init(MOCK_VUSD {}, ctx)
    }

}
