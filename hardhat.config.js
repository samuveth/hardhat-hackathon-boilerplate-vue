require("@nomiclabs/hardhat-waffle");

// The next line is part of the sample project, you don't need it in your
// project. It imports a Hardhat task definition, that can be used for
// testing the frontend.
require("./tasks/faucet");

module.exports = {
  solidity: "0.7.3",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    xdai: {
      url: "https://xdai.poanetwork.dev",
      accounts: ["<your pvt key>"],
      network_id: 100,
      gas: 500000,
      gasPrice: 1000000000,
    },
  },
};
