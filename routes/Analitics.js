const express = require("express");
const cors = require("cors");
const db = require("../database/SqliteAuto");

const route = express.Router();
route.use(cors());
route.use(express.json());


module.exports = route;