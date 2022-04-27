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

Development notes:

