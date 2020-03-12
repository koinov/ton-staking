cmake_minimum_required(VERSION 3.0.2 FATAL_ERROR)

if (NOT OPENSSL_FOUND)
  find_package(OpenSSL REQUIRED)
endif()

set(STAKING_SMC_ENVELOPE_SOURCE
  staking-smc-envelope/StakingSmartContract.cpp
  staking-smc-envelope/StakingSmartContractCode.cpp
  staking-smc-envelope/StakingPool.cpp
  staking-smc-envelope/Nominator.cpp
  staking-smc-envelope/WalletV3.cpp

  staking-smc-envelope/GenericAccount.h
  staking-smc-envelope/StakingSmartContract.h
  staking-smc-envelope/StakingSmartContractCode.h
  staking-smc-envelope/WalletV3.h
  staking-smc-envelope/StakingPool.h
  staking-smc-envelope/Nominator.h
)

set(POOL_TEST_SOURCE
  ${CMAKE_CURRENT_SOURCE_DIR}/test/test-pool.cpp
  PARENT_SCOPE
)

add_library(staking-smc-envelope ${STAKING_SMC_ENVELOPE_SOURCE})
target_include_directories(staking-smc-envelope PUBLIC $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}>)
target_link_libraries(staking-smc-envelope PUBLIC ton_crypto PRIVATE tdutils ton_block)
if (NOT CMAKE_CROSSCOMPILING)
  add_dependencies(smc-envelope staking-smc-envelope gen_staking_fif)
endif()


file(MAKE_DIRECTORY smartcont/auto)
if (NOT CMAKE_CROSSCOMPILING)
  set(GENERATE_TLB_CMD tlbc)

  add_custom_target(gen_staking_fif ALL)
  function(GenFif)
    set(options )
    set(oneValueArgs DEST NAME)
    set(multiValueArgs SOURCE)
    set(FUNC_LIB_SOURCE smartcont/stdlib.fc)
    cmake_parse_arguments(ARG "${options}" "${oneValueArgs}" "${multiValueArgs}" ${ARGN} )
    string(REGEX REPLACE "[^a-zA-Z_]" "_" ID ${ARG_DEST})
    set(ARG_DEST_FIF "${ARG_DEST}.fif")
    add_custom_command(
      COMMENT "Generate ${ARG_DEST_FIF}"
      WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
      COMMAND func -PS -o ${ARG_DEST_FIF} ${FUNC_LIB_SOURCE} ${ARG_SOURCE}
      MAIN_DEPENDENCY ${ARG_SOURCE}
      DEPENDS func ${FUNC_LIB_SOURCE}
      OUTPUT ${CMAKE_CURRENT_SOURCE_DIR}/${ARG_DEST_FIF}
    )
    set(ARG_DEST_CPP "${ARG_DEST}.cpp")
    add_custom_command(
      COMMENT "Generate ${ARG_DEST_CPP}"
      WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
      COMMAND fift -I../crypto/fift/lib:smartcont -s ../crypto/smartcont/asm-to-cpp.fif ${ARG_DEST_FIF} ${ARG_DEST_CPP} ${ARG_NAME}
      MAIN_DEPENDENCY ${ARG_SOURCE}
      DEPENDS fift ${ARG_DEST_FIF} smartcont/asm-to-cpp.fif
      OUTPUT ${CMAKE_CURRENT_SOURCE_DIR}/${ARG_DEST_CPP}
    )
    add_custom_target(gen_fif_${ID} DEPENDS ${ARG_DEST_FIF} ${ARG_DEST_CPP})
    add_dependencies(gen_fif gen_fif_${ID})
  endfunction()

  GenFif(DEST smartcont/auto/staking-pool-code SOURCE smartcont/staking-pool-code.fc NAME staking-pool)
  GenFif(DEST smartcont/auto/nominator-code SOURCE smartcont/nominator-code.fc NAME nominator)

endif()


set(STAKING_OFFLINE_TEST_SOURCE ${CMAKE_CURRENT_SOURCE_DIR}/test/offline.cpp PARENT_SCOPE)
set(STAKING_ONLINE_TEST_SOURCE ${CMAKE_CURRENT_SOURCE_DIR}/test/online.cpp PARENT_SCOPE)

add_executable(staking-cli staking/tonpool-cli.cpp)
target_link_libraries(staking-cli tonlib tdactor tdutils terminal staking-smc-envelope)

add_executable(staking-server staking/tonlib-server.cpp)
target_link_libraries(staking-server tonlib tdactor tdutils terminal microhttpd jsoncpp jsonrpccpp-common jsonrpccpp-server staking-smc-envelope)


include(CMakePackageConfigHelpers)
write_basic_package_version_file("StakingConfigVersion.cmake"
  VERSION ${TON_VERSION}
  COMPATIBILITY ExactVersion
)
install(FILES "StakingConfig.cmake" "${CMAKE_CURRENT_BINARY_DIR}/StakingConfigVersion.cmake"
  DESTINATION lib/cmake/Staking
)
