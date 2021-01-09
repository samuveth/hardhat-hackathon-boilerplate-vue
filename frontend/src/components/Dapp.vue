<template>
  <div class="container mx-auto p-4 h-screen">
    <!-- Ethereum wallets inject the window.ethereum object. If it hasn't been
    injected, we instruct the user to install MetaMask. -->
    <div v-if="checkForWallet">
      <NoWalletDetected />
    </div>

    <!-- The next thing we need to do, is to ask the user to connect their wallet.
     When the wallet gets connected, we are going to save the users's address
     in the component's state. So, if it hasn't been saved yet, we have
     to show the ConnectWallet component.

     Note that we pass it a callback that is going to be called when the user
     clicks a button. This callback just calls the _connectWallet method. -->

    <div v-else-if="!selectedAddress">
      <ConnectWallet @connect="connectWallet" :networkError="networkError" />
    </div>

    <!-- If the token data or the user's balance hasn't loaded yet, we show // a
    loading component. -->
    <div class="text-center text-xl" v-else-if="!tokenData || !balance">
      <p>Loading..</p>
    </div>

    <!-- If everything is loaded, we render the application. -->
    <div v-else>
      <div>
        <h1 class="text-4xl">{{ tokenData.name }} {{ tokenData.symbol }}</h1>
        <p class="mt-3">
          Welcome <b>{{ shortenAddress(selectedAddress) }}</b
          >, you have <b>{{ balance.toString() }} {{ tokenData.symbol }}</b
          >.
        </p>
      </div>

      <!-- Sending a transaction isn't an immidiate action. You have to wait
      for it to be mined.
      If we are waiting for one, we show a message here. -->
      <div v-if="txBeingSent">
        <WaitingForTransactionMessage :txHash="txBeingSent" />
      </div>

      <!-- Sending a transaction can fail in multiple ways. 
      If that happened, we show a message here. -->
      <div v-if="transactionError">
        <TransactionErrorMessage :message="transactionError" />
      </div>

      <!-- If the user has no tokens, we don't show the Tranfer form -->
      <div v-if="balanceZero()">
        <NoTokensMessage />
      </div>

      <div v-if="balanceGreaterZero()">
        <Transfer @transfer="transferTokens" :symbol="tokenData.symbol" />
      </div>
    </div>
  </div>
</template>

<script>
// We'll use ethers to interact with the Ethereum network and our contract
import { ethers, BigNumber } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import TokenArtifact from "../contracts/Token.json";
import contractAddress from "../contracts/contract-address.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import NoWalletDetected from "./NoWalletDetected.vue";
import ConnectWallet from "./ConnectWallet.vue";
import WaitingForTransactionMessage from "./WaitingForTransactionMessage.vue";
import TransactionErrorMessage from "./TransactionErrorMessage.vue";
import NoTokensMessage from "./NoTokensMessage.vue";
import Transfer from "./Transfer.vue";

// This is the Hardhat Network id, you might change it in the hardhat.config.js
// Here's a list of network ids https://docs.metamask.io/guide/ethereum-provider.html#properties
// to use when deploying to other networks.
const HARDHAT_NETWORK_ID = "1337";

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// This is the initial data stored in a function for reuse.
function initialData() {
  return {
    // The info of the token (i.e. It's Name and symbol)
    tokenData: undefined,
    // The user's address and balance
    selectedAddress: undefined,
    balance: undefined,
    // The ID about transactions being sent, and any possible error with them
    txBeingSent: undefined,
    transactionError: undefined,
    networkError: undefined,
  };
}

// This component is in charge of doing these things:
//   1. It connects to the user's wallet
//   2. Initializes ethers and the Token contract
//   3. Polls the user balance to keep it updated.
//   4. Transfers tokens by sending transactions
//   5. Renders the whole application
//
// Note that (3) and (4) are specific of this sample application, but they show
// you how to keep your Dapp and contract's state in sync,  and how to send a
// transaction.

export default {
  name: "App",

  components: {
    NoWalletDetected,
    ConnectWallet,
    WaitingForTransactionMessage,
    TransactionErrorMessage,
    NoTokensMessage,
    Transfer,
  },

  // We store multiple things in Dapp's state.
  // You don't need to follow this pattern, but it's an useful example.
  data() {
    return initialData();
  },

  methods: {
    componentWillUnmount() {
      // We poll the user's balance, so we have to stop doing that when Dapp
      // gets unmounted
      this.stopPollingData();
    },

    async connectWallet() {
      // This method is run when the user clicks the Connect. It connects the
      // dapp to the user's wallet, and initializes it.

      // To connect to the user's wallet, we have to run this method.
      // It returns a promise that will resolve to the user's address.
      const [selectedAddress] = await window.ethereum.enable();

      // Once we have the address, we can initialize the application.

      // First we check the network
      if (!this.checkNetwork()) {
        return;
      }

      this.initialize(selectedAddress);

      // We reinitialize it whenever the user changes their account.
      window.ethereum.on("accountsChanged", ([newAddress]) => {
        this.stopPollingData();
        // `accountsChanged` event can be triggered with an undefined newAddress.
        // This happens when the user removes the Dapp from the "Connected
        // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
        // To avoid errors, we reset the dapp state
        if (newAddress === undefined) {
          return this.resetState();
        }

        this.initialize(newAddress);
      });

      // We reset the dapp state if the network is changed
      window.ethereum.on("networkChanged", () => {
        this.stopPollingData();
        this.resetState();
      });
    },

    initialize(userAddress) {
      // This method initializes the dapp

      // We first store the user's address in the component's state

      (this.selectedAddress = userAddress),
        // Then, we initialize ethers, fetch the token's data, and start polling
        // for the user's balance.

        // Fetching the token data and the user's balance are specific to this
        // sample project, but you can reuse the same initialization pattern.
        this.intializeEthers();
      this.getTokenData();
      this.startPollingData();
    },

    async intializeEthers() {
      // We first initialize ethers by creating a provider using window.ethereum
      this.provider = new ethers.providers.Web3Provider(window.ethereum);

      // When, we initialize the contract using that provider and the token's
      // artifact. You can do this same thing with your contracts.
      this.token = new ethers.Contract(
        contractAddress.Token,
        TokenArtifact.abi,
        this.provider.getSigner(0)
      );
    },

    // The next to methods are needed to start and stop polling data. While
    // the data being polled here is specific to this example, you can use this
    // pattern to read any data from your contracts.
    //
    // Note that if you don't need it to update in near real time, you probably
    // don't need to poll it. If that's the case, you can just fetch it when you
    // initialize the app, as we do with the token data.
    startPollingData() {
      this.pollDataInterval = setInterval(() => this.updateBalance(), 1000);

      // We run it once immediately so we don't have to wait for it
      this.updateBalance();
    },

    stopPollingData() {
      clearInterval(this.pollDataInterval);
      this.pollDataInterval = undefined;
    },

    // The next two methods just read from the contract and store the results
    // in the component state.
    async getTokenData() {
      const name = await this.token.name();
      const symbol = await this.token.symbol();

      this.tokenData = { name, symbol };
    },

    async updateBalance() {
      this.balance = await this.token.balanceOf(this.selectedAddress);
    },

    // This method sends an ethereum transaction to transfer tokens.
    // While this action is specific to this application, it illustrates how to
    // send a transaction.
    async transferTokens(to, amount) {
      // Sending a transaction is a complex operation:
      //   - The user can reject it
      //   - It can fail before reaching the ethereum network (i.e. if the user
      //     doesn't have ETH for paying for the tx's gas)
      //   - It has to be mined, so it isn't immediately confirmed.
      //     Note that some testing networks, like Hardhat Network, do mine
      //     transactions immediately, but your dapp should be prepared for
      //     other networks.
      //   - It can fail once mined.
      //
      // This method handles all of those things, so keep reading to learn how to
      // do it.

      try {
        // If a transaction fails, we save that error in the component's state.
        // We only save one such error, so before sending a second transaction, we
        // clear it.
        this.dismissTransactionError();

        // We send the transaction, and save its hash in the Dapp's state. This
        // way we can indicate that we are waiting for it to be mined.
        const tx = await this.token.transfer(to, amount);
        this.txBeingSent = tx.hash;

        // We use .wait() to wait for the transaction to be mined. This method
        // returns the transaction's receipt.
        const receipt = await tx.wait();

        // The receipt, contains a status flag, which is 0 to indicate an error.
        if (receipt.status === 0) {
          // We can't know the exact error that make the transaction fail once it
          // was mined, so we throw this generic one.
          throw new Error("Transaction failed");
        }

        // If we got here, the transaction was successful, so you may want to
        // update your state. Here, we update the user's balance.
        await this.updateBalance();
      } catch (error) {
        // We check the error code to see if this error was produced because the
        // user rejected a tx. If that's the case, we do nothing.
        if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
          return;
        }

        // Other errors are logged and stored in the Dapp's state. This is used to
        // show them to the user, and for debugging.
        console.error(error);
        this.transactionError = error;
      } finally {
        // If we leave the try/catch, we aren't sending a tx anymore, so we clear
        // this part of the state.
        this.txBeingSent = undefined;
      }
    },

    // This method just clears part of the state.
    dismissTransactionError() {
      this.transactionError = undefined;
    },

    // This method just clears part of the state.
    dismissNetworkError() {
      this.networkError = undefined;
    },

    // This is an utility method that turns an RPC error into a human readable
    // message.
    getRpcErrorMessage(error) {
      if (error.data) {
        return error.data.message;
      }

      return error.message;
    },

    shortenAddress(addr) {
      return addr.substring(0, 6) + "..." + addr.substring(38, 42);
    },

    // This method resets the state
    resetState() {
      Object.assign(this.$data, initialData());
    },

    balanceZero() {
      return BigNumber.from(this.balance).eq(0);
    },

    balanceGreaterZero() {
      return BigNumber.from(this.balance).gt(0);
    },

    // This method checks if Metamask selected network is Localhost:8545
    checkNetwork() {
      if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
        return true;
      }

      this.networkError = "Please connect Metamask to Localhost:8545";

      return false;
    },
  },

  computed: {
    checkForWallet() {
      return window.ethereum === undefined;
    },
  },

  mounted() {},
};
</script>
