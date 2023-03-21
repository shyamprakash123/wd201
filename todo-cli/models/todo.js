// models/todo.js
"use strict";
const { Model } = require("sequelize");
const { Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static async addTask(params) {
      return await Todo.create(params);
    }
    static associate(models) {
      // define association here
    }

    static async showList() {
      console.log("My Todo list \n");

      console.log("Overdue");
      // FILL IN HERE
      const overdues = await this.overdue();
      let list = [];
      await overdues.forEach((todo) => {
        list.push(todo.displayableString());
      });
      console.log(list.join("\n"));
      console.log("\n");

      console.log("Due Today");
      // FILL IN HERE
      const todaydues = await this.dueToday();
      list = [];
      await todaydues.forEach((todo) => {
        list.push(todo.displayableString());
      });
      console.log(list.join("\n"));
      console.log("\n");

      console.log("Due Later");
      // FILL IN HERE
      const laterdues = await this.dueLater();
      list = [];
      await laterdues.forEach((todo) => {
        list.push(todo.displayableString());
      });
      console.log(list.join("\n"));
    }

    static async overdue() {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      try {
        const today = new Date().toISOString().split("T")[0];
        const totalCount = await Todo.findAll({
          where: {
            dueDate: {
              [Op.lt]: today,
            },
          },
        });
        return totalCount;
      } catch (error) {
        console.error(error);
      }
    }

    static async dueToday() {
      // FILL IN HERE TO RETURN ITEMS DUE tODAY
      try {
        const today = new Date().toISOString().split("T")[0];
        const totalCount = await Todo.findAll({
          where: {
            dueDate: today,
          },
        });
        let list = [];
        totalCount.forEach((todo) => {
          todo.dueDate = "";
          list.push(todo);
        });
        return list;
      } catch (error) {
        console.error(error);
      }
    }

    static async dueLater() {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      try {
        const today = new Date().toISOString().split("T")[0];
        const totalCount = await Todo.findAll({
          where: {
            dueDate: {
              [Op.gt]: today,
            },
          },
        });
        return totalCount;
      } catch (error) {
        console.error(error);
      }
    }

    static async markAsComplete(id) {
      // FILL IN HERE TO MARK AN ITEM AS COMPLETE
      try {
        await Todo.update(
          { completed: true },
          {
            where: {
              id: id,
            },
          }
        );
      } catch (error) {
        console.error(error);
      }
    }

    displayableString() {
      let checkbox = this.completed ? "[x]" : "[ ]";
      return `${this.id}. ${checkbox} ${this.title} ${this.dueDate}`;
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
