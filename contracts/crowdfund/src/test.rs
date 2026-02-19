#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{token, Address, Env};

fn setup_test() -> (Env, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    // Create a token contract for testing
    let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_addr = token_contract.address();
    let token_client = token::Client::new(&env, &token_addr);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_addr);

    // Mint tokens to the admin for testing
    token_admin_client.mint(&admin, &10_000_000);

    let contract_id = env.register_contract(None, CrowdfundContract);

    (env, contract_id, admin, token_addr)
}

#[test]
fn test_initialize() {
    let (env, contract_id, admin, token_addr) = setup_test();
    let client = CrowdfundContractClient::new(&env, &contract_id);

    client.initialize(&admin, &token_addr, &1_000_000, &1000);

    let info = client.get_campaign();
    assert_eq!(info.goal, 1_000_000);
    assert_eq!(info.total_raised, 0);
    assert!(!info.claimed);
}

#[test]
fn test_donate() {
    let (env, contract_id, admin, token_addr) = setup_test();
    let client = CrowdfundContractClient::new(&env, &contract_id);
    let token_client = token::Client::new(&env, &token_addr);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_addr);

    client.initialize(&admin, &token_addr, &1_000_000, &1000);

    let donor = Address::generate(&env);
    token_admin_client.mint(&donor, &500_000);

    client.donate(&donor, &100_000);

    let info = client.get_campaign();
    assert_eq!(info.total_raised, 100_000);
    assert_eq!(client.get_donation(&donor), 100_000);
}
