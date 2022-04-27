export const wsUrl =
  "wss://eth-mainnet.alchemyapi.io/v2/...";

export const dbHost = "localhost";
export const dbUser = "root"; // Create a spceific user for this application
export const dbPass = "root";
export const dbDatabase = "dogdemo";

export const startBlock = 14665637;
//export const earliestStartBlock = 13130302; // The contract was created here
export const addressFilter = "0xbaac2b4491727d78d2b78815144570b9f2fe8899";
export const topicFilter = [
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
];

export const exitSignals: string[] = [
  `exit`,
  `SIGINT`,
  `SIGUSR1`,
  `SIGUSR2`,
  `uncaughtException`,
  `SIGTERM`,
];

export const transferFunctionInputs = [
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
