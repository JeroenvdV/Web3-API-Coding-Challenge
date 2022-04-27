import { TokenTransfer } from "./models/tokenTransfer";
import { TokenHolder } from "./models/tokenHolder";
import { Log } from "web3-core";
import { Sequelize } from "sequelize";

/**
 * Handles incoming transfer events
 */
export class TransferController {
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
  static async processData(
    sequelize: Sequelize,
    log: Log,
    decodedLog: { [key: string]: string }
  ) {
    // There seems to be an error in the type definition
    // @ts-ignore
    if (log.removed === true) {
      await this.removeTransfer(
        sequelize,
        log.transactionHash,
        decodedLog.from!,
        decodedLog.to!,
        decodedLog.value!
      );
    } else {
      await this.addTransfer(
        sequelize,
        log.transactionHash,
        decodedLog.from!,
        decodedLog.to!,
        decodedLog.value!,
        log.blockNumber
      );
    }
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
  static async addTransfer(
    sequelize: Sequelize,
    txHash: string,
    from: string,
    to: string,
    value: string,
    blockNumber: number
  ) {
    try {
      await sequelize.transaction(async (t) => {
        // Add transfer to our index
        await TokenTransfer.findOrCreate({
          where: { txHash },
          defaults: { txHash, from, to, value, blockNumber },
          transaction: t,
        }).catch((e) => {
          console.warn("Transfer couldn't be inserted into database.", e);
        });

        // Add value to the balance of the 'to' address
        await TokenHolder.findOrCreate({
          where: { address: to },
          defaults: { address: to, balance: value },
          transaction: t,
        })
          .then(async ([tokenHolder, created]) => {
            // If we just created the item, don't do anything. Else calculate the new balance and save.
            if (!created) {
              (parseInt(tokenHolder.balance) + parseInt(value)).toString();
              await tokenHolder.save({ transaction: t });
            }
          })
          .catch((e) => {
            console.warn("Transfer couldn't be inserted into database.", e);
          });

        // Remove value from the balance of the 'from' address
        await TokenHolder.findOrCreate({
          where: { address: from },
          defaults: { address: from, balance: -value },
          transaction: t,
        })
          .then(async ([tokenHolder, created]) => {
            // If we just created the item, don't do anything. Else calculate the new balance and save.
            if (!created) {
              (parseInt(tokenHolder.balance) - parseInt(value)).toString();
              await tokenHolder.save({ transaction: t });
            }
          })
          .catch((e) => {
            console.warn("Transfer couldn't be inserted into database.", e);
          });
      });
    } catch (e) {
      console.error(e);
    }
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
  static async removeTransfer(
    sequelize: Sequelize,
    txHash: string,
    from: string,
    to: string,
    value: string
  ) {
    try {
      await sequelize.transaction(async (t) => {
        // Remove transfer from our index
        await TokenTransfer.findByPk(txHash)
          .then(
            async (tokenTransfer) =>
              await tokenTransfer?.destroy({ transaction: t }).catch((e) => {
                console.warn("Transfer couldn't be removed from database.", e);
              })
          )
          .catch((e) => {
            console.warn(
              "Transfer to be removed couldn't be found in database.",
              e
            );
          });

        // Restore value to the balance of the 'from' address
        await TokenHolder.findOrCreate({
          where: { address: from },
          defaults: { address: from, balance: value },
          transaction: t,
        })
          .then(async ([tokenHolder, created]) => {
            // If we just created the item, don't do anything. Else calculate the new balance and save.
            if (!created) {
              (parseInt(tokenHolder.balance) + parseInt(value)).toString();
              await tokenHolder.save({ transaction: t });
            }
          })
          .catch((e) => {
            console.warn("Transfer couldn't be inserted into database.", e);
          });

        // Remove value from the balance of the 'to' address
        await TokenHolder.findOrCreate({
          where: { address: to },
          defaults: { address: to, balance: -value },
          transaction: t,
        })
          .then(async ([tokenHolder, created]) => {
            // If we just created the item, don't do anything. Else calculate the new balance and save.
            if (!created) {
              tokenHolder.balance = (
                parseInt(tokenHolder.balance) - parseInt(value)
              ).toString();
              await tokenHolder.save({ transaction: t });
            }
          })
          .catch((e) => {
            console.warn("Transfer couldn't be inserted into database.", e);
          });
      });
    } catch (e) {
      console.error(e);
    }
  }
}
