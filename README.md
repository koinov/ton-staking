# Staking pool for Telegram Open Network 

## Problematics

Telegram Open Networks consensus is based on Byzantine Fault Tolerant Proof of Stake that involves sending certain amount of grams to take part in validators elections. Election result depends on size of stake and there’s also the minimum amount of grams required. Running the validation node requires technical skills and extra hosting costs. So, being the part of TON network and get benefits staking is rather difficult story for common people. 

### Operational costs

Running TON node estimated at about US$200/ month, so it is about US$2400/year. If we imagine 10% annual return, that means that minimum investment of US$24000 is required only to cover hardware, and if the person is not a computer savvy and requires inhouse person who handles node operations, updates the software, for example paying the salary 1000$/month, that means US$150000 is required to cover fixed costs. To achieve 5% ROI US$300000 is required. If we imagine that 10% can be achieved only from the Grams at stake, it means US$600000 is required to yearn US$15000 year, that is 2.5% ROI. So individual staking becomes not an attractive option, however having US$5.000.000 under management, when only half is at stake making 10% annual ROI, 5% of annual return is looking quite real. So amount of Grams under management is the most important part of TON staking. 

### Security

Security is another concern. Any kind of crypto related operations require proper keys management. Centralized pool is potentially vulnerable to hackers attacks and fraudulent operator threat. 

## Solution 

Built on 100% mutual mistrust principle staking pool that allows grams holder, who want to take a part in validation process by providing Grams, to bea part of liquidity pool operated byt pool owner, who doesn't actually have access to Grams, except the predefined incentive fee, paid periodically depending on performance. 
Pool operates multiple nodes to achieve best results, distributing stakes among running nodes.  

## Benefits

Community gets the way, that allows being the part of TON blockchain and get benefits from this disruptive technology. 

Above mentioned process should have positive effect on demand for Gram token. 

TON gets more validators that improves its decentralization. 

Pool is a great sample of 100% DeFi, one of the most exciting application for blockchain technology. 


## Assumptions

We do not consider staking pool as any kind of mutual investment facility but technical solution that improves quality of TON network by running additional validators and providing Grams in return. Reward in Grams in this case should not be considered as any kind of speculative instrument but a required option for running other DAPPs developed by participants. 

## Implementation

### Architecture

Staking pool solution consist of a number of modules:
1. staking-pool smart-contract (func) + smc-envelope (c++)
2. nominator smart contract (func) + smc-envelope (c++)
3. owner’s smc-envelope for wallet v3 (c++)
4. console application (c++)
5. frontend (react, based on free Material Dashboard theme by Creative Tim)
6. json-rpc server for providing data to frontend (c++)

### Files structure 

Staking pool solution build on TON original code to utilize the most of performance and reliability of its code. We did our best to separate it from original parts to keep updating process smooth and convenient, so all files are kept withing [/staking]() folder. 

- [smartcont](/staking/smartcont) smart contracts
- [staking-smc-envelope](/staking/staking-smc-envelope) smc envelopes
- [staking](/staking/staking) Staking-CLI and JSON RPC Server
- [frontend](/staking/test) Frontend
- [test](/staking/test) Offline and online tests


### Smart contracts

To assure subscribers, that no additioal changes are possible, we implement predeployed smart contract structure, so intitially pool is deployed with predefined number of nominators, when each nominator holds an address of the pool. Such deployemnt scheme allows to link contracts between each other and to avoid the situation when owner replaces any contract with the one, that allows get an access to subscribers Grams. 

#### Pool smart contract

Accounting smart contract is responsible for interacting with users, collecting  transfers, calculating rewards, transferring funds between pool and nominators, sending orders to make stakes.

#### Nominator smart contract.

Nominator interacts with pool and elector smart contract. It’s prime function is making stakes and sending balance and current stake to pool smart contract. Grams from this contract can be transferred to elector and pool smart contracts only.  


## Entities

*Subscriber* - the person who send Grams to pool to get benefits from staking

*Owner* - the account operating the pool

*Assets Under Management (AUM)* - total number of grams operated by pool

*Units* - the share of 

*Unit Rate* - the number of Grams in one unit. 

*Subscription entry* - the record stating the number of grams sent to pool in certain period. 

*Start period* - the period when subscription was open

*End period* - the period when subscription was redeemed and withdrawn

## Processes and formulas

*Subscription* - when subscriber transfers Grams to pool smart contract, new subscription entry is created. It contains the information about amount of grams and number of current period. Subscriber can add more grams to subscription entry until new period is started, otherwise new subscription entry will be created. 

*Redemption* - if subscriber wants to get Grams back, he sends redemption order. The amount of Grams is calculated by multiplying number of units, calculated by dividing number of grams initially sent to rate in subscription period, and multiplying this number to rate of the most recent closed period. 

*Closing the period*  - the process of recalculation AUM, number of units and unit price. 
Smart contract need to fetch balances and stakes from all nominators, subtract withdrawn units, calculate incentive fee and determine new unit rate so the number of nits for new subscriptions will be calculated and new redemptions will be processed according to that rate. 

*Incentive fee* - owners reward is calculated as a percent from growing the rate multiplied to managed funds in current period that is equal to initial AUM. New subscription is issued for the owner in the new period according the the new rate calculated by dividing AUM subtracted by incentive fee to number of previous subscribers units so technically this process affects only current subscribers. OWner can issue redemption order anytime or keep funds in pool to get benefits as well. 


## Interface 

The main aim was in achievement smooth interaction process with smart contracts, especially for subscribers. So, we implemented react frontend that represents data of the pool contract through json-rpc server and allows users to deposit and withdraw funds from any TON wallet by the simple transfer. 

To issue new subscription or add funds to the current one, subscriber transfers amount if grams he wants to put at stake without any text. 

To redeem subscription subscriber sends simple transfer of minimum amount (0.1 gramm) with a text comment containing the subscription number (R77 to redeem subscription #77)


### User interface


### Owner's console

Owners console is based on tonlib_cli utility to get all the benefits from native code, key management and achieves the best flexibility level for future TON updates. 

It operates four types of smart contracts : WalletV3, Pool and Nominator, allows simple deployment and interaction for the pool owner. 

Console has additional commands implementes:

#### address <key_id> <smc_type> [<wallet_id>]

Shows the address of smart contract

```
key_id - private key in the key storage
smc_type - type of smart contracts. can be wallet/owner/pool/nominator
wallet_id - oprional wallet_id parameter for wallet and nominator contracts

```

#### init <key_id> <smc_type> [<wallet_id>]

Sends extenal message for deploying smart contract 

```
key_id - private key in the key storage
smc_type - type of smart contracts. can be wallet/owner/pool/nominator
wallet_id - oprional wallet_id parameter for wallet and nominator contracts
```

#### pool <key_id> <command> [<...params>]

Sends pool command throw owners wallet

```
key_id - private key in the key storage
command - sns (set nominator status) / pr ( close period ) / ...
```


## Road map

Please understand, this was physically impossible for me to implement all the part of this project in two weeks and make the product out of it, and pay toomuch attention to the details, however I made strong Proof-of-concept covering all basic aspects, removing major concerns, and make sure this project can be successfully elevated to to production level.


### DONE

- [X] Accounting on smart contract 
- [X] Interaction with elector smart contract that allows getting current stake
- [X] Secured deployment scheme when contracts are linked between each other before deployment
- [X] Secured funds transfer scheme when Grams can be transferred between trusted smart contracts, subscriber can redeem Grams anytime, Owner dont's have an access to the funds
- [X] Console that allows working with new smart contracts without affecting actual TON code and built on the top of its stack
- [X] JSON RPC Server built on top of TON stack, that easily reads all the infromation required from new smart contracts
- [X] Simple web user interface that interacts with JSON RPC server and shows all the information in the convenient way
- [X] Subscription and redemption from any TON wallet, with or without QR codes

### TODO

- [ ] Topping up smart contracts from owner's of other wallets without issuing subscription
- [ ] Changing owner's fee withing predefined limits
- [ ] Changing minimum subscription amount
- [ ] Changing owner procedure
- [ ] Handling redemption requests when pool smart contract doesn't have enough funds (nominators should return funds to pool in this case)
- [ ] Add operator role, so stakes can be handled by third party
- [ ] Multisig console (to use wallet as an owner wallet for better convenience)
- [ ] Add election support to owner's console
- [ ] Add staking management to owner's console
- [ ] Add interaction with Nodes to owner's console
- [ ] Implement automatic election management maximizing profits


## Building

Project is built as TON blockchain. 
```
mkdir build
cd build
CMAKE ..
MAKE
```

'staking' folder will contain following files:
staking-server 
staking-cli 

Smark contracts can be deployed from 'staking-cli' by running:
getaddres owner
getaddres pool
getaddress nominator 1
getaddress nominator 2


Frontend can be built from staking/frontend folder by running
```
yarn start
```

## Conculsion

Staking becomes new mining for modern blockchains. Many people are gettign involved in staking and TON cen be an ideal extension to their crypto porfolios. 

I really hope Staking Pool project will make positiove effect by attracting more attention to TON technology and will launched along with TON mainnet however launching this project is not just a question of technology, but building community arround this, so any kind of appreciation from TON team wouldn't be overestimated!



