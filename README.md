# isMedia NFT Contracts

ERC1155, ERC721, and marketplace V1 contracts for isMedia Ethereum NFTs

## Usage

[Hardhat](https://hardhat.org/) is used for contract development and deploy.

**Install packages**
```bash
npm install
```

**Compile contracts** (see [Environment] for )
```bash
npm run compile
```

**Run tests**
```bash
npm run test

# With coverage
npm run test:coverage
```

**Lint**
```bash
# Tests and config files (JS/TS)
npm run lint

# Contracts
npm run lint:solidity
```

**Hardhat local blockchain nodee**
```bash
npm run dev
```

**Deploy**
```bash
# To local node
npm run deploy:dev

# To Ropsten testnet (needs "ROPSTEN_X" env vars)
npm run deploy:test
```

## Environment
The repo comes with and example config in `.env.dist`. These represent the defaults; to modify them copy the file to `.env` and edit.

Name              | Default | Description
----------------- | ------- | --------------------
HARDHAT_LOGGING   | 1       | Logger switch
WALLET_MNEMONIC   | -       | Custom wallet mnemonic for local dev (for Metamask testing convenience)
ETHERSCAN_API_KEY | -       | API key for etherscan. Used for deployed contract verification.
ROPSTEN_RPC_URL   | -       | RPC URL for ropsten testnet deploy
ROPSTEN_MNEMONIC  | -       | Wallet mnemonic for ropsten deploy
TEST_REPORT_GAS   | 1       | Report gas usage after test

## Notes

OpenZeppelin contracts copied 2021-06-28
