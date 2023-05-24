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
      Sessions.belongsTo(models.Sports, {
        foreignKey: "sportId",
      });
      // define association here
    }

    static getSessionBySId(sportId) {
      return this.findAll({
        where: {
          sportId: sportId,
        },
      });
    }

    static getSessionById(id) {
      return this.findAll({
        where: {
          id,
        },
      });
    }

    static newSession(date, place, members, players, userId, sportId) {
      return this.create({
        dateTime: date,
        place: place,
        members: members,
        players: players,
        userId: userId,
        sportId: sportId,
        isCanceled: false,
      });
    }
  }
  Sessions.init(
    {
      dateTime: DataTypes.DATE,
      place: DataTypes.STRING,
      members: DataTypes.ARRAY(DataTypes.STRING),
      players: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      isCanceled: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Sessions",
    }
  );
  return Sessions;
};
