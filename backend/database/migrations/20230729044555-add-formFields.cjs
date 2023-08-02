'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'Apps', // Name of the source table
      'formFields', // Name of the new column
      {
        type: Sequelize.DataTypes.JSON,
        allowNull: true,
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      'Apps', // Name of the source table
      'formFields' // Name of the column to remove
    );
  }
};
