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
const config = __importStar(require("./config"));
const sequelize = new sequelize_1.Sequelize(config.dbDatabase, config.dbUser, config.dbPass, {
    host: config.dbHost,
    dialect: "mariadb",
});
tokenTransfer_1.TokenTransfer.init(tokenTransfer_1.TokenTransfer.modelAttributes, { sequelize });
// const jane = await User.create({
//     username: 'janedoe',
//     birthday: new Date(1980, 6, 20),
// });
//
// const users = await User.findAll();
const web3 = new web3_1.default(config.wsUrl);
const ethSubscription = web3.eth
    .subscribe("logs", {
    fromBlock: config.startBlock,
    address: config.addressFilter,
    topics: config.topicFilter,
})
    .on("connected", function (subscriptionId) {
    console.info("subscription id:", subscriptionId);
})
    .on("data", function (log) {
    console.info("incoming data: ", log.blockNumber, processData(log), log);
})
    .on("changed", function (log) {
    console.info("REMOVE", log);
});
function cleanUp() {
    return __awaiter(this, void 0, void 0, function* () {
        // Unsubscribe from the API
        yield ethSubscription.unsubscribe((_, success) => {
            if (success) {
                console.info("Closed subscription");
            }
        });
        // Close the database connection
        yield sequelize.close();
        console.info("Cleaned up");
        process.exit(0);
    });
}
// Listen to all node events that signify closing the app
let exitSignals = [
    `exit`,
    `SIGINT`,
    `SIGUSR1`,
    `SIGUSR2`,
    `uncaughtException`,
    `SIGTERM`,
];
exitSignals.forEach((eventType) => {
    process.on(eventType, cleanUp.bind(null));
});
//
// // Removes a transfer from the list when it is removed in a ReOrg
// function removeTransfer(txHash) {
// }
// Adds a new transfer
function addTransfer(txHash, from, to, value, blockNumber) {
    // Add transfer to our index
    // TODO await?
    void tokenTransfer_1.TokenTransfer.create({ txHash, from, to, value, blockNumber });
    // Add transfer to the balance of the from and to users
}
function processData(logData) {
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
    const decoded = web3.eth.abi.decodeLog(inputs, logData.data, logData.topics.slice(1));
    addTransfer(logData.transactionHash, decoded.from, decoded.to, decoded.value, logData.blockNumber);
    return decoded;
}
