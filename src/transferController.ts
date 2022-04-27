import { TokenTransfer } from "./models/tokenTransfer";
import { TokenHolder } from "./models/tokenHolder";
import { Log } from "web3-core";
import { Sequelize } from "sequelize";

export class TransferController {
  // Removes a transfer from the list when it is removed in a ReOrg
  static async removeTransfer(
    sequelize: Sequelize,
    txHash: string,
    from: string,
    to: string,
    value: string
  ) {
    try {
      const result = await sequelize.transaction(async (t) => {
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

  // Adds a new transfer
  static async addTransfer(
    sequelize: Sequelize,
    txHash: string,
    from: string,
    to: string,
    value: string,
    blockNumber: number
  ) {
    try {
      const result = await sequelize.transaction(async (t) => {
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
}
