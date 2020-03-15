/*
    This file is part of TON Blockchain Library.

    TON Blockchain Library is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    TON Blockchain Library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with TON Blockchain Library.  If not, see <http://www.gnu.org/licenses/>.

    Copyright 2017-2019 Telegram Systems LLP
*/
#include "vm/dict.h"
#include "vm/debugops.h"
#include "common/bigint.hpp"

#include "Ed25519.h"

#include "block/block.h"

#include "fift/Fift.h"
#include "fift/words.h"
#include "fift/utils.h"

#include "smc-envelope/GenericAccount.h"
#include "smc-envelope/SmartContractCode.h"
#include "smc-envelope/TestGiver.h"
#include "smc-envelope/TestWallet.h"
#include "smc-envelope/Wallet.h"
#include "smc-envelope/HighloadWallet.h"
#include "staking-smc-envelope/StakingSmartContract.h"
#include "staking-smc-envelope/StakingPool.h"
#include "staking-smc-envelope/Nominator.h"
#include "staking-smc-envelope/WalletV3.h"

#include "td/utils/base64.h"
#include "td/utils/crypto.h"
#include "td/utils/Random.h"
#include "td/utils/tests.h"
#include "td/utils/ScopeGuard.h"
#include "td/utils/StringBuilder.h"
#include "td/utils/Timer.h"
#include "td/utils/PathView.h"
#include "td/utils/filesystem.h"
#include "td/utils/port/path.h"

#include <bitset>
#include <set>
#include <tuple>

std::string current_dir() {
  return td::PathView(td::realpath(__FILE__).move_as_ok()).parent_dir().str();
}




TEST(Smartcon, Simple) {

  auto private_key = td::Ed25519::generate_private_key().move_as_ok();
  auto public_key = private_key.get_public_key().move_as_ok();

  auto code = ton::WalletV3::get_init_code();
  auto data = ton::WalletV3::get_init_data(public_key, 1);

  auto init_state = ton::WalletV3::get_init_state(public_key, 1);
  auto init_message = ton::WalletV3::get_init_message(private_key, 1);
  auto owner_address = ton::GenericAccount::get_address(0, init_state);
  LOG(INFO) << "Address: " << owner_address.rserialize();


  auto init_state_user_1 = ton::WalletV3::get_init_state(public_key, 1001);
  auto init_state_user_2 = ton::WalletV3::get_init_state(public_key, 1002);

  auto owner_wallet = ton::WalletV3::create(ton::WalletV3::State{code, data} );

  CHECK(owner_wallet.write().send_external_message(init_message).code == 0);


  auto ans = owner_wallet->run_get_method("seqno");
  auto seqno = ans.stack.write().pop_smallint_range(1000000000);
  LOG(INFO) << "SEQNO: " << seqno;
  ASSERT_EQ(1, seqno);


  auto pool_code = ton::StakingPool::get_init_code();
  LOG(INFO) << "POOL INIT CODE";
  auto pool_data = ton::StakingPool::get_init_data(1000, 10000, 500, 500, owner_address );
  LOG(INFO) << "POOL INIT DATA: " << td::base64_encode(td::BufferSlice(vm::std_boc_serialize(pool_data).move_as_ok()).as_slice());

  auto pool = ton::StakingPool::create( pool_data  );

  std::vector<block::StdAddress> nominators;

  auto init_state_nominator_1 = ton::Nominator::get_init_state(pool->get_address(0), 1);
  auto init_state_nominator_2 = ton::Nominator::get_init_state(pool->get_address(0), 2);



  auto nominator_address_1 = ton::GenericAccount::get_address(0, init_state_nominator_1);
  auto nominator_address_2 = ton::GenericAccount::get_address(0, init_state_nominator_2);

  auto user_address_1 = ton::GenericAccount::get_address(0, init_state_user_1);
  auto user_address_2 = ton::GenericAccount::get_address(0, init_state_user_2);

  nominators.push_back(nominator_address_1);
  nominators.push_back(nominator_address_2);

  auto pool_init_message = ton::StakingPool::get_init_message(pool->get_address(0), &nominators);
  LOG(INFO) << "POOL INIT MESSAGE: " << td::base64_encode(td::BufferSlice(vm::std_boc_serialize(pool_init_message).move_as_ok()).as_slice());

  LOG(INFO) << "POOL INIT CODE / DATA SIZE: " << pool->code_size() << " " << pool->data_size();

  CHECK(pool.write().send_external_message(pool_init_message).code == 0);

  ans = pool->run_get_method("get_current_period");
  auto current_period = ans.stack.write().pop_smallint_range(1000000000);
  LOG(INFO) << "POOL : Current period: " << current_period;
  ASSERT_EQ(1, current_period);

  ans = pool->run_get_method("get_subscriptions_count");
  auto subscriptions_count = ans.stack.write().pop_smallint_range(1000000000);
  LOG(INFO) << "POOL : Subscriptions count: " << subscriptions_count;
  ASSERT_EQ(1, subscriptions_count);

  ans = pool->run_get_method("get_subscription", {td::make_refint(subscriptions_count), td::make_refint(0)});
  auto subscription_address = ans.stack.write().pop_smallint_range(1000000000);
  LOG(INFO) << "POOL : Subscription 1 address: " << subscription_address;
  ASSERT_EQ(1, subscription_address);

  auto subscription = pool->get_subscription(0, 1);

  LOG(INFO) << "POOL : Subscription 1 address: " << subscription.address->to_hex_string(true) << " grams :" << subscription.grams;

  auto nominator = pool->get_nominator(td::BigInt256(0), 1);

  LOG(INFO) << "POOL : Nominator 1 address: " << nominator.address->to_hex_string(true) << " status :" << nominator.status;

  pool.write().test_send_internal_message( vm::CellBuilder().store_long(0, 32).finalize(), 11111111, user_address_1);

  ans = pool->run_get_method("get_subscriptions_count");
  subscriptions_count = ans.stack.write().pop_smallint_range(1000000000);
  LOG(INFO) << "POOL : Subscriptions count: " << subscriptions_count;
  ASSERT_EQ(2, subscriptions_count);


  subscription = pool->get_subscription(2, 0);
  LOG(INFO) << "POOL : Subscription 2 address: " << subscription.address->to_hex_string(true) << " grams :" << subscription.grams;
  ASSERT_EQ(11110111, subscription.grams);

  ans = pool.write().test_send_internal_message( ton::StakingPool::set_nominator_status_request(nominator_address_1, 1, 0), 100000, owner_address);
  // CHECK(ans.success);

  nominator = pool->get_nominator(td::BigInt256(0), 1);
  LOG(INFO) << "POOL : Nominator 1 address: " << nominator.address->to_hex_string(true) << " status :" << nominator.status;

  // ASSERT_EQ(1, nominator.status);

  auto performance0 = pool->get_performance(0, 0);
  auto performance1 = pool->get_performance(1, 0);
  LOG(INFO) << "POOL : Performance "  << " rate: " << performance0.rate << " aum: " << performance0.aum << " units: " << performance0.units << " deposits: " << performance0.deposits << " withdrawals:" << performance0.withdrawals;
  LOG(INFO) << "POOL : Performance "  << " rate: " << performance1.rate << " aum: " << performance1.aum << " units: " << performance1.units << " deposits: " << performance1.deposits << " withdrawals:" << performance1.withdrawals;


  ans = pool.write().test_send_internal_message( ton::StakingPool::new_period_request(0), 100000, owner_address);
  CHECK(ans.success);

  performance0 = pool->get_performance(0, 0);
  performance1 = pool->get_performance(1, 0);
  auto performance2 = pool->get_performance(2, 0);
  LOG(INFO) << "POOL : Performance #0"  << " rate: " << performance0.rate << " aum: " << performance0.aum << " units: " << performance0.units << " deposits: " << performance0.deposits << " withdrawals:" << performance0.withdrawals;
  LOG(INFO) << "POOL : Performance #1"  << " rate: " << performance1.rate << " aum: " << performance1.aum << " units: " << performance1.units << " deposits: " << performance1.deposits << " withdrawals:" << performance1.withdrawals;
  LOG(INFO) << "POOL : Performance #2"  << " rate: " << performance2.rate << " aum: " << performance2.aum << " units: " << performance2.units << " deposits: " << performance2.deposits << " withdrawals:" << performance2.withdrawals;

  ans = pool.write().test_send_internal_message( ton::StakingPool::redemption_request(2, 0), 100000, user_address_1);
  CHECK(ans.success);

  subscription = pool->get_subscription(2, 0);

  ASSERT_EQ(2, subscription.end_period);
  ASSERT_EQ(2, subscription.status);

  performance2 = pool->get_performance(2, 0);
  LOG(INFO) << "POOL : Subscription 2 address: " << subscription.address->to_hex_string(true) << " grams:" << subscription.grams <<
      " start: " << subscription.start_period << " end: " << subscription.end_period << " status: " << subscription.status;

  LOG(INFO) << "POOL : Performance #2"  << " rate: " << performance2.rate << " aum: " << performance2.aum << " units: " << performance2.units << " deposits: " << performance2.deposits << " withdrawals:" << performance2.withdrawals;


  pool.write().test_send_internal_message( vm::CellBuilder().store_long(0, 32).finalize(), 222222222, user_address_2);

  ans = pool->run_get_method("get_subscriptions_count");
  subscriptions_count = ans.stack.write().pop_smallint_range(1000000000);
  LOG(INFO) << "POOL : Subscriptions count: " << subscriptions_count;
  ASSERT_EQ(3, subscriptions_count);

  ans = pool.write().test_send_internal_message( ton::StakingPool::redemption_request("R3"), 100000, user_address_2);
  CHECK(ans.success);

  subscription = pool->get_subscription(3, 0);

  ASSERT_EQ(3, subscription.id);
  ASSERT_EQ(0, subscription.end_period);
  ASSERT_EQ(0, subscription.status);


  performance2 = pool->get_performance(2, 0);
  LOG(INFO) << "POOL : Subscription 3 address: " << subscription.address->to_hex_string(true) << " grams:" << subscription.grams <<
            " start: " << subscription.start_period << " end: " << subscription.end_period << " status: " << subscription.status;

  LOG(INFO) << "POOL : Performance #2"  << " rate: " << performance2.rate << " aum: " << performance2.aum << " units: " << performance2.units << " deposits: " << performance2.deposits << " withdrawals:" << performance2.withdrawals;


  auto subscription_period = pool->get_subscribers_subscription(user_address_2, 0, 1);
  LOG(INFO) << "POOL : Subscription "  << " period: " << subscription_period.period << " subscription id: " << subscription_period.subscription;

 // auto subscriber_subscriptions = pool->get_subscribers_subscriptions(user_address_2);
 // LOG(INFO) << "POOL : Subscription "  << " period: " << subscription_period.period << " subscription id: " << subscription_period.subscription;


}
/*
namespace std {  // ouch
bool operator<(const ton::MultisigWallet::Mask& a, const ton::MultisigWallet::Mask& b) {
  for (size_t i = 0; i < a.size(); i++) {
    if (a[i] != b[i]) {
      return a[i] < b[i];
    }
  }
  return false;
}

}  // namespace std
 */
/*
TEST(Smartcon, Multisig) {
  auto ms_lib = ton::MultisigWallet::create();

  int n = 100;
  int k = 99;
  td::uint32 wallet_id = std::numeric_limits<td::uint32>::max() - 3;
  std::vector<td::Ed25519::PrivateKey> keys;
  for (int i = 0; i < n; i++) {
    keys.push_back(td::Ed25519::generate_private_key().move_as_ok());
  }
  auto init_state = ms_lib->create_init_data(
      wallet_id, td::transform(keys, [](auto& key) { return key.get_public_key().ok().as_octet_string(); }), k);
  auto ms = ton::MultisigWallet::create(init_state);

  td::uint64 query_id = 123 | ((100 * 60ull) << 32);
  ton::MultisigWallet::QueryBuilder qb(wallet_id, query_id, vm::CellBuilder().finalize());
  // first empty query (init)
  CHECK(ms.write().send_external_message(vm::CellBuilder().finalize()).code == 0);
  // first empty query
  CHECK(ms.write().send_external_message(vm::CellBuilder().finalize()).code > 0);

  for (int i = 0; i < 10; i++) {
    auto query = qb.create(i, keys[i]);
    auto ans = ms.write().send_external_message(query);
    LOG(INFO) << "CODE: " << ans.code;
    LOG(INFO) << "GAS: " << ans.gas_used;
  }
  for (int i = 0; i + 1 < 50; i++) {
    qb.sign(i, keys[i]);
  }
  auto query = qb.create(49, keys[49]);

  CHECK(ms->get_n_k() == std::make_pair(n, k));
  auto ans = ms.write().send_external_message(query);
  LOG(INFO) << "CODE: " << ans.code;
  LOG(INFO) << "GAS: " << ans.gas_used;
  CHECK(ans.success);
  ASSERT_EQ(0, ms->processed(query_id));
  CHECK(ms.write().send_external_message(query).code > 0);
  ASSERT_EQ(0, ms->processed(query_id));

  {
    ton::MultisigWallet::QueryBuilder qb(wallet_id, query_id, vm::CellBuilder().finalize());
    for (int i = 50; i + 1 < 100; i++) {
      qb.sign(i, keys[i]);
    }
    query = qb.create(99, keys[99]);
  }

  ans = ms.write().send_external_message(query);
  LOG(INFO) << "CODE: " << ans.code;
  LOG(INFO) << "GAS: " << ans.gas_used;
  ASSERT_EQ(-1, ms->processed(query_id));
}

TEST(Smartcont, MultisigStress) {
  int n = 10;
  int k = 5;
  td::uint32 wallet_id = std::numeric_limits<td::uint32>::max() - 3;

  std::vector<td::Ed25519::PrivateKey> keys;
  for (int i = 0; i < n; i++) {
    keys.push_back(td::Ed25519::generate_private_key().move_as_ok());
  }
  auto public_keys = td::transform(keys, [](auto& key) { return key.get_public_key().ok().as_octet_string(); });
  auto ms_lib = ton::MultisigWallet::create();
  auto init_state_old =
      ms_lib->create_init_data_fast(wallet_id, td::transform(public_keys, [](auto& key) { return key.copy(); }), k);
  auto init_state =
      ms_lib->create_init_data(wallet_id, td::transform(public_keys, [](auto& key) { return key.copy(); }), k);
  CHECK(init_state_old->get_hash() == init_state->get_hash());
  auto ms = ton::MultisigWallet::create(init_state);
  CHECK(ms->get_public_keys() == public_keys);

  td::int32 now = 100 * 60;
  td::int32 qid = 1;
  using Mask = std::bitset<128>;
  struct Query {
    td::int64 id;
    td::Ref<vm::Cell> message;
    Mask signed_mask;
  };

  std::vector<Query> queries;
  int max_queries = 300;

  td::Random::Xorshift128plus rnd(123);

  auto new_query = [&] {
    if (qid > max_queries) {
      return;
    }
    Query query;
    query.id = (static_cast<td::int64>(now) << 32) | qid++;
    query.message = vm::CellBuilder().store_bytes(td::rand_string('a', 'z', rnd.fast(0, 100))).finalize();
    queries.push_back(std::move(query));
  };

  auto verify = [&] {
    auto messages = ms->get_unsigned_messaged();
    std::set<std::tuple<td::uint64, ton::MultisigWallet::Mask, std::string>> s;
    std::set<std::tuple<td::uint64, ton::MultisigWallet::Mask, std::string>> t;

    for (auto& m : messages) {
      auto x = std::make_tuple(m.query_id, m.signed_by, m.message->get_hash().as_slice().str());
      s.insert(std::move(x));
    }

    for (auto& q : queries) {
      if (q.signed_mask.none()) {
        continue;
      }
      t.insert(std::make_tuple(q.id, q.signed_mask, q.message->get_hash().as_slice().str()));
    }
    ASSERT_EQ(t.size(), s.size());
    CHECK(s == t);
  };

  auto sign_query = [&](Query& query, Mask mask) {
    auto qb = ton::MultisigWallet::QueryBuilder(wallet_id, query.id, query.message);
    int first_i = -1;
    for (int i = 0; i < (int)mask.size(); i++) {
      if (mask.test(i)) {
        if (first_i == -1) {
          first_i = i;
        } else {
          qb.sign(i, keys[i]);
        }
      }
    }
    return qb.create(first_i, keys[first_i]);
  };

  auto send_signature = [&](td::Ref<vm::Cell> query) {
    auto ans = ms.write().send_external_message(query);
    LOG(ERROR) << "GAS: " << ans.gas_used;
    return ans.code == 0;
  };

  auto is_ready = [&](Query& query) { return ms->processed(query.id) == -1; };

  auto gen_query = [&](Query& query) {
    auto x = rnd.fast(1, n);
    Mask mask;
    for (int t = 0; t < x; t++) {
      mask.set(rnd() % n);
    }

    auto signature = sign_query(query, mask);
    return std::make_pair(signature, mask);
  };

  auto rand_sign = [&] {
    if (queries.empty()) {
      return;
    }

    size_t query_i = rnd() % queries.size();
    auto& query = queries[query_i];

    Mask mask;
    td::Ref<vm::Cell> signature;
    std::tie(signature, mask) = gen_query(query);
    if (false && rnd() % 6 == 0) {
      Mask mask2;
      td::Ref<vm::Cell> signature2;
      std::tie(signature2, mask2) = gen_query(query);
      for (int i = 0; i < (int)keys.size(); i++) {
        if (mask[i]) {
          signature = ms->merge_queries(std::move(signature), std::move(signature2));
          break;
        }
        if (mask2[i]) {
          signature = ms->merge_queries(std::move(signature2), std::move(signature));
          break;
        }
      }
      //signature = ms->merge_queries(std::move(signature), std::move(signature2));
      mask |= mask2;
    }

    int got_cnt;
    Mask got_cnt_bits;
    std::tie(got_cnt, got_cnt_bits) = ms->check_query_signatures(signature);
    CHECK(mask == got_cnt_bits);

    bool expect_ok = true;
    {
      auto new_mask = mask & ~query.signed_mask;
      expect_ok &= new_mask.any();
      for (size_t i = 0; i < mask.size(); i++) {
        if (mask[i]) {
          expect_ok &= new_mask[i];
          break;
        }
      }
    }

    ASSERT_EQ(expect_ok, send_signature(std::move(signature)));
    if (expect_ok) {
      query.signed_mask |= mask;
    }
    auto expect_is_ready = query.signed_mask.count() >= (size_t)k;
    auto state = ms->get_query_state(query.id);
    ASSERT_EQ(expect_is_ready, (state.state == ton::MultisigWallet::QueryState::Sent));
    CHECK(expect_is_ready || state.mask == query.signed_mask);
    ASSERT_EQ(expect_is_ready, is_ready(query));
    if (expect_is_ready) {
      queries.erase(queries.begin() + query_i);
    }
    verify();
  };
  td::RandomSteps steps({{rand_sign, 2}, {new_query, 1}});
  while (!queries.empty() || qid <= max_queries) {
    steps.step(rnd);
    //LOG(ERROR) << ms->data_size();
  }
  LOG(INFO) << "Final code size: " << ms->code_size();
  LOG(INFO) << "Final data size: " << ms->data_size();
}
*/