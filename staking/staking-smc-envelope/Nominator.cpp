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
#include "Nominator.h"
#include "GenericAccount.h"
#include "StakingSmartContractCode.h"

#include "vm/boc.h"
#include "vm/cells/CellString.h"
#include "td/utils/base64.h"
#include "block/block-parse.h"

#include <limits>

namespace ton {
    td::Ref<vm::Cell> Nominator::get_init_state(const block::StdAddress owner_address, td::int32 wallet_id ) noexcept {
      auto code = get_init_code();
      auto data = get_init_data(owner_address, wallet_id);
      return GenericAccount::get_init_state(std::move(code), std::move(data));
    }

    td::Ref<vm::Cell> Nominator::get_init_message() noexcept {
      vm::CellBuilder cb;
      cb.store_long(1,1);
      return cb.finalize();
    }


    td::Ref<vm::Cell> Nominator::get_init_code() noexcept {
      return StakingSmartContractCode::nominator();
    }

    vm::CellHash Nominator::get_init_code_hash() noexcept {
      return get_init_code()->get_hash();
    }

    td::Ref<vm::Cell> Nominator::get_init_data( block::StdAddress owner_address, td::uint32 wallet_id) noexcept {
      vm::CellBuilder config;
      config.store_long(0, 1);
      config.store_bits(owner_address.addr.bits() , 256);
      config.store_long(wallet_id, 32);
      config.store_long(0, 32);
      block::tlb::t_Grams.store_integer_value(config, td::BigInt256(0));
      block::tlb::t_Grams.store_integer_value(config, td::BigInt256(0));
      block::tlb::t_Grams.store_integer_value(config, td::BigInt256(0));

      return config.finalize();
    }



    td::Result<td::uint32> Nominator::get_wallet_id() const {
      return TRY_VM(get_wallet_id_or_throw());
    }

    td::Result<td::uint32> Nominator::get_wallet_id_or_throw() const {
      if (state_.data.is_null()) {
        return 0;
      }
      //FIXME use get method
      auto cs = vm::load_cell_slice(state_.data);
      cs.skip_first(257);
      return static_cast<td::uint32>(cs.fetch_ulong(32));
    }

    td::Ref<Nominator> Nominator::create(td::Ref<vm::Cell> data) {
      return td::Ref<Nominator>(true, State{ton::StakingSmartContractCode::nominator(), std::move(data)});
    }


}  // namespace ton
