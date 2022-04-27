"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenTransfer = void 0;
const sequelize_1 = require("sequelize");
// Valid
class TokenTransfer extends sequelize_1.Model {
}
exports.TokenTransfer = TokenTransfer;
TokenTransfer.modelAttributes = {
    txHash: {
        type: sequelize_1.DataTypes.STRING,
        autoIncrement: false,
        primaryKey: true,
    },
    from: {
        type: sequelize_1.DataTypes.STRING,
    },
    to: {
        type: sequelize_1.DataTypes.STRING,
    },
    value: {
        type: sequelize_1.DataTypes.STRING,
    },
    blockNumber: {
        type: sequelize_1.DataTypes.INTEGER,
    },
};
