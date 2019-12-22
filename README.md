# Staking pool for Telegram Open Network 

## Problematics

Telegram Open Networks consensus is based on Byzantine Fault Tolerant Proof of Stake that involves sending certain amount of grams to take part in validators elections. Election result depends on stake, and there’s also significant amount of grams required. Running the validation node requires technical skills and extra hosting costs. So, being the part of TON network and get benefits staking is rather difficult story for common people. 

### Operational costs

Running TON node estimated at about US$200/month, so it is about US$2400/year. If we imagine 10% annual return, that means that minimum investment of US$24000 is required only to cover the hardware, and if the holder is not a computer savvy and requires an in-house person, who handles node operations, updates the software, for example paying the salary 1000$/month, that means US$150000 is required to cover fixed costs. To achieve 5% ROI US$300000 is required. If we imagine that 10% can be achieved only from the Grams at stake, it means US$600000 is required to earn US$15000 annually, that is 2.5% ROI. So individual staking becomes not an attractive option, however having US$5.000.000 under management, when only half is at stake making 10% annual ROI, 5% of annual return is looking quite real. So amount of Grams under management is the most important part of TON staking. 

### Security

Security is another corner stone. Any kind of crypto related operations require proper keys management. Any centralized pool is potentially vulnerable to hackers attacks and fraudulent operator threat. 

## Solution 

Built on 100% mutual mistrust principle, staking pool allows grams holder, who want to take a part in validation process by providing Grams, to be a part of liquidity pool operated by a pool owner, who doesn't actually have access to Grams, except the predefined incentive fee, paid periodically depending on performance. 
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

### Folders 

Staking pool solution build on top of TON original code and utilizes the most of performance and reliability of its stack. I did my best to separate it from original parts to keep updating process smooth and convenient, so all files are kept within [staking](/staking) folder. 

- [smartcont](/staking/smartcont) smart contracts
- [staking-smc-envelope](/staking/staking-smc-envelope) smc envelopes
- [staking](/staking/staking) Staking-CLI and JSON RPC Server
- [frontend](/staking/test) Frontend
- [test](/staking/test) Offline and online tests


### Smart contracts

To assure subscribers, that no changes are possible in future, I implemented linked smart contract structure, so inititialy `pool` is deployed with predefined number of `nominator` smart contract addresses, when each `nominator` holds an address of the `pool`. Such deployment scheme allows linking contracts between each other even before deployment and avoiding the situation, when owner replaces any contract with fraudulent or vulnerable one, and prevents from getting an unauthorized access to subscribers Grams. 

All `staking pool` and `nominator` smart contracts do not work with external messages to avoid the situation, when draining funds is possible because of private key leak.  

#### Pool smart contract

`Pool` is accounting and management smart contract that is responsible for interacting with users, collecting  transfers, calculating rewards, transferring funds between `pool` and `nominators`, sending orders to make stakes.

#### Nominator smart contract

`Nominator` interacts with `pool` and `elector` smart contract. It’s prime function is making stakes and sending report about balance and current stake to `pool` smart contract. Grams from this contract can be transferred to `elector` and `pool` smart contracts only.  


## Entities

*Subscriber* - the person who send Grams to pool to get benefits from staking

*Owner* - the account operating the pool

*Assets Under Management (AUM)* - total number of grams operated by pool

*Units* - the shares in pool, owned by subscriber.

*Unit Rate* - the number of Grams in one unit. 

*Subscription entry* - the record stating the number of grams sent to pool in certain period. 

*Start period* - the period when subscription was open

*End period* - the period when subscription was redeemed and withdrawn

## Processes and formulas

*Subscription* - when subscriber transfers Grams to pool smart contract, new subscription entry is created. It contains the information about amount of grams and number of current period. Subscriber can add more grams to subscription entry until new period is started, otherwise new subscription entry will be created. 

*Redemption* - if subscriber wants to get Grams back, he sends redemption order. The amount of Grams is calculated by multiplying number of units, calculated by dividing number of grams initially sent to rate in subscription period, and multiplying this number to rate of the most recent closed period. 

*Closing the period*  - the process of recalculation AUM, number of units and unit price. 
Smart contract needs to fetch balances and stakes from all nominators, subtract withdrawn units, calculate incentive fee and determine new unit rate, so the number of units for new subscriptions will be calculated and new redemptions will be processed according to that rate. 

*Incentive fee* - owners reward is calculated as a percent from growing the rate multiplied to managed funds in current period that is equal to initial AUM. New subscription is issued for the owner in the new period according the the new rate calculated by dividing AUM subtracted by incentive fee to number of previous subscribers units, so technically this process equally affects current subscribers. Owner can issue redemption order anytime or keep funds in pool to get benefits as well. 


## Interface 

The main aim was in achievement smooth interaction process with smart contracts, especially for subscribers. So, I implemented react frontend that represents data of the pool contract through json-rpc server and allows users to deposit and withdraw funds from any TON wallet by the simple transfer. 

To issue new subscription or add funds to the current one, the subscriber transfers amount of grams he wants to put at stake without any text. 

To redeem subscription subscriber sends simple transfer of minimum amount (0.1 Gramm) with a text comment containing the subscription number (for example, R77 to redeem subscription #77 that was issued for the same address)


### User interface

User interface is implemented as webpage built with React.js interacting with JSON RPC server, that provides all the information from smart contracts to end user. 

Subscriptions and redemptions handled in `pool` smart contract by analyzing transfers received. 


#### Overall performance

Provides information and visualizes pool historical performance. 

![](/staking/img/screenshot9.png)

*Demo data*

#### Current subscriptions

Shows current subscriptions for specified address. Subscription and Redemption dialogs are accessible on this page. 

![](/staking/img/screenshot2.png)

#### Subscription 

Subscriber sends amount of grams to Smart contract, so new subscription is issued. If there's a subscription in the current period, grams are added to this entry.

![](/staking/img/screenshot6.png)


#### Redemption

Redemption procedure can be called by sending subscription number in text field of text message (UTF-8 encoding only, tested with Android TON Wallet) 
![](/staking/img/screenshot8.png)

#### Staking Pool

Shows detailed information about pool performance by periods including AUM, total number of units, unit rate, subscriptions and redemptions within each period. 

![](/staking/img/screenshot3.png)

#### Nominators

Show the information about current balances and stakes of `nominator` smart contracts connected to pool.

![](/staking/img/screenshot4.png)


### Owner's console

Owner's console is based on tonlib_cli utility so it gets all the benefits from native code, key management and achieves the best flexibility level for future TON updates. 

It operates three types of smart contracts : WalletV3, Pool and Nominator, allows simple deployment and interaction for the pool owner. Multisig support must be added later. 


Console has additional commands implemented:

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

*I will continue developing owners console, however all network interaction processes are covered in current version*


## Road map

Please excuse rather raw level of solution, but it was physically impossible for me to implement all the parts of this rather complicated project on the edge of blockchain and finances in two weeks, and make perfect product out of it. I didn't pay too much attention to the details, however I made strong Proof-of-concept covering all basic aspects, removing major concerns, and assuring this project can be successfully elevated to the production level. I guess it will take me couple more month make it real, especially if next round of competition will be connected with running validator, so I will cover TODOs related to staking and validation.


### DONE

- [X] Accounting on smart contract 
- [X] Interaction with elector smart contract, that allows calculating current stake and include it in AUM
- [X] Secured deployment scheme, when contracts are linked between each other before deployment
- [X] Secured funds transfer scheme, when Grams can be transferred between trusted smart contracts only, subscriber can redeem Grams anytime, Owner doesn't have an access to the Grams
- [X] Owner's Console that allows working with new types smart contracts without affecting actual TON code and is built on the top of its stack
- [X] JSON RPC Server, that is written in C++ and built on top of TON stack, that fetches all the information from new smart contracts
- [X] Simple web user interface, that interacts with JSON RPC server and shows all the information in the convenient way
- [X] Subscription and redemption from any TON wallet, with or without QR codes

### TODO

- [ ] Topping up smart contracts from owner or other wallets without issuing subscription
- [ ] Changing owner's fee within predefined limits
- [ ] Changing minimum subscription amount
- [ ] Changing owner ceremony
- [ ] Penalty for fast redemption
- [ ] Handling redemption requests when pool smart contract doesn't have enough funds (nominators should return funds to pool in this case)
- [ ] Add operator role, so stakes can be handled by third party
- [ ] Support Multisig in console (to use multisig wallet as an owner wallet for better convenience)
- [ ] Emergency shutdown (to handle code updates or the situation when keys of the owners wallet are compromised, technically means returnign all subscriptions and starting new structure)
- [ ] Redeemed subscription entries deletion from `pool` smart contract storage
- [ ] Add election support to owner's console
- [ ] Add staking management to owner's console
- [ ] Add interaction with Nodes to owner's console
- [ ] Implement automatic election management maximizing profits


## Building

### Additional dependencies

To run `staking-server` additional `cinemast` libraries and header files are required. I didn't include Cinemast JSON-RPC in the building. 

Please follow the instruction at https://github.com/cinemast/libjson-rpc-cpp to install additional dependencies.


### Staking utilities 


Project is a fork of original https://github.com/ton-blockchain/ton project and can be built the same way:

```
mkdir build
cd build
CMAKE ..
MAKE
```

'build/staking' folder will contain following files:

- staking-server 
- staking-cli 


`staking-server` starts with -C and -P parameters, where C is a path to lite-client config file and P is the address of pool smart contract. Server is listening on 6310 port. Please make sure read-write permissions are given to the folder containing server. 

### Deploying smart contracts 

Smart contracts can be deployed from `staking-cli` by running:
```
getaddres #0 owner
getaddres #0 pool
getaddress #0 nominator 1
getaddress #0 nominator 2
```
funding contracts and running:
```
init #0 owner
init #0 pool
init #0 nominator 1
init #0 nominator 2
```
Where #0 is the key id from your key store. 

### Frontend

Frontend can be built from staking/frontend folder by running:
```
yarn build
```

Development environment can be run by:
```
yarn start
```


### Tests 

There was not enough time to test all parts of the solution properly, 
however the batch of online and offline tests written in C++ on top of tonlib_api are implemented. 
`test` folder contains test sources. Executable files are generated while building, and are located in the `build` folder along with other tests. 

External audit of this solution is extremely wanted before the launch. 

### Demo

Please check user interface at:

http://62.210.101.33/

Demonstational `pool` smart contract is deployed at:

EQCg+1FCGMirisq6Hu21Yzhr+5FrI03XJ3UAhavtOyvUczGY


Please use following account to see subscriptions: 

EQDbquWDvZ+bRNyROGf6SrMsUMtnVLVXDVmMMztF9siuganN


## Conculsion

Staking becomes new mining for modern blockchains. Many people are getting involved in staking, and TON can be an ideal extension to their crypto porfolio. 

I really hope Staking Pool project will make positive effect by attracting more attention to TON technology and will launched along with TON Mainnet, however launching this project is not just a question of technology, but building community around this, so any kind of appreciation from TON team wouldn't be overestimated!

Sincerely yours, Eugene Koinov 

[@koinoff](https://t.me/koinoff)

[koinoff@gmail.com](mailto:koinoff@gmail.com)






