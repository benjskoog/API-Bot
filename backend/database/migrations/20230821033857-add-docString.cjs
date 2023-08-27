'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'Requests', // Name of the source table
      'docString', // Name of the new column
      {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      'Requests', // Name of the source table
      'docString' // Name of the column to remove
    );
  }
};
