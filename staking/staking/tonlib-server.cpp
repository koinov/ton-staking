#include "adnl/adnl-ext-client.h"
#include "tl-utils/tl-utils.hpp"
#include "auto/tl/ton_api_json.h"
#include "auto/tl/tonlib_api_json.h"
#include "tl/tl_json.h"
#include "ton/ton-types.h"
#include "ton/ton-tl.hpp"
#include "block/block.h"
#include "block/block-auto.h"
#include "Ed25519.h"

#include "smc-envelope/GenericAccount.h"
#include "smc-envelope/MultisigWallet.h"
#include "smc-envelope/TestGiver.h"
#include "smc-envelope/TestWallet.h"
#include "staking-smc-envelope/StakingPool.h"
#include "tonlib/LastBlock.h"
#include "tonlib/ExtClient.h"
#include "tonlib/utils.h"

#include "tonlib/TonlibCallback.h"
#include "tonlib/Client.h"

#include "vm/cells.h"
#include "vm/boc.h"
#include "vm/cells/MerkleProof.h"
#include "time.h"

#include "td/utils/Container.h"
#include "td/utils/OptionsParser.h"
#include "td/utils/Random.h"
#include "td/utils/filesystem.h"
#include "td/utils/tests.h"
#include "td/utils/optional.h"
#include "td/utils/overloaded.h"
#include "td/utils/MpscPollableQueue.h"
#include "td/utils/port/path.h"

#include "td/utils/port/signals.h"

#include <jsonrpccpp/server/connectors/httpserver.h>
#include <jsonrpccpp/server.h>



using namespace jsonrpc;
using namespace tonlib;

auto sync_send = [](auto& client, auto query) {
    using ReturnTypePtr = typename std::decay_t<decltype(*query)>::ReturnType;
    using ReturnType = typename ReturnTypePtr::element_type;
    client.send({1, std::move(query)});
    while (true) {
      auto response = client.receive(100);
      if (response.object && response.id != 0) {
        CHECK(response.id == 1);
        if (response.object->get_id() == tonlib_api::error::ID) {
          auto error = tonlib_api::move_object_as<tonlib_api::error>(response.object);
          return td::Result<ReturnTypePtr>(td::Status::Error(error->code_, error->message_));
        }
        return td::Result<ReturnTypePtr>(tonlib_api::move_object_as<ReturnType>(response.object));
      }
    }
};
auto static_send = [](auto query) {
    using ReturnTypePtr = typename std::decay_t<decltype(*query)>::ReturnType;
    using ReturnType = typename ReturnTypePtr::element_type;
    auto response = Client::execute({1, std::move(query)});
    if (response.object->get_id() == tonlib_api::error::ID) {
      auto error = tonlib_api::move_object_as<tonlib_api::error>(response.object);
      return td::Result<ReturnTypePtr>(td::Status::Error(error->code_, error->message_));
    }
    return td::Result<ReturnTypePtr>(tonlib_api::move_object_as<ReturnType>(response.object));
};

struct Key {
    std::string public_key;
    td::SecureString secret;
    tonlib_api::object_ptr<tonlib_api::InputKey> get_input_key() const {
      return tonlib_api::make_object<tonlib_api::inputKeyRegular>(
          tonlib_api::make_object<tonlib_api::key>(public_key, secret.copy()), td::SecureString("local"));
    }
    tonlib_api::object_ptr<tonlib_api::InputKey> get_fake_input_key() const {
      return tonlib_api::make_object<tonlib_api::inputKeyFake>();
    }
};
struct Wallet {
    std::string address;
    Key key;
};

struct TransactionId {
    td::int64 lt{0};
    std::string hash;
};

struct AccountState {
    enum Type { Empty, Wallet, Unknown } type{Empty};
    td::int64 sync_utime{-1};
    td::int64 balance{-1};
    TransactionId last_transaction_id;
    std::string address;

    bool is_inited() const {
      return type != Empty;
    }
};

using tonlib_api::make_object;

void sync(Client& client) {
  sync_send(client, make_object<tonlib_api::sync>()).ensure();
}

static td::uint32 default_wallet_id{0};
std::string wallet_address(Client& client, const Key& key) {
    return sync_send(client,
                     make_object<tonlib_api::getAccountAddress>(
                             make_object<tonlib_api::wallet_v3_initialAccountState>(key.public_key, default_wallet_id), 0))
            .move_as_ok()
            ->account_address_;
}


AccountState get_account_state(Client& client, std::string address) {
    auto state = sync_send(client, tonlib_api::make_object<tonlib_api::getAccountState>(
            tonlib_api::make_object<tonlib_api::accountAddress>(address)))
            .move_as_ok();
    AccountState res;
    res.balance = state->balance_;
    res.sync_utime = state->sync_utime_;
    res.last_transaction_id.lt = state->last_transaction_id_->lt_;
    res.last_transaction_id.hash = state->last_transaction_id_->hash_;
    res.address = address;
    switch (state->account_state_->get_id()) {
        case tonlib_api::uninited_accountState::ID:
            res.type = AccountState::Empty;
            break;
        case tonlib_api::wallet_v3_accountState::ID:
        case tonlib_api::wallet_accountState::ID:
            res.type = AccountState::Wallet;
            break;
        default:
            res.type = AccountState::Unknown;
            break;
    }
    return res;
}
struct QueryId {
    td::int64 id;
};


class TONServer : public AbstractServer<TONServer> {
private:
    Client client;
    std::string pool_address;
    std::string data_hash;
    td::int16 current_period;
    std::vector<ton::StakingPool::Subscription> subscriptions;
    std::vector<ton::StakingPool::Nominator> nominators;
    std::vector<ton::StakingPool::Performance> performance;
    std::map<td::uint16, td::uint64> rates;
    time_t  update_time;
    void readSMC(){
      auto pool_account_address = make_object<tonlib_api::accountAddress>(this->pool_address);
      LOG(INFO) << "SMC account address " << pool_account_address.get()->account_address_;
      //auto method = tonlib_api::make_object<tonlib_api::smc_methodIdNumber>(td::to_integer<td::int32>("get_current_period"));

      auto smc_load_obj = tonlib_api::make_object<tonlib_api::smc_load>( std::move(pool_account_address));
      LOG(INFO) << "SMC ID " << smc_load_obj->get_id();
      auto smc_info = sync_send(client, std::move(smc_load_obj)).move_as_ok();
      LOG(INFO) << "SMC RES " << smc_info->id_;
      auto smc_data = sync_send(client, make_object<tonlib_api::smc_getData>(smc_info->id_ )).move_as_ok();
      //LOG(INFO) << "SMC DATA " << smc_data->bytes_;

      ton::StakingPool current_pool({
                                        ton::StakingPool::get_init_code(),
                                        vm::std_boc_deserialize(smc_data->bytes_).move_as_ok()
                                    });

      auto current_period_result = current_pool.run_get_method("get_current_period",{});
      this->current_period = current_period_result.stack.write().pop_smallint_range(100000);
      LOG(INFO) << "Current period : " << current_period;
      auto current_data_hash = current_pool.get_data_hash();
      LOG(INFO) << "Data hash : " << td::base64_encode(current_data_hash.as_slice());
      data_hash = td::base64_encode(current_data_hash.as_slice());

      td::int32 period_idx = 0;

      performance.clear();
      rates.clear();

      ton::StakingPool::Performance current_performance_0 = current_pool.get_performance(0, 0);
      performance.push_back(current_performance_0);
      rates[current_performance_0.period] = current_performance_0.rate;

      do {
        ton::StakingPool::Performance current_performance = current_pool.get_performance(period_idx, 1);
        if( current_performance.period != 0){
          performance.push_back(current_performance);
          rates[current_performance.period] = current_performance.rate;
        }
        period_idx = current_performance.period;
      } while (period_idx != 0);


      td::int32 subscription_idx = 0;
      subscriptions.clear();
      do {
        ton::StakingPool::Subscription current_subscription = current_pool.get_subscription(subscription_idx, 1);
        if( current_subscription.id != 0){
          subscriptions.push_back(current_subscription);
        }
        subscription_idx = current_subscription.id;
      } while (subscription_idx != 0);

      td::BigInt256 nominator_idx(0);
      nominators.clear();
      do {
        ton::StakingPool::Nominator current_nominator = current_pool.get_nominator(nominator_idx, 1);
        if( current_nominator.address != 0){
          nominators.push_back(current_nominator);
        }

      } while ( nominator_idx != 0 );



    }

public:
    TONServer(HttpServer &server, Client &pClient, std::string address) : AbstractServer<TONServer>(server) {
      this->client = std::move(pClient);
      this->bindAndAddMethod(Procedure("account_state", PARAMS_BY_NAME, JSON_STRING,
                                       "address", JSON_STRING, NULL),
                             &TONServer::accountState);
      this->bindAndAddMethod(Procedure("pool_state", PARAMS_BY_NAME, JSON_STRING,
                                       NULL),
                             &TONServer::poolState);

      this->bindAndAddMethod(Procedure("subscriptions", PARAMS_BY_NAME, JSON_STRING,
                                       NULL),
                             &TONServer::poolSubscriptions);

      this->bindAndAddMethod(Procedure("performance", PARAMS_BY_NAME, JSON_STRING,
                                       NULL),
                             &TONServer::poolPerformance);


      this->bindAndAddMethod(Procedure("nominators", PARAMS_BY_NAME, JSON_STRING,
                                       NULL),
                             &TONServer::poolNominators);

      this->bindAndAddMethod(Procedure("subscriber", PARAMS_BY_NAME, JSON_STRING,
                                       "address", JSON_STRING, NULL),
                             &TONServer::poolSubscriber);


      this->bindAndAddNotification(
          Procedure("notifyServer", PARAMS_BY_NAME, NULL),
          &TONServer::notifyServer);
      this->pool_address = address;
      readSMC();
      update_time = time(nullptr);
    }

    void poolState(const Json::Value &request, Json::Value &response) {
      time_t now = time(nullptr);
      if( now - update_time > 30 ){
        readSMC();
        update_time = now;
      }


      auto state = get_account_state( client, pool_address);
      std::vector<td::int16> periods;
      periods.push_back(1);
      periods.push_back(2);
      response["address"] = pool_address;
      response["balance"] = std::to_string(state.balance);
      response["hash"] = data_hash;
      response["current_period"] = current_period;
    }

    void poolSubscriptions(const Json::Value &request, Json::Value &response)
    {
      Json::Value json_subscriptions_array;
      unsigned char bits_buf[32];
      for(int a=0; a < subscriptions.size(); a++){
        auto json_subscription = Json::Value();
        auto current_subscription = subscriptions[a];
        td::BitSliceWrite bs;

        json_subscription["id"] = current_subscription.id;
        json_subscription["start_period"] = current_subscription.start_period;
        json_subscription["end_period"] = current_subscription.end_period;
        json_subscription["status"] = current_subscription.status;
        json_subscription["start_value"] = std::to_string(current_subscription.grams);

        if( current_subscription.end_period == 0 ){
          json_subscription["end_value"] = std::to_string( current_subscription.grams / rates[ current_subscription.start_period] * rates[current_period-1] );
        }else {
          json_subscription["end_value"] = std::to_string(
              current_subscription.grams / rates[current_subscription.start_period] * rates[current_subscription.end_period-1]);
        }

        current_subscription.address.write().export_bits(bits_buf, 0, 256, true);
        td::BitSlice bbs(bits_buf, 256);

        json_subscription["address"] = block::StdAddress(0, bbs.bits() ).rserialize();
        LOG(INFO) << bbs.to_hex();
        json_subscriptions_array.append(json_subscription);
      }
      response["subscriptions"] = json_subscriptions_array;
    }


    void poolSubscriber(const Json::Value &request, Json::Value &response)
    {
      Json::Value json_subscriptions_array;
      unsigned char bits_buf[32];
      for(int a=0; a < subscriptions.size(); a++){
        auto json_subscription = Json::Value();
        auto current_subscription = subscriptions[a];
        td::BitSliceWrite bs;
        current_subscription.address.write().export_bits(bits_buf, 0, 256, true);
        td::BitSlice bbs(bits_buf, 256);

        auto subscription_address = block::StdAddress(0, bbs.bits() ).rserialize();
        if( subscription_address == request["address"].asString()) {
          json_subscription["id"] = current_subscription.id;
          json_subscription["start_period"] = current_subscription.start_period;
          json_subscription["end_period"] = current_subscription.end_period;
          json_subscription["status"] = current_subscription.status;
          json_subscription["start_value"] = std::to_string(current_subscription.grams);
          json_subscription["address"] = subscription_address;

          if (current_subscription.end_period == 0) {
            json_subscription["end_value"] = std::to_string(
                current_subscription.grams / rates[current_subscription.start_period] * rates[current_period - 1]);
          } else {
            json_subscription["end_value"] = std::to_string(
                current_subscription.grams / rates[current_subscription.start_period] *
                rates[current_subscription.end_period - 1]);
          }

          LOG(INFO) << bbs.to_hex();
          json_subscriptions_array.append(json_subscription);
        }
      }
      response["subscriptions"] = json_subscriptions_array;
    }

    void poolNominators(const Json::Value &request, Json::Value &response)
    {
      Json::Value json_nominators_array;
      unsigned char bits_buf[32];
      for(int a=0; a < nominators.size(); a++){
        auto json_nominator = Json::Value();
        auto current_nominator = nominators[a];

        td::BitSliceWrite bs;

        json_nominator["balance"] = std::to_string(current_nominator.balance);
        json_nominator["stake"] = std::to_string(current_nominator.stake);
        json_nominator["status"] = std::to_string(current_nominator.status);
        current_nominator.address.write().export_bits(bits_buf, 0, 256, true);
        td::BitSlice bbs(bits_buf, 256);

        json_nominator["address"] = block::StdAddress(0, bbs.bits() ).rserialize();
        LOG(INFO) << bbs.to_hex();
        json_nominators_array.append(json_nominator);
      }
      response["nominators"] = json_nominators_array;
    }

    void poolPerformance(const Json::Value &request, Json::Value &response)
    {
      Json::Value json_performance_array;
      for(int a=0; a < performance.size(); a++){
        auto json_performance = Json::Value();
        auto current_performance = performance[a];


        json_performance["period"] = std::to_string(current_performance.period);
        json_performance["aum"] = std::to_string(current_performance.aum);
        json_performance["rate"] = std::to_string(current_performance.rate);
        json_performance["units"] = std::to_string(current_performance.units);

        json_performance["deposits"] = std::to_string(current_performance.deposits);
        json_performance["withdrawals_units"] = std::to_string(current_performance.withdrawals);
        if( current_performance.withdrawals > 0 ){
          json_performance["withdrawals"] = std::to_string(current_performance.withdrawals * rates[current_performance.period-1]);
        }else{
          json_performance["withdrawals"] = std::to_string(0);
        }

        json_performance_array.append(json_performance);
      }
      response["performance"] = json_performance_array;
    }

    // method
    void accountState(const Json::Value &request, Json::Value &response) {
      auto state = get_account_state( client, request["address"].toStyledString());
      response["address"]  = request["address"];
      response["balance"] = std::to_string(state.balance);
    }

    // notification
    void notifyServer(const Json::Value &request) {
      (void)request;
      std::cout << "server received some Notification" << std::endl;
    }
};

int main(int argc, char* argv[]) {
  td::set_default_failure_signal_handler();
  using tonlib_api::make_object;

  td::OptionsParser p;
  std::string global_config_str;
  std::string giver_key_str;
  std::string pool_address;
  std::string giver_key_pwd = "cucumber";
  std::string keystore_dir = "test-keystore";
  bool reset_keystore_dir = false;
  p.add_option('C', "global-config", "file to read global config", [&](td::Slice fname) {
      TRY_RESULT(str, td::read_file_str(fname.str()));
      global_config_str = std::move(str);
      return td::Status::OK();
  });
  p.add_option('G', "giver-key", "file with a wallet key that should be used as a giver", [&](td::Slice fname) {
      TRY_RESULT(str, td::read_file_str(fname.str()));
      giver_key_str = std::move(str);
      return td::Status::OK();
  });
  p.add_option('f', "force", "reser keystore dir", [&]() {
      reset_keystore_dir = true;
      return td::Status::OK();
  });
  p.add_option('P', "pool", "pool address", [&](td::Slice address) {
      pool_address = address.str();
      return td::Status::OK();
  });


  p.run(argc, argv).ensure();

  if (reset_keystore_dir) {
    td::rmrf(keystore_dir).ignore();
  }
  td::mkdir(keystore_dir).ensure();

  SET_VERBOSITY_LEVEL(VERBOSITY_NAME(INFO));
  static_send(make_object<tonlib_api::setLogTagVerbosityLevel>("tonlib_query", 4)).ensure();
  auto tags = static_send(make_object<tonlib_api::getLogTags>()).move_as_ok()->tags_;
  for (auto& tag : tags) {
    static_send(make_object<tonlib_api::setLogTagVerbosityLevel>(tag, 4)).ensure();
  }

  Client client;
  {
    auto info = sync_send(client, make_object<tonlib_api::init>(make_object<tonlib_api::options>(
        make_object<tonlib_api::config>(global_config_str, "", false, false),
        make_object<tonlib_api::keyStoreTypeDirectory>(keystore_dir))))
        .move_as_ok();
    default_wallet_id = static_cast<td::uint32>(info->config_info_->default_wallet_id_);
    LOG(ERROR) << default_wallet_id;
  }

  // wait till client is synchronized with blockchain.
  // not necessary, but synchronized will be trigged anyway later
  sync(client);

  try {
    HttpServer server(6310);
    TONServer serv(server, client, pool_address);
    if (serv.StartListening()) {
      std::cout << "Server started successfully" << std::endl;
      auto ch = getchar();
      if (ch != 'x') {
      while (1) {
        sleep(30);
        std::cout << "Pinging" << std::endl;
        auto ch = getchar();
        if (ch == 'x') {
          break;
        }

        }
      }
      serv.StopListening();
      std::cout << "Server got char successfully. Exiting" << std::endl;
    } else {
      std::cout << "Error starting Server" << std::endl;
    }
  } catch (jsonrpc::JsonRpcException &e) {
    std::cerr << e.what() << std::endl;
  }
  return 0;
}
