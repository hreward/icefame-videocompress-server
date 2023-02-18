const express = require("express");
const controller = require("./controller");

const router = express.Router();
router.get('/', controller.compressVideo);
router.get('/:id', controller.compressVideo);
router.get('/:category/:id', controller.compressVideo);

module.exports = {router};