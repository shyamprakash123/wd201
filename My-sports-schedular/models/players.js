/* eslint-disable no-unused-vars */
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Players extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static addPlayers(userId, sessionId, userName) {
      return this.create({
        userId,
        sessionId,
        userName,
      });
    }

    static getPlayersBySId(id) {
      return this.findAll({
        where: {
          sessionId: id,
        },
      });
    }
  }
  Players.init(
    {
      userId: DataTypes.INTEGER,
      sessionId: DataTypes.INTEGER,
      userName: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Players",
    }
  );
  return Players;
};
