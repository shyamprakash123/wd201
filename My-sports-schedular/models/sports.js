/* eslint-disable no-unused-vars */
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sports extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Sports.hasMany(models.Sessions, {
        foreignKey: "sportId",
      });
      // define association here
    }

    static getSportByName(name) {
      return this.findAll({
        where: {
          sports_name: name,
        },
      });
    }

    static getAllSports() {
      return this.findAll();
    }

    static getSportsByAdminId(adminId) {
      return this.findAll({
        where: {
          adminId: adminId,
        },
      });
    }

    static addNewSport(sportName, adminId) {
      return this.create({
        sports_name: sportName,
        adminId: adminId,
      });
    }

    static updateSportName(sportName, sportId) {
      return this.update(
        {
          sports_name: sportName,
        },
        {
          where: {
            id: sportId,
          },
        }
      );
    }

    static getSportById(id) {
      return this.findAll({
        where: {
          id,
        },
      });
    }

    static deleteSportById(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }
  }
  Sports.init(
    {
      sports_name: DataTypes.STRING,
      adminId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Sports",
    }
  );
  return Sports;
};
