"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferController = void 0;
const tokenTransfer_1 = require("./models/tokenTransfer");
const tokenHolder_1 = require("./models/tokenHolder");
/**
 * Handles incoming transfer events
 */
class TransferController {
    /**
     * Process incoming transfer event data.
     *
     * Determines whether the data is an old transfer to be removed,
     * or a new one to be added, and calls the relevant method.
     *
     * @param sequelize   Database connection to use
     * @param log         Relevant Log item from Ethereum blockchain
     * @param decodedLog  Decoded parameters of the smart contract function
     */
    static processData(sequelize, log, decodedLog) {
        return __awaiter(this, void 0, void 0, function* () {
            // There seems to be an error in the type definition
            // @ts-ignore
            if (log.removed === true) {
                yield this.removeTransfer(sequelize, log.transactionHash, decodedLog.from, decodedLog.to, decodedLog.value);
            }
            else {
                yield this.addTransfer(sequelize, log.transactionHash, decodedLog.from, decodedLog.to, decodedLog.value, log.blockNumber);
            }
        });
    }
    /**
     * Adds a new transfer to our index and the balances of the affected accounts.
     *
     * Creates a new balance record for the token holder(s) if needed.
     * Will not have an effect if the transfer is already present.
     *
     * @param sequelize   Database connection to use
     * @param txHash      The transaction hash to identify the transfer
     * @param from        The token sender
     * @param to          The token recipient
     * @param value       The value transferred
     * @param blockNumber The block number that contained this blockchain transaction
     */
    static addTransfer(sequelize, txHash, from, to, value, blockNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield sequelize.transaction((t) => __awaiter(this, void 0, void 0, function* () {
                    // Add transfer to our index
                    yield tokenTransfer_1.TokenTransfer.findOrCreate({
                        where: { txHash },
                        defaults: { txHash, from, to, value, blockNumber },
                        transaction: t,
                    }).catch((e) => {
                        console.warn("Transfer couldn't be inserted into database.", e);
                    });
                    // Add value to the balance of the 'to' address
                    yield tokenHolder_1.TokenHolder.findOrCreate({
                        where: { address: to },
                        defaults: { address: to, balance: value },
                        transaction: t,
                    })
                        .then(([tokenHolder, created]) => __awaiter(this, void 0, void 0, function* () {
                        // If we just created the item, don't do anything. Else calculate the new balance and save.
                        if (!created) {
                            (parseInt(tokenHolder.balance) + parseInt(value)).toString();
                            yield tokenHolder.save({ transaction: t });
                        }
                    }))
                        .catch((e) => {
                        console.warn("Transfer couldn't be inserted into database.", e);
                    });
                    // Remove value from the balance of the 'from' address
                    yield tokenHolder_1.TokenHolder.findOrCreate({
                        where: { address: from },
                        defaults: { address: from, balance: -value },
                        transaction: t,
                    })
                        .then(([tokenHolder, created]) => __awaiter(this, void 0, void 0, function* () {
                        // If we just created the item, don't do anything. Else calculate the new balance and save.
                        if (!created) {
                            (parseInt(tokenHolder.balance) - parseInt(value)).toString();
                            yield tokenHolder.save({ transaction: t });
                        }
                    }))
                        .catch((e) => {
                        console.warn("Transfer couldn't be inserted into database.", e);
                    });
                }));
            }
            catch (e) {
                console.error(e);
            }
        });
    }
    /**
     * Removes a transfer from the list when it is removed in a ReOrg.
     *
     * Creates a new balance record for the token holder(s) if needed.
     * Will not have an effect if the transfer is not already present.
     *
     * @param sequelize   Database connection to use
     * @param txHash      The transaction hash of the transfer to remove
     * @param from        The original token sender
     * @param to          The original token recipient
     * @param value       The value originally transferred
     */
    static removeTransfer(sequelize, txHash, from, to, value) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield sequelize.transaction((t) => __awaiter(this, void 0, void 0, function* () {
                    // Remove transfer from our index
                    yield tokenTransfer_1.TokenTransfer.findByPk(txHash)
                        .then((tokenTransfer) => __awaiter(this, void 0, void 0, function* () {
                        return yield (tokenTransfer === null || tokenTransfer === void 0 ? void 0 : tokenTransfer.destroy({ transaction: t }).catch((e) => {
                            console.warn("Transfer couldn't be removed from database.", e);
                        }));
                    }))
                        .catch((e) => {
                        console.warn("Transfer to be removed couldn't be found in database.", e);
                    });
                    // Restore value to the balance of the 'from' address
                    yield tokenHolder_1.TokenHolder.findOrCreate({
                        where: { address: from },
                        defaults: { address: from, balance: value },
                        transaction: t,
                    })
                        .then(([tokenHolder, created]) => __awaiter(this, void 0, void 0, function* () {
                        // If we just created the item, don't do anything. Else calculate the new balance and save.
                        if (!created) {
                            (parseInt(tokenHolder.balance) + parseInt(value)).toString();
                            yield tokenHolder.save({ transaction: t });
                        }
                    }))
                        .catch((e) => {
                        console.warn("Transfer couldn't be inserted into database.", e);
                    });
                    // Remove value from the balance of the 'to' address
                    yield tokenHolder_1.TokenHolder.findOrCreate({
                        where: { address: to },
                        defaults: { address: to, balance: -value },
                        transaction: t,
                    })
                        .then(([tokenHolder, created]) => __awaiter(this, void 0, void 0, function* () {
                        // If we just created the item, don't do anything. Else calculate the new balance and save.
                        if (!created) {
                            tokenHolder.balance = (parseInt(tokenHolder.balance) - parseInt(value)).toString();
                            yield tokenHolder.save({ transaction: t });
                        }
                    }))
                        .catch((e) => {
                        console.warn("Transfer couldn't be inserted into database.", e);
                    });
                }));
            }
            catch (e) {
                console.error(e);
            }
        });
    }
}
exports.TransferController = TransferController;
