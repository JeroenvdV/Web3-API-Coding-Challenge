import Web3 from "web3";
import { Sequelize } from "sequelize";
import { TokenTransfer } from "./models/tokenTransfer";
import { Subscription } from "web3-core-subscriptions";
import { Log } from "web3-core";
import { TokenHolder } from "./models/tokenHolder";
import { TransferController } from "./transferController";
import * as config from "./config";

class DogApp {
  private ethSubscription: Subscription<Log> | undefined;
  private readonly web3: Web3;
  private readonly sequelize: Sequelize;

  constructor() {
    this.web3 = new Web3(config.wsUrl);

    this.sequelize = new Sequelize(
      config.dbDatabase,
      config.dbUser,
      config.dbPass,
      {
        host: config.dbHost,
        dialect: "mariadb",
      }
    );

    TokenTransfer.init(TokenTransfer.modelAttributes, {
      sequelize: this.sequelize,
    });
    TokenHolder.init(TokenHolder.modelAttributes, {
      sequelize: this.sequelize,
    });

    void this.initialize();
  }

  async initialize() {
    try {
      // Listen to all node events that signify closing the app and shut down
      config.exitSignals.forEach((eventType) => {
        process.on(eventType, this.cleanUp.bind(this));
      });
    } catch (e) {
      console.warn("Error trying to register the shutdown handler.", e);
    }

    try {
      // This will create the tables if needed
      await TokenTransfer.sync();
      await TokenHolder.sync();
    } catch (e) {
      console.error(
        "Couldn't create or sync the database tables, quitting.",
        e
      );
      process.exit(1);
    }

    try {
      // Listen to new data on the blockchain
      // TODO start from last block number
      this.ethSubscription = this.web3.eth
        .subscribe("logs", {
          fromBlock: config.startBlock,
          address: config.addressFilter,
          topics: config.topicFilter,
        })
        .on("connected", function (subscriptionId) {
          console.debug("Subscription id:", subscriptionId);
        })
        .on("data", async (log) => {
          console.debug("Incoming data: ", log.blockNumber, log);

          const decodedLog = this.web3.eth.abi.decodeLog(
            config.transferFunctionInputs,
            log.data,
            log.topics.slice(1)
          );
          await TransferController.processData(this.sequelize, log, decodedLog);
        })
        .on("changed", async (log) => {
          console.debug("Incoming CHANGED data: ", log.blockNumber, log);

          const decodedLog = this.web3.eth.abi.decodeLog(
            config.transferFunctionInputs,
            log.data,
            log.topics.slice(1)
          );
          await TransferController.processData(this.sequelize, log, decodedLog);
        });
    } catch (e) {
      console.warn(
        "Couldn't subscribe to blockchain data, nothing will happen.",
        e
      );
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
      await this.sequelize.close();
      console.info("Cleaned up");
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
    process.exit(0);
  }
}

new DogApp();
