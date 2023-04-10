const mysql = require('mysql');

// const con = mysql.createConnection({
var con  = mysql.createPool({
  connectionLimit : 10,
  host: "localhost",
  user: "",
  password: "",
  database: ""
});

module.exports = con;
