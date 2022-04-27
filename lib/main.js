"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = __importDefault(require("web3"));
const sequelize_1 = require("sequelize");
const tokenTransfer_1 = require("./models/tokenTransfer");
const config = __importStar(require("./config"));
const tokenHolder_1 = require("./models/tokenHolder");
const web3 = new web3_1.default(config.wsUrl);
const sequelize = new sequelize_1.Sequelize(
  config.dbDatabase,
  config.dbUser,
  config.dbPass,
  {
    host: config.dbHost,
    dialect: "mariadb",
  }
);
tokenTransfer_1.TokenTransfer.init(
  tokenTransfer_1.TokenTransfer.modelAttributes,
  { sequelize }
);
tokenHolder_1.TokenHolder.init(tokenHolder_1.TokenHolder.modelAttributes, {
  sequelize,
});
class DogApp {
  constructor() {
    void this.initialize();
  }
  initialize() {
    return __awaiter(this, void 0, void 0, function* () {
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
        yield tokenTransfer_1.TokenTransfer.sync();
        yield tokenHolder_1.TokenHolder.sync();
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
          .on("data", (log) =>
            __awaiter(this, void 0, void 0, function* () {
              console.debug("Incoming data: ", log.blockNumber, log);
              yield this.processData(log);
            })
          )
          .on("changed", (log) =>
            __awaiter(this, void 0, void 0, function* () {
              console.debug("Incoming CHANGED data: ", log.blockNumber, log);
              yield this.processData(log);
            })
          );
      } catch (e) {
        console.warn(
          "Couldn't subscribe to blockchain data, nothing will happen.",
          e
        );
      }
    });
  }
  cleanUp() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
      try {
        // Unsubscribe from the API
        yield (_a = this.ethSubscription) === null || _a === void 0
          ? void 0
          : _a.unsubscribe((_, success) => {
              if (success) {
                console.info("Closed subscription");
              }
            });
        // Close the database connection
        yield sequelize.close();
        console.info("Cleaned up");
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
      process.exit(0);
    });
  }
  // Removes a transfer from the list when it is removed in a ReOrg
  removeTransfer(txHash, from, to, value) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield sequelize.transaction((t) =>
          __awaiter(this, void 0, void 0, function* () {
            // Remove transfer from our index
            yield tokenTransfer_1.TokenTransfer.findByPk(txHash)
              .then((tokenTransfer) =>
                __awaiter(this, void 0, void 0, function* () {
                  return yield tokenTransfer === null ||
                  tokenTransfer === void 0
                    ? void 0
                    : tokenTransfer.destroy({ transaction: t }).catch((e) => {
                        console.warn(
                          "Transfer couldn't be removed from database.",
                          e
                        );
                      });
                })
              )
              .catch((e) => {
                console.warn(
                  "Transfer to be removed couldn't be found in database.",
                  e
                );
              });
            // Restore value to the balance of the 'from' address
            yield tokenHolder_1.TokenHolder.findOrCreate({
              where: { address: from },
              defaults: { address: from, balance: value },
              transaction: t,
            })
              .then(([tokenHolder, created]) =>
                __awaiter(this, void 0, void 0, function* () {
                  // If we just created the item, don't do anything. Else calculate the new balance and save.
                  if (!created) {
                    (
                      parseInt(tokenHolder.balance) + parseInt(value)
                    ).toString();
                    yield tokenHolder.save({ transaction: t });
                  }
                })
              )
              .catch((e) => {
                console.warn("Transfer couldn't be inserted into database.", e);
              });
            // Remove value from the balance of the 'to' address
            yield tokenHolder_1.TokenHolder.findOrCreate({
              where: { address: to },
              defaults: { address: to, balance: -value },
              transaction: t,
            })
              .then(([tokenHolder, created]) =>
                __awaiter(this, void 0, void 0, function* () {
                  // If we just created the item, don't do anything. Else calculate the new balance and save.
                  if (!created) {
                    tokenHolder.balance = (
                      parseInt(tokenHolder.balance) - parseInt(value)
                    ).toString();
                    yield tokenHolder.save({ transaction: t });
                  }
                })
              )
              .catch((e) => {
                console.warn("Transfer couldn't be inserted into database.", e);
              });
          })
        );
      } catch (e) {
        console.error(e);
      }
    });
  }
  // Adds a new transfer
  addTransfer(txHash, from, to, value, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
      try {
        const result = yield sequelize.transaction((t) =>
          __awaiter(this, void 0, void 0, function* () {
            // Add transfer to our index
            yield tokenTransfer_1.TokenTransfer.findOrCreate({
              where: { txHash },
              defaults: { txHash, from, to, value, blockNumber },
              transaction: t,
            }).catch((e) => {
              console.warn("Transfer couldn't be inserted into database.", e);
            });
            // Add value to the balance of the 'to' address
            yield tokenHolder_1.TokenHolder.findOrCreate({
              where: { address: to },
              defaults: { address: to, balance: value },
              transaction: t,
            })
              .then(([tokenHolder, created]) =>
                __awaiter(this, void 0, void 0, function* () {
                  // If we just created the item, don't do anything. Else calculate the new balance and save.
                  if (!created) {
                    (
                      parseInt(tokenHolder.balance) + parseInt(value)
                    ).toString();
                    yield tokenHolder.save({ transaction: t });
                  }
                })
              )
              .catch((e) => {
                console.warn("Transfer couldn't be inserted into database.", e);
              });
            // Remove value from the balance of the 'from' address
            yield tokenHolder_1.TokenHolder.findOrCreate({
              where: { address: from },
              defaults: { address: from, balance: -value },
              transaction: t,
            })
              .then(([tokenHolder, created]) =>
                __awaiter(this, void 0, void 0, function* () {
                  // If we just created the item, don't do anything. Else calculate the new balance and save.
                  if (!created) {
                    (
                      parseInt(tokenHolder.balance) - parseInt(value)
                    ).toString();
                    yield tokenHolder.save({ transaction: t });
                  }
                })
              )
              .catch((e) => {
                console.warn("Transfer couldn't be inserted into database.", e);
              });
          })
        );
      } catch (e) {
        console.error(e);
      }
    });
  }
  processData(logData) {
    return __awaiter(this, void 0, void 0, function* () {
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
        yield this.removeTransfer(
          logData.transactionHash,
          decoded.from,
          decoded.to,
          decoded.value
        );
      } else {
        yield this.addTransfer(
          logData.transactionHash,
          decoded.from,
          decoded.to,
          decoded.value,
          logData.blockNumber
        );
      }
    });
  }
}
new DogApp();
