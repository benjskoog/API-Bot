'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'UserApps', // Name of the source table
      'apiUrl', // Name of the new column
      {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      'UserApps', // Name of the source table
      'apiUrl' // Name of the column to remove
    );
  }
};
