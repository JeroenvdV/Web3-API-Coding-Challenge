How to run:

- Set up MySQL or MariaDB somewhere. Create a new database (in my config named 'dogdemo') and put the connection details in config.ts.
- Insert an Alchemy (or other) websockets link into config.ts.
- Install dependencies
  - `npm install`
- Run the application, either:
  - `npx ts-node src/main.ts`
- or:
  - `npx tsc && node lib/main.js`
- Run tests:
  - `npm run test`

Description / notes:

This is an application that processes data from Ethereum about token transfers and indexes that information locally. It does so by continuously 
listening for new data that the API sends that matches the given topic and address so that all the transfers corresponding to The Doge NFT (DOG) token 
are processed. While processing, it keeps track of all token holders' balances by adding and subtracting value indicated by the transfers. It is robust against chain reorganisations.
As the API allows us to specify a starting block for our filter, it can process historical data and rebuild balances from scratch.

The data is stored in two very simple MySQL/MariaDB tables, one for transfer events and one for account balances. This allows for easy and quick 
retrieval even with large amounts of data. For very large amounts, the database (engine) configuration may need tweaking to allow the indexes to fit in memory,
particularly as the transaction hash is very large as a primary key. 

The Web3 package is used to connect to the API and also to parse the data. There is a choice of either a stateless API 
or a streaming one. Although it would be easier to rebuild a historical dataset from the former, I used the latter 
to highlight the real-time nature of the underlying data. 
The Sequelize library is used with the database to take care of things such as table creation and safe queries 
simply across different flavors of SQL. MariaDB is used because it was running on my system and compatible with MySQL. Both
are good choices for the database here because they are powerful enough for very large data sets and the query language is widely understood
so information would be easy to consume.

Known issues:
- There seem to be many duplicate transactions coming in. I assume the filter is not optimal, and that these are indeed duplicate. The program is robust against this.
If they are actually distinct data points, then the primary key should be changed away from the transaction hash to solve the problem.
- Rebuilding the dataset from the first relevant block isn't working. The API most likely returns too much data at once. A batching process can be made to mitigate this. Instead, I only run it with some recent blocks.
- In the interest of time some features were marked with TODO and not implemented.

