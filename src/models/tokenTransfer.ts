import { DataTypes, Model } from "sequelize";
import { ModelAttributes } from "sequelize/types/model";

// Valid
export class TokenTransfer extends Model {
  declare txHash: string;
  declare from: string;
  declare to: string;
  declare value: number;
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
}
