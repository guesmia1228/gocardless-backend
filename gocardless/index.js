const gocardless = require("gocardless-nodejs");
const constants = require("gocardless-nodejs/constants");

const dotenv = require("dotenv");
dotenv.config();

const ACCESS_TOKEN = process.env.SANDBOX_ACCESS_TOKEN;

const client = gocardless(ACCESS_TOKEN, constants.Environments.Sandbox);

module.exports = { client };
