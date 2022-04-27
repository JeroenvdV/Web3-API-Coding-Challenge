"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenHolder = void 0;
const sequelize_1 = require("sequelize");
class TokenHolder extends sequelize_1.Model {
}
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
TokenHolder.indexes = [
    // Create an index to search by balance (for ranking)
    {
        name: "balance_index",
        fields: ["balance"],
    },
];
