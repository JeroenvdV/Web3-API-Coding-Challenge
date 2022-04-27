import Web3 from "web3";
import { Sequelize } from "sequelize";
import { TokenTransfer } from "./models/tokenTransfer";
import { Subscription } from "web3-core-subscriptions";
import { Log } from "web3-core";
import { TokenHolder } from "./models/tokenHolder";
import { TransferController } from "./transferController";
import * as config from "./config";

/**
 * Application logic. Connects to the API and database and handles events.
 */
class DogApp {
  // Websocket subscription to new logs
  private readonly web3: Web3;
  private readonly sequelize: Sequelize;
  private ethSubscription: Subscription<Log> | undefined;

  constructor() {
    // Construct blockchain parsing library instance
    this.web3 = new Web3(config.wsUrl);

    // Connect to database
    this.sequelize = new Sequelize(
      config.dbDatabase,
      config.dbUser,
      config.dbPass,
      {
        host: config.dbHost,
        dialect: "mariadb",
      }
    );

    // Init models
    TokenTransfer.init(TokenTransfer.modelAttributes, {
      sequelize: this.sequelize,
      indexes: TokenTransfer.indexes,
    });
    TokenHolder.init(TokenHolder.modelAttributes, {
      sequelize: this.sequelize,
      indexes: TokenHolder.indexes,
    });

    // Start listening for data
    void this.initialize();
  }

  /**
   * Ensures the database is ready for data and starts listening to data from the API.
   *
   * Also ensures the application closes properly.
   */
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
      // This will create the database tables if needed
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
      // TODO start from last known block number to rebuild the database.
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

  /**
   * Close connections when shutting down
   */
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
