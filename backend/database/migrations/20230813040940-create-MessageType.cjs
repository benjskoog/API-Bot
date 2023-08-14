'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'Messages', // Name of the source table
      'type', // Name of the new column
      {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      'Messages', // Name of the source table
      'type' // Name of the column to remove
    );
  }
};
