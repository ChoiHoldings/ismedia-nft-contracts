require('@nomiclabs/hardhat-solhint');
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-etherscan');
require('hardhat-deploy');
require('hardhat-gas-reporter');
require('hardhat-contract-sizer');
require('solidity-coverage');

require('dotenv').config();

const hardhatLogging = (process.env.HARDHAT_LOGGING !== '0');
const walletMnemonic = process.env.WALLET_MNEMONIC;
const testReportGas = (process.env.TEST_REPORT_GAS !== '0');
const etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';

const ropstenRpcUrl = process.env.ROPSTEN_RPC_URL || '';
const ropstenMnemonic = process.env.ROPSTEN_MNEMONIC || '';

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    // This is used as a profile for booting up the local network / testing
    hardhat: {
      accounts: {
        count: 100,
        mnemonic: walletMnemonic,
      },
      chainId: 1337,
      allowUnlimitedContractSize: true,
      logged: hardhatLogging,
      auto: false,
      interval: 5000,
    },
    ropsten: {
      chainId: 3,
      gas: 5000000,
      gasPrice: 50000000000,
      gasMultiplier: 1,
      allowUnlimitedContractSize: true,
      timeout: 90000,
      nonce: 3,
      url: ropstenRpcUrl,
      accounts: {
        mnemonic: ropstenMnemonic,
      },
    },
  },
  gasReporter: {
    enabled: testReportGas,
    showMethodSig: true,
  },
  etherscan: {
    apiKey: etherscanApiKey,
  },
  solidity: {
    version: '0.8.3',
  },
};
