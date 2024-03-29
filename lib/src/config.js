"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferFunctionInputs = exports.exitSignals = exports.topicFilter = exports.addressFilter = exports.startBlock = exports.dbDatabase = exports.dbPass = exports.dbUser = exports.dbHost = exports.wsUrl = void 0;
exports.wsUrl = "wss://eth-mainnet.alchemyapi.io/v2/...";
exports.dbHost = "localhost";
exports.dbUser = "root"; // Create a spceific user for this application
exports.dbPass = "root";
exports.dbDatabase = "dogdemo";
exports.startBlock = 14665637;
//export const earliestStartBlock = 13130302; // The contract was created here
exports.addressFilter = "0xbaac2b4491727d78d2b78815144570b9f2fe8899";
exports.topicFilter = [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
];
exports.exitSignals = [
    `exit`,
    `SIGINT`,
    `SIGUSR1`,
    `SIGUSR2`,
    `uncaughtException`,
    `SIGTERM`,
];
exports.transferFunctionInputs = [
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
