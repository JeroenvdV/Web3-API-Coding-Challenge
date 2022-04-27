import Web3 from "web3";
import { Sequelize } from "sequelize";
import { TokenTransfer } from "./models/tokenTransfer";
import * as config from "./config";
import { Subscription } from "web3-core-subscriptions";
import { Log } from "web3-core";
import { TokenHolder } from "./models/tokenHolder";

const web3 = new Web3(config.wsUrl);

const sequelize = new Sequelize(
  config.dbDatabase,
  config.dbUser,
  config.dbPass,
  {
    host: config.dbHost,
    dialect: "mariadb",
  }
);

TokenTransfer.init(TokenTransfer.modelAttributes, { sequelize });
TokenHolder.init(TokenHolder.modelAttributes, { sequelize });

class DogApp {
  private ethSubscription: Subscription<Log> | undefined;

  constructor() {
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
      this.ethSubscription = web3.eth
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
          await this.processData(log);
        })
        .on("changed", async (log) => {
          console.debug("Incoming CHANGED data: ", log.blockNumber, log);
          await this.processData(log);
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
      await sequelize.close();
      console.info("Cleaned up");
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
    process.exit(0);
  }

  // Removes a transfer from the list when it is removed in a ReOrg
  async removeTransfer(
    txHash: string,
    from: string,
    to: string,
    value: string
  ) {
    try {
      const result = await sequelize.transaction(async (t) => {
        // Remove transfer from our index
        await TokenTransfer.findByPk(txHash)
          .then(
            async (tokenTransfer) =>
              await tokenTransfer?.destroy({ transaction: t }).catch((e) => {
                console.warn("Transfer couldn't be removed from database.", e);
              })
          )
          .catch((e) => {
            console.warn(
              "Transfer to be removed couldn't be found in database.",
              e
            );
          });

        // Restore value to the balance of the 'from' address
        await TokenHolder.findOrCreate({
          where: { address: from },
          defaults: { address: from, balance: value },
          transaction: t,
        })
          .then(async ([tokenHolder, created]) => {
            // If we just created the item, don't do anything. Else calculate the new balance and save.
            if (!created) {
              (parseInt(tokenHolder.balance) + parseInt(value)).toString();
              await tokenHolder.save({ transaction: t });
            }
          })
          .catch((e) => {
            console.warn("Transfer couldn't be inserted into database.", e);
          });

        // Remove value from the balance of the 'to' address
        await TokenHolder.findOrCreate({
          where: { address: to },
          defaults: { address: to, balance: -value },
          transaction: t,
        })
          .then(async ([tokenHolder, created]) => {
            // If we just created the item, don't do anything. Else calculate the new balance and save.
            if (!created) {
              tokenHolder.balance = (
                parseInt(tokenHolder.balance) - parseInt(value)
              ).toString();
              await tokenHolder.save({ transaction: t });
            }
          })
          .catch((e) => {
            console.warn("Transfer couldn't be inserted into database.", e);
          });
      });
    } catch (e) {
      console.error(e);
    }
  }

  // Adds a new transfer
  async addTransfer(
    txHash: string,
    from: string,
    to: string,
    value: string,
    blockNumber: number
  ) {
    try {
      const result = await sequelize.transaction(async (t) => {
        // Add transfer to our index
        await TokenTransfer.findOrCreate({
          where: { txHash },
          defaults: { txHash, from, to, value, blockNumber },
          transaction: t,
        }).catch((e) => {
          console.warn("Transfer couldn't be inserted into database.", e);
        });

        // Add value to the balance of the 'to' address
        await TokenHolder.findOrCreate({
          where: { address: to },
          defaults: { address: to, balance: value },
          transaction: t,
        })
          .then(async ([tokenHolder, created]) => {
            // If we just created the item, don't do anything. Else calculate the new balance and save.
            if (!created) {
              (parseInt(tokenHolder.balance) + parseInt(value)).toString();
              await tokenHolder.save({ transaction: t });
            }
          })
          .catch((e) => {
            console.warn("Transfer couldn't be inserted into database.", e);
          });

        // Remove value from the balance of the 'from' address
        await TokenHolder.findOrCreate({
          where: { address: from },
          defaults: { address: from, balance: -value },
          transaction: t,
        })
          .then(async ([tokenHolder, created]) => {
            // If we just created the item, don't do anything. Else calculate the new balance and save.
            if (!created) {
              (parseInt(tokenHolder.balance) - parseInt(value)).toString();
              await tokenHolder.save({ transaction: t });
            }
          })
          .catch((e) => {
            console.warn("Transfer couldn't be inserted into database.", e);
          });
      });
    } catch (e) {
      console.error(e);
    }
  }

  async processData(logData: Log) {
    const inputs = [
      {
        type: "address",
        name: "from",
        indexed: true,
      },
      {
        type: "address",
        name: "to",
        indexed: true,
      },
      {
        type: "uint256",
        name: "value",
      },
    ];

    const decoded = web3.eth.abi.decodeLog(
      inputs,
      logData.data,
      logData.topics.slice(1)
    );

    // This is an error in the type definition
    // @ts-ignore
    if (logData.removed === true) {
      await this.removeTransfer(
        logData.transactionHash,
        decoded.from,
        decoded.to,
        decoded.value
      );
    } else {
      await this.addTransfer(
        logData.transactionHash,
        decoded.from,
        decoded.to,
        decoded.value,
        logData.blockNumber
      );
    }
  }
}

new DogApp();
