require('@nomiclabs/hardhat-solhint');
require('@nomiclabs/hardhat-waffle');
require('hardhat-deploy');
require('hardhat-gas-reporter');
require('hardhat-contract-sizer');
require('solidity-coverage');

require('dotenv').config();

const hardhatLogging = (process.env.HARDHAT_LOGGING !== '0');
const walletMnemonic = process.env.WALLET_MNEMONIC;
const ropstenProvider = process.env.ROPSTEN_PROVIDER;
const testReportGas = (process.env.TEST_REPORT_GAS !== '0');

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    // This is used as a profile for booting up the local network / testing
    hardhat: {
      accounts: {
        count: 100,
        mnemonic: walletMnemonic,
      },
      chainId: 1,
      allowUnlimitedContractSize: true,
      logged: hardhatLogging,
    },
    hardhat: {
      chainId: 1337,
      auto: false,
      interval: 5000,
    },
    ropsten: {
      chainId: 3,
      gas: 'auto',
      gasPrice: 'auto',
      gasMultiplier: 1,
      allowUnlimitedContractSize: true,
      url: ropstenProvider,
      timeout: 20000,
    },
  },
  gasReporter: {
    enabled: testReportGas,
    showMethodSig: true,
  },
  solidity: {
    version: '0.8.3',
  },
};
