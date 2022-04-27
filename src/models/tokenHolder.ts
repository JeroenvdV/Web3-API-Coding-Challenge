import { DataTypes, Model } from "sequelize";
import { ModelAttributes } from "sequelize/types/model";

export class TokenHolder extends Model {
  declare address: string;
  declare balance: string;

  static modelAttributes: ModelAttributes = {
    address: {
      type: DataTypes.STRING,
      autoIncrement: false,
      primaryKey: true,
    },
    balance: {
      type: DataTypes.STRING,
    },
  };
}
