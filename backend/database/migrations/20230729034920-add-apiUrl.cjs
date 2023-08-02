'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Apps', // name of the source table
      'apiUrl', // name of the new column
      {
        type: Sequelize.STRING,
        allowNull: true,
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Apps', // name of the source table
      'apiUrl' // name of the column to remove
    );
  }
};
