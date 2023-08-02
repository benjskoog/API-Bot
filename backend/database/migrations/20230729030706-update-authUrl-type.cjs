'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Apps', 'authUrl', {
      type: Sequelize.TEXT,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Change it back to the original type in your down migration
    // Replace "OriginalType" with the previous type of 'authUrl'
    await queryInterface.changeColumn('Apps', 'authUrl', {
      type: Sequelize.OriginalType,
      allowNull: false
    });
  }
};
