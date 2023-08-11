'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'Apps', // Name of the source table
      'systemName', // Name of the new column
      {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      'Apps', // Name of the source table
      'systemName' // Name of the column to remove
    );
  }
};
