"use strict";
const { Model } = require("sequelize");
const { Op } = require("sequelize");
const today = new Date().toISOString().slice(0, 10);
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static addTodo({ title, dueDate, completed }) {
      return this.create({
        title: title,
        dueDate: dueDate,
        completed: completed,
      });
    }

    static getTodos() {
      return this.findAll();
    }

    static getOverDue() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: today,
          },
        },
      });
    }

    static getDueToday() {
      return this.findAll({
        where: {
          dueDate: today,
        },
      });
    }

    static getDueLater() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: today,
          },
        },
      });
    }

    markAsComplete() {
      return this.update({ completed: true });
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
