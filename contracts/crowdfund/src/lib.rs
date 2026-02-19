#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, String, Vec,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner,
    Token,
    Goal,
    Deadline,
    TotalRaised,
    Donor(Address),
    DonorList,
    Claimed,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct CampaignInfo {
    pub owner: Address,
    pub token: Address,
    pub goal: i128,
    pub deadline: u64,
    pub total_raised: i128,
    pub claimed: bool,
}

#[contract]
pub struct CrowdfundContract;

#[contractimpl]
impl CrowdfundContract {
    /// Initialize the crowdfunding campaign.
    pub fn initialize(
        env: Env,
        owner: Address,
        token: Address,
        goal: i128,
        deadline: u64,
    ) {
        if env.storage().instance().has(&DataKey::Owner) {
            panic!("already initialized");
        }

        owner.require_auth();

        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Goal, &goal);
        env.storage().instance().set(&DataKey::Deadline, &deadline);
        env.storage().instance().set(&DataKey::TotalRaised, &0i128);
        env.storage().instance().set(&DataKey::Claimed, &false);
        env.storage().instance().set(&DataKey::DonorList, &Vec::<Address>::new(&env));

        env.events().publish(
            (symbol_short!("init"),),
            (owner.clone(), goal, deadline),
        );
    }

    /// Donate to the campaign.
    pub fn donate(env: Env, donor: Address, amount: i128) {
        donor.require_auth();

        let deadline: u64 = env.storage().instance().get(&DataKey::Deadline).unwrap();
        if env.ledger().timestamp() > deadline {
            panic!("campaign has ended");
        }

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let contract_addr = env.current_contract_address();

        // Transfer tokens from donor to this contract
        token::Client::new(&env, &token_addr).transfer(&donor, &contract_addr, &amount);

        // Update total raised
        let mut total: i128 = env.storage().instance().get(&DataKey::TotalRaised).unwrap();
        total += amount;
        env.storage().instance().set(&DataKey::TotalRaised, &total);

        // Track donor amount
        let prev: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Donor(donor.clone()))
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::Donor(donor.clone()), &(prev + amount));

        // Add donor to list if new
        let mut donors: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::DonorList)
            .unwrap_or(Vec::new(&env));
        // Simple check — just add (duplicates possible in a minimal impl)
        donors.push_back(donor.clone());
        env.storage().instance().set(&DataKey::DonorList, &donors);

        env.events().publish(
            (symbol_short!("donate"),),
            (donor, amount, total),
        );
    }

    /// Owner claims funds if goal is reached after deadline.
    pub fn claim(env: Env) {
        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        owner.require_auth();

        let deadline: u64 = env.storage().instance().get(&DataKey::Deadline).unwrap();
        if env.ledger().timestamp() <= deadline {
            panic!("campaign is still active");
        }

        let total: i128 = env.storage().instance().get(&DataKey::TotalRaised).unwrap();
        let goal: i128 = env.storage().instance().get(&DataKey::Goal).unwrap();
        if total < goal {
            panic!("goal not reached");
        }

        let claimed: bool = env.storage().instance().get(&DataKey::Claimed).unwrap();
        if claimed {
            panic!("already claimed");
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token_addr).transfer(
            &env.current_contract_address(),
            &owner,
            &total,
        );

        env.storage().instance().set(&DataKey::Claimed, &true);

        env.events().publish((symbol_short!("claim"),), (owner, total));
    }

    /// Get campaign info.
    pub fn get_campaign(env: Env) -> CampaignInfo {
        CampaignInfo {
            owner: env.storage().instance().get(&DataKey::Owner).unwrap(),
            token: env.storage().instance().get(&DataKey::Token).unwrap(),
            goal: env.storage().instance().get(&DataKey::Goal).unwrap(),
            deadline: env.storage().instance().get(&DataKey::Deadline).unwrap(),
            total_raised: env.storage().instance().get(&DataKey::TotalRaised).unwrap(),
            claimed: env.storage().instance().get(&DataKey::Claimed).unwrap(),
        }
    }

    /// Get donation amount for a specific donor.
    pub fn get_donation(env: Env, donor: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Donor(donor))
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
