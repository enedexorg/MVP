// ethers plugin required to interact with the contract
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
// private key from the pre-funded Moonbase Alpha testing account
const { privateKey, ropstenURL } = require('./secrets.json');

const accounts = {
	mnemonic: privateKey,
}

module.exports = {
  solidity: {
    version: "0.6.12",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },



  networks: {
    // Moonbase Alpha network specification
    moonbase: {
      url: `https://rpc.testnet.moonbeam.network`,
      chainId: 1287,
      accounts: accounts  
      },
    binanceTestNet : {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
      chainId: 97,
      accounts: accounts
    },
    ropsten : {
      url: ropstenURL,
      chainId: 3,
      accounts: accounts
    },
    operaTestnet: {
      url: `https://rpc.testnet.fantom.network/`,
      chainId: 0xfa2,
      accounts: accounts
    },

    dev: {
	url: `http://127.0.0.1:9933`,
	chainId: 1281,
	accounts: accounts
    },
    hardhat: {
	chainId: 1287
    }
  }
};
