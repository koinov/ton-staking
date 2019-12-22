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
#include "StakingPool.h"
#include "GenericAccount.h"
#include "StakingSmartContractCode.h"

#include "vm/boc.h"
#include "vm/cells/CellString.h"
#include "td/utils/base64.h"
#include "block/block-parse.h"

#include <limits>

namespace ton {
    td::Ref<vm::Cell> StakingPool::get_init_state(const block::StdAddress  owner_address, td::int32 owner_fee, td::int32 min_stake
                                                     ) noexcept {
      auto code = get_init_code();
      auto data = get_init_data(owner_address, owner_fee, min_stake);
      return GenericAccount::get_init_state(std::move(code), std::move(data));
    }

    td::Ref<vm::Cell> StakingPool::get_init_message(const std::vector<block::StdAddress> nominator_address) noexcept {
      vm::Dictionary nominators(256);

      for (size_t i = 0; i < nominator_address.size(); i++) {
        auto key = nominator_address[i].addr;
        vm::CellBuilder nominator_data;
        nominator_data.store_long(0, 8);
        block::tlb::t_Grams.store_integer_value(nominator_data, td::BigInt256(0));
        block::tlb::t_Grams.store_integer_value(nominator_data, td::BigInt256(0));
        nominators.set_builder(key.bits(), 256, nominator_data);
      }

      vm::CellBuilder cb;
      cb.ensure_throw(cb.store_maybe_ref(nominators.get_root_cell()));

      return cb.finalize();
    }

    td::Ref<vm::Cell> StakingPool::make_a_gift_message(const td::Ed25519::PrivateKey& private_key, td::uint32 wallet_id,
                                                          td::uint32 seqno, td::uint32 valid_until,
                                                          td::Span<Gift> gifts) noexcept {
      CHECK(gifts.size() <= 254);
      vm::Dictionary messages(16);
      for (size_t i = 0; i < gifts.size(); i++) {
        auto& gift = gifts[i];
        td::int32 send_mode = 3;
        auto gramms = gift.gramms;
        if (gramms == -1) {
          gramms = 0;
          send_mode += 128;
        }
        vm::CellBuilder cb;
        GenericAccount::store_int_message(cb, gift.destination, gramms);
        cb.store_bytes("\0\0\0\0", 4);
        //vm::CellString::store(cb, gift.message, 35 * 8).ensure();
        auto message_inner = cb.finalize();
        cb = {};
        cb.store_long(send_mode, 8).store_ref(message_inner);
        auto key = messages.integer_key(td::make_refint(i), 16, false);
        messages.set_builder(key.bits(), 16, cb);
      }

      vm::CellBuilder cb;
      cb.store_long(wallet_id, 32).store_long(valid_until, 32).store_long(seqno, 32);
      CHECK(cb.store_maybe_ref(messages.get_root_cell()));
      auto message_outer = cb.finalize();
      auto signature = private_key.sign(message_outer->get_hash().as_slice()).move_as_ok();
      return vm::CellBuilder().store_bytes(signature).append_cellslice(vm::load_cell_slice(message_outer)).finalize();
    }

    td::Ref<vm::Cell> StakingPool::get_init_code() noexcept {
      return StakingSmartContractCode::staking_pool();
    }

    vm::CellHash StakingPool::get_init_code_hash() noexcept {
      return get_init_code()->get_hash();
    }

    vm::CellHash StakingPool::get_data_hash() noexcept {
      return state_.data->get_hash();
    }


    td::Ref<vm::Cell> StakingPool::get_init_data( block::StdAddress owner_address, td::uint32 owner_fee, td::uint32 min_stake  ) noexcept {
      vm::Dictionary nominators(256);

      vm::CellBuilder config;
      config.store_bits(owner_address.addr.bits() , 256);
      config.store_long(owner_fee, 32);
      block::tlb::t_Grams.store_integer_value(config, td::BigInt256(min_stake));
      config.ensure_throw(config.store_maybe_ref(nominators.get_root_cell()));

      return vm::CellBuilder().store_long(0, 16).store_ref(config.finalize()).finalize();
    }

    td::Result<td::uint32> StakingPool::get_seqno() const {
      return TRY_VM(get_seqno_or_throw());
    }

    td::Result<td::uint32> StakingPool::get_seqno_or_throw() const {
      if (state_.data.is_null()) {
        return 0;
      }
      //FIXME use get method
      return static_cast<td::uint32>(vm::load_cell_slice(state_.data).fetch_ulong(32));
    }

    td::Result<td::uint32> StakingPool::get_wallet_id() const {
      return TRY_VM(get_wallet_id_or_throw());
    }

    td::Result<td::uint32> StakingPool::get_wallet_id_or_throw() const {
      if (state_.data.is_null()) {
        return 0;
      }
      //FIXME use get method
      auto cs = vm::load_cell_slice(state_.data);
      cs.skip_first(32);
      return static_cast<td::uint32>(cs.fetch_ulong(32));
    }

    td::Ref<StakingPool> StakingPool::create(td::Ref<vm::Cell> data) {
      return td::Ref<StakingPool>(true, State{ton::StakingSmartContractCode::staking_pool(), std::move(data)});
    }


    StakingPool::Subscription StakingPool::get_subscription(int subscription_id, int direction) const {
      StakingSmartContract::Answer ans;
      ans = run_get_method("get_subscription", {td::make_refint(subscription_id), td::make_refint(direction)});

      auto status = ans.stack.write().pop_smallint_range(100000);
      auto end_period = ans.stack.write().pop_smallint_range(100000);
      auto start_period = ans.stack.write().pop_smallint_range(100000);
      auto amount = ans.stack.write().pop_int();
      auto subscriber = ans.stack.write().pop_int();
      auto id = ans.stack.write().pop_smallint_range(100000);

      auto res = StakingPool::Subscription{id, subscriber , amount->to_long(), static_cast<td::int16>(start_period), static_cast<td::int16>(end_period), static_cast<td::int8>(status)};

      return res;
    }

    StakingPool::SubscriptionPeriod StakingPool::get_subscribers_subscription(block::StdAddress subscriber_address, int period, int direction) const {
      StakingSmartContract::Answer ans;
      Args args;

      td::BigInt256 bi;
      bi.import_bits(subscriber_address.addr.as_bitslice());

      td::Ref<td::CntInt256> int_address_ref(bi);
      td::Ref<vm::Stack> stack_ref{true};
      vm::Stack& stack = stack_ref.write();
      stack.push_int( int_address_ref );
      stack.push_smallint(period);
      stack.push_smallint(direction);
      args.set_stack(stack_ref);

      ans = run_get_method("get_subscribers_subscription", args);

      auto subscription = ans.stack.write().pop_smallint_range(100000);
      auto period_id = ans.stack.write().pop_smallint_range(100000);

      auto res = StakingPool::SubscriptionPeriod{static_cast<td::int16>(period_id), subscription};

      return res;
    }

    std::vector<StakingPool::SubscriptionPeriod> StakingPool::get_subscribers_subscriptions(block::StdAddress subscriber_address) const {
      StakingSmartContract::Answer ans;
      Args args;

      td::BigInt256 bi;
      bi.import_bits(subscriber_address.addr.as_bitslice());

      td::Ref<td::CntInt256> int_address_ref(bi);
      td::Ref<vm::Stack> stack_ref{true};
      vm::Stack& stack = stack_ref.write();
      stack.push_int( int_address_ref );
      args.set_stack(stack_ref);

      ans = run_get_method("get_subscribers_subscriptions", args);

      // TODO : tupple operations

      std::vector<StakingPool::SubscriptionPeriod> res;
      res.push_back(StakingPool::SubscriptionPeriod{static_cast<td::int16>(0), static_cast<td::int16>(0) });

      return res;
    }

    StakingPool::Nominator StakingPool::get_nominator(td::BigInt256 nominator_address, int direction) const {
      StakingSmartContract::Answer ans;
      Args args;

      td::Ref<td::CntInt256> int_address_ref(nominator_address);
      td::Ref<vm::Stack> stack_ref{true};
      vm::Stack& stack = stack_ref.write();
      stack.push_int( int_address_ref );
      stack.push_int( td::make_refint(direction) );
      args.set_stack(stack_ref);

      ans = run_get_method("get_nominator", args);

      auto stake = ans.stack.write().pop_int();
      auto balance = ans.stack.write().pop_int();
      auto status = ans.stack.write().pop_smallint_range(256);
      auto address = ans.stack.write().pop_int();

      auto res = StakingPool::Nominator{address, static_cast<td::int8>(status), balance->to_long(), stake->to_long()};

      return res;
    }

    StakingPool::Performance StakingPool::get_performance(int period, int direction) const {
      StakingSmartContract::Answer ans;
      ans = run_get_method("get_performance", {td::make_refint(period), td::make_refint(direction)});

      auto withdrawals = ans.stack.write().pop_int();
      auto deposits = ans.stack.write().pop_int();
      auto units = ans.stack.write().pop_int();
      auto aum = ans.stack.write().pop_int();
      auto rate = ans.stack.write().pop_int();
      auto id = ans.stack.write().pop_smallint_range(65535);

      auto res = StakingPool::Performance{static_cast<td::int16>(id), rate->to_long(), aum->to_long(), units->to_long(), deposits->to_long(), withdrawals->to_long()};

      return res;
    }


    td::Ref<vm::Cell> StakingPool::set_nominator_status_request(block::StdAddress nominator_address, td::int8 status, td::int64 query_id) {
      return vm::CellBuilder()
          .store_long(0x544c5741,32)
          .store_long(query_id, 64)
          .store_bits(nominator_address.addr.bits(), 256)
          .store_long(status, 8)
          .finalize();
    }

    td::Ref<vm::Cell> StakingPool::new_period_request(td::uint64 query_id) {
      return vm::CellBuilder()
          .store_long(0x5057454e,32)
          .store_long(query_id, 64)
          .finalize();
    }

    td::Ref<vm::Cell> StakingPool::redemption_request(td::uint32 subscription_id, td::uint64 query_id) {
      return vm::CellBuilder()
          .store_long(0x534D4452,32)
          .store_long(query_id, 64)
          .store_long(subscription_id, 32)
          .finalize();
    }

    td::Ref<vm::Cell> StakingPool::redemption_request(td::Slice subscription_id) {
      return vm::CellBuilder()
          .store_long(0,32)
          .store_bytes(subscription_id)
          .finalize();
    }



}  // namespace ton
