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
#pragma once

#include "staking-smc-envelope/StakingSmartContract.h"
#include "vm/cells.h"
#include "Ed25519.h"
#include "block/block.h"
#include "vm/cells/CellString.h"

namespace ton {
    class StakingPool : public ton::StakingSmartContract {
    public:
        explicit StakingPool(State state) :  ton::StakingSmartContract(std::move(state)) {
        }
        static constexpr unsigned max_message_size = vm::CellString::max_bytes;
        static td::Ref<vm::Cell> get_init_state(const block::StdAddress  owner_address, td::int32 owner_fee, td::int32 min_stake) noexcept;
        static td::Ref<vm::Cell> get_init_message(const std::vector<block::StdAddress> nominator_address) noexcept;
        struct Gift {
            block::StdAddress destination;
            td::int64 gramms;
            std::string message;
        };
        static td::Ref<vm::Cell> make_a_gift_message(const td::Ed25519::PrivateKey& private_key, td::uint32 wallet_id,
                                                     td::uint32 seqno, td::uint32 valid_until, td::Span<Gift> gifts) noexcept;

        static td::Ref<vm::Cell> get_init_code() noexcept;
        static vm::CellHash get_init_code_hash() noexcept;
        static td::Ref<vm::Cell> get_init_data(const block::StdAddress owner_address, td::uint32 onwer_pct, td::uint32 min_stake ) noexcept;
        vm::CellHash get_data_hash() noexcept;

        td::Result<td::uint32> get_seqno() const;
        td::Result<td::uint32> get_wallet_id() const;

        struct Subscription {
            td::int32 id;
            td::RefInt256 address;
            td::int64 grams;
            td::int16 start_period;
            td::int16  end_period;
            td::int8 status;
        };

        struct Nominator {
            td::RefInt256 address;
            td::int8 status;
            td::int64 balance;
            td::int64 stake;
        };

        struct Performance {
            td::int16 period;
            td::int64 rate;
            td::int64 aum;
            td::int64 units;
            td::int64 deposits;
            td::int64 withdrawals;
        };

        struct SubscriptionPeriod {
            td::int16 period;
            td::int32 subscription;
        };


        static td::Ref<StakingPool> create(td::Ref<vm::Cell> data = {});
        StakingPool::Subscription get_subscription(int id, int direction) const;
        StakingPool::Nominator get_nominator(td::BigInt256 nominator_address, int direction) const;
        StakingPool::Performance get_performance(int period, int direction) const;
        StakingPool::SubscriptionPeriod get_subscribers_subscription(block::StdAddress subscriber_address, int period, int direction) const;
        std::vector<StakingPool::SubscriptionPeriod> get_subscribers_subscriptions(block::StdAddress subscriber_address) const;

        static td::Ref<vm::Cell> set_nominator_status_request(block::StdAddress nominator_address, td::int8 status, td::int64 query_id);
        static td::Ref<vm::Cell> new_period_request(td::uint64 query_id);
        static td::Ref<vm::Cell> redemption_request(td::uint32 subscription_id, td::uint64 query_id);
        static td::Ref<vm::Cell> redemption_request(td::Slice subscription_id);


          private:
        td::Result<td::uint32> get_seqno_or_throw() const;
        td::Result<td::uint32> get_wallet_id_or_throw() const;

        vm::Ref<vm::Cell> dict_;

    };
}  // namespace ton
