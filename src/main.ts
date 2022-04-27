import Web3 from "web3";
import { Sequelize } from "sequelize";
import { TokenTransfer } from "./models/tokenTransfer";
import * as config from "./config";
import { Subscription } from "web3-core-subscriptions";
import { Log } from "web3-core";

const web3 = new Web3(config.wsUrl);

const sequelize = new Sequelize(
  config.dbDatabase,
  config.dbUser,
  config.dbPass,
  {
    host: config.dbHost,
    dialect: "mariadb"
  }
);

TokenTransfer.init(TokenTransfer.modelAttributes, { sequelize });


class DogApp {
  private ethSubscription: Subscription<Log> | undefined;

  constructor() {
    void this.initialize();
  }

  async initialize() {
    try {
      // Listen to all node events that signify closing the app and shut down
      config.exitSignals.forEach(eventType => {
        process.on(eventType, this.cleanUp.bind(this));
      });
    } catch (e) {
      console.warn("Error trying to register the shutdown handler.", e);
    }

    try {
      // This will create the tables if needed
      await TokenTransfer.sync();
    } catch (e) {
      console.error("Couldn't create or sync the database tables, quitting.", e);
      process.exit(1);
    }

    try {
      // Listen to new data on the blockchain
      this.ethSubscription = web3.eth
        .subscribe("logs", {
          fromBlock: config.startBlock,
          address: config.addressFilter,
          topics: config.topicFilter
        })
        .on("connected", function(subscriptionId) {
          console.info("subscription id:", subscriptionId);
        })
        .on("data", (log) => {
          console.info("incoming data: ", log.blockNumber, this.processData(log), log);
        })
        .on("changed", function(log) {
          console.info("REMOVE", log);
        });
    } catch (e) {
      console.warn("Couldn't subscribe to blockchain data, nothing will happen.", e);
    }
  }

  async cleanUp() {
    try {
      // Unsubscribe from the API
      await this.ethSubscription?.unsubscribe((_: any, success: boolean) => {
        if (success) {
          console.info("Closed subscription");
        }
      });

      // Close the database connection
      await sequelize.close();
      console.info("Cleaned up");
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
    process.exit(0);
  }


//
// // Removes a transfer from the list when it is removed in a ReOrg
//  removeTransfer(txHash) {
// }

// Adds a new transfer
  addTransfer(
    txHash: string,
    from: string,
    to: string,
    value: string,
    blockNumber: number
  ) {
    // Add transfer to our index
    // TODO await?
    void TokenTransfer
      .findOrCreate({
        where: { txHash },
        defaults: { txHash, from, to, value, blockNumber }
      })
      .catch(e => {
        console.warn("Transfer couldn't be inserted into database.", e);
      });
    // Add transfer to the balance of the from and to users
  }

  processData(logData: Log) {
    const inputs = [
      {
        type: "address",
        name: "from",
        indexed: true
      },
      {
        type: "address",
        name: "to",
        indexed: true
      },
      {
        type: "uint256",
        name: "value"
      }
    ];

    const decoded = web3.eth.abi.decodeLog(
      inputs,
      logData.data,
      logData.topics.slice(1)
    );
    this.addTransfer(
      logData.transactionHash,
      decoded.from,
      decoded.to,
      decoded.value,
      logData.blockNumber
    );
    return decoded;
  }
}

new DogApp();