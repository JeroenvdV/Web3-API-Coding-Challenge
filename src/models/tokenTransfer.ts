import { DataTypes, Model } from "sequelize";
import { ModelAttributes } from "sequelize/types/model";

export class TokenTransfer extends Model {
  declare txHash: string;
  declare from: string;
  declare to: string;
  declare value: string;
  declare blockNumber: number;

  static modelAttributes: ModelAttributes = {
    txHash: {
      type: DataTypes.STRING,
      autoIncrement: false,
      primaryKey: true,
    },
    from: {
      type: DataTypes.STRING,
    },
    to: {
      type: DataTypes.STRING,
    },
    value: {
      type: DataTypes.STRING,
    },
    blockNumber: {
      type: DataTypes.INTEGER,
    },
  };

  static indexes = [
    // Create an index to search by addresses (from and to)
    {
      name: "from_index",
      fields: ["from"],
    },
    {
      name: "to_index",
      fields: ["to"],
    },
  ];
}
