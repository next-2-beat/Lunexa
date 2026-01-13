const MainClient = require("./structure/client");
require("dotenv").config();

const client = new MainClient();
const wait = require("wait");
(async () => {
  await client.ConnectMongo();
  //await wait(3000);
  await client.loadEvents();
  await client.connect();
})();

module.exports = client;
