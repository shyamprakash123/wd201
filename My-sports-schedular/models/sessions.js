"use strict";
const { Model, Op } = require("sequelize");
const today = new Date();
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);
const todayEnd = new Date();
todayEnd.setHours(23, 59, 59, 999);
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
          isCanceled: false,
          dateTime: {
            [Op.gt]: today,
          },
        },
      });
    }

    static getESessionBySId(sportId) {
      return this.findAll({
        where: {
          sportId: sportId,
          isCanceled: false,
          dateTime: {
            [Op.lt]: today,
          },
        },
      });
    }

    static getSessionById(id) {
      return this.findAll({
        where: {
          id,
          isCanceled: false,
        },
      });
    }

    static getESessionById(id) {
      return this.findAll({
        where: {
          id,
          isCanceled: true,
        },
      });
    }

    static getPreviousSessionsByIds(ids) {
      return this.findAll({
        where: {
          id: ids,
          isCanceled: false,
          dateTime: {
            [Op.lt]: today,
          },
        },
      });
    }

    static getCanceledSessionsByIds(ids) {
      return this.findAll({
        where: {
          id: ids,
          isCanceled: true,
        },
      });
    }

    static newSession(
      date,
      place,
      members,
      sportName,
      players,
      userId,
      sportId
    ) {
      return this.create({
        dateTime: date,
        place: place,
        members: members,
        sportName: sportName,
        players: players,
        userId: userId,
        sportId: sportId,
        isCanceled: false,
      });
    }

    static deleteMember(members, sessionId) {
      return this.update(
        {
          members: members,
        },
        {
          where: {
            id: sessionId,
          },
        }
      );
    }

    static sessionUpdate(dateTime, place, members, players, sessionId) {
      return this.update(
        {
          dateTime: dateTime,
          place: place,
          members: members,
          players: players,
        },
        {
          where: {
            id: sessionId,
          },
        }
      );
    }

    static updatePlayers(noPlayers, sessionId) {
      return this.update(
        {
          players: noPlayers,
        },
        {
          where: {
            id: sessionId,
          },
        }
      );
    }

    static cancelSession(sessionId, reason) {
      return this.update(
        {
          isCanceled: true,
          reason: reason,
        },
        {
          where: {
            id: sessionId,
          },
        }
      );
    }

    static getSessionByUId(userId) {
      return this.findAll({
        where: {
          userId,
        },
      });
    }

    static getSessionBySesId(ids) {
      return this.findAll({
        where: {
          id: ids,
          dateTime: {
            [Op.not]: {
              [Op.lt]: today,
            },
          },
        },
      });
    }

    static updateSportsNames(oldSportName, newSportName) {
      return this.update(
        {
          sportName: newSportName,
        },
        {
          where: {
            sportName: oldSportName,
          },
        }
      );
    }

    static deleteSessionBySName(sportName) {
      return this.destroy({
        where: {
          sportName,
        },
      });
    }

    static getTotalSessionsCount() {
      return this.count();
    }

    static getSessionsCountBySName(sportName, start, end) {
      if (start !== "null" && end !== "null") {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return this.count({
          where: {
            sportName,
            dateTime: {
              [Op.and]: {
                [Op.gt]: startDate,
                [Op.lt]: endDate,
              },
            },
          },
        });
      } else {
        return this.count({
          where: {
            sportName,
          },
        });
      }
    }

    static getPreviousSessions(sportName, start, end) {
      if (start !== "null" && end !== "null") {
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);
        return this.findAll({
          where: {
            sportName,
            isCanceled: false,
            dateTime: {
              [Op.lt]: startDate,
            },
          },
        });
      } else {
        return this.findAll({
          where: {
            sportName,
            isCanceled: false,
            dateTime: {
              [Op.lt]: todayStart,
            },
          },
        });
      }
    }

    static getTodaysSessions(sportName, start, end) {
      if (start !== "null" && end !== "null") {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return this.findAll({
          where: {
            sportName,
            isCanceled: false,
            dateTime: {
              [Op.and]: {
                [Op.gt]: startDate,
                [Op.lt]: endDate,
              },
            },
          },
        });
      } else {
        return this.findAll({
          where: {
            sportName,
            isCanceled: false,
            dateTime: {
              [Op.and]: {
                [Op.gt]: todayStart,
                [Op.lt]: todayEnd,
              },
            },
          },
        });
      }
    }

    static getUpcomingSessions(sportName, start, end) {
      if (start !== "null" && end !== "null") {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        return this.findAll({
          where: {
            sportName,
            isCanceled: false,
            dateTime: {
              [Op.gt]: endDate,
            },
          },
        });
      } else {
        return this.findAll({
          where: {
            sportName,
            isCanceled: false,
            dateTime: {
              [Op.gt]: todayEnd,
            },
          },
        });
      }
    }

    static getCanceledSessions(sportName, start, end) {
      if (start !== "null" && end !== "null") {
        const startDate = new Date(start);
        const endDate = new Date(end);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return this.findAll({
          where: {
            sportName,
            isCanceled: true,
            dateTime: {
              [Op.and]: {
                [Op.gt]: startDate,
                [Op.lt]: endDate,
              },
            },
          },
        });
      } else {
        return this.findAll({
          where: {
            sportName,
            isCanceled: true,
          },
        });
      }
    }

    static getSessionsWithSIdT(sessionId, dateTime) {
      return this.findAll({
        where: { id: sessionId, dateTime: dateTime, isCanceled: false },
      });
    }
  }

  Sessions.init(
    {
      dateTime: DataTypes.DATE,
      place: DataTypes.STRING,
      members: DataTypes.ARRAY(DataTypes.STRING),
      sportName: DataTypes.STRING,
      players: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      isCanceled: DataTypes.BOOLEAN,
      reason: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Sessions",
    }
  );
  return Sessions;
};
