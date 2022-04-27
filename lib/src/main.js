"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = __importDefault(require("web3"));
const sequelize_1 = require("sequelize");
const tokenTransfer_1 = require("./models/tokenTransfer");
const tokenHolder_1 = require("./models/tokenHolder");
const transferController_1 = require("./transferController");
const config = __importStar(require("./config"));
/**
 * Application logic. Connects to the API and database and handles events.
 */
class DogApp {
    constructor() {
        // Construct blockchain parsing library instance
        this.web3 = new web3_1.default(config.wsUrl);
        // Connect to database
        this.sequelize = new sequelize_1.Sequelize(config.dbDatabase, config.dbUser, config.dbPass, {
            host: config.dbHost,
            dialect: "mariadb",
        });
        // Init models
        tokenTransfer_1.TokenTransfer.init(tokenTransfer_1.TokenTransfer.modelAttributes, {
            sequelize: this.sequelize,
            indexes: tokenTransfer_1.TokenTransfer.indexes,
        });
        tokenHolder_1.TokenHolder.init(tokenHolder_1.TokenHolder.modelAttributes, {
            sequelize: this.sequelize,
            indexes: tokenHolder_1.TokenHolder.indexes,
        });
        // Start listening for data
        void this.initialize();
    }
    /**
     * Ensures the database is ready for data and starts listening to data from the API.
     *
     * Also ensures the application closes properly.
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Listen to all node events that signify closing the app and shut down
                config.exitSignals.forEach((eventType) => {
                    process.on(eventType, this.cleanUp.bind(this));
                });
            }
            catch (e) {
                console.warn("Error trying to register the shutdown handler.", e);
            }
            try {
                // This will create the database tables if needed
                yield tokenTransfer_1.TokenTransfer.sync();
                yield tokenHolder_1.TokenHolder.sync();
            }
            catch (e) {
                console.error("Couldn't create or sync the database tables, quitting.", e);
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
                    .on("data", (log) => __awaiter(this, void 0, void 0, function* () {
                    console.debug("Incoming data: ", log.blockNumber, log);
                    const decodedLog = this.web3.eth.abi.decodeLog(config.transferFunctionInputs, log.data, log.topics.slice(1));
                    yield transferController_1.TransferController.processData(this.sequelize, log, decodedLog);
                }))
                    .on("changed", (log) => __awaiter(this, void 0, void 0, function* () {
                    console.debug("Incoming CHANGED data: ", log.blockNumber, log);
                    const decodedLog = this.web3.eth.abi.decodeLog(config.transferFunctionInputs, log.data, log.topics.slice(1));
                    yield transferController_1.TransferController.processData(this.sequelize, log, decodedLog);
                }));
            }
            catch (e) {
                console.warn("Couldn't subscribe to blockchain data, nothing will happen.", e);
            }
        });
    }
    /**
     * Close connections when shutting down
     */
    cleanUp() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Unsubscribe from the API
                yield ((_a = this.ethSubscription) === null || _a === void 0 ? void 0 : _a.unsubscribe((_, success) => {
                    if (success) {
                        console.info("Closed subscription");
                    }
                }));
                // Close the database connection
                yield this.sequelize.close();
                console.info("Cleaned up");
            }
            catch (e) {
                console.error(e);
                process.exit(1);
            }
            process.exit(0);
        });
    }
}
new DogApp();
