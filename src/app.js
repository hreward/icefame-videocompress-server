const express = require('express');
const cors = require("cors");

const {router: CompressRouter} = require("./compress/router");

const mapp = express();

var whitelist = ['http://example1.com', 'http://example2.com']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}
mapp.use(cors());
mapp.use(express.json());


mapp.use("/videocompress", CompressRouter);

module.exports = {mapp};