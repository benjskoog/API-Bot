'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      'UserApps', // Name of the source table
      'domainUrl' // Name of the column to remove
    );

    await queryInterface.addColumn(
      'UserApps', // Name of the source table
      'userInputs', // Name of the new column
      {
        type: Sequelize.DataTypes.JSON,
        allowNull: true,
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'UserApps', // Name of the source table
      'domainUrl', // Name of the column to add back
      {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
      }
    );

    await queryInterface.removeColumn(
      'UserApps', // Name of the source table
      'userInputs' // Name of the column to remove
    );
  }
};
