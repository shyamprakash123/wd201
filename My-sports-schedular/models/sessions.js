/* eslint-disable no-unused-vars */
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sessions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Sessions.init(
    {
      session_date: DataTypes.DATE,
      session_place: DataTypes.STRING,
      session_members: DataTypes.STRING,
      session_players: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Sessions",
    }
  );
  return Sessions;
};
