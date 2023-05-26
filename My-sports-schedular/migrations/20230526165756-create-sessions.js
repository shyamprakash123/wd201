/* eslint-disable no-unused-vars */
"use strict";

const { DataTypes } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Sessions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      dateTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      place: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      members: {
        type: Sequelize.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
      sportName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      players: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      isCanceled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Sessions");
  },
};
