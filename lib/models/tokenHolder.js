"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenHolder = void 0;
const sequelize_1 = require("sequelize");
// Valid
class TokenHolder extends sequelize_1.Model {}
exports.TokenHolder = TokenHolder;
TokenHolder.modelAttributes = {
  address: {
    type: sequelize_1.DataTypes.STRING,
    autoIncrement: false,
    primaryKey: true,
  },
  balance: {
    type: sequelize_1.DataTypes.STRING,
  },
};
