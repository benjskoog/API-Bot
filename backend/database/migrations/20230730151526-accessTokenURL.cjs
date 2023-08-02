'use strict';

/** @type {import('sequelize-cli').Migration} */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Rename accessTokenExample to accessTokenUrl
    await queryInterface.renameColumn('Apps', 'accessTokenExample', 'accessTokenUrl', {
      type: Sequelize.TEXT,
      allowNull: false
    });

    // Remove refreshTokenExample column
    await queryInterface.removeColumn('Apps', 'refreshTokenExample');
  },

  down: async (queryInterface, Sequelize) => {
    // Reverse the changes made in the up function

    // Rename accessTokenUrl back to accessTokenExample
    await queryInterface.renameColumn('Apps', 'accessTokenUrl', 'accessTokenExample', {
      type: Sequelize.TEXT,
      allowNull: false
    });

    // Re-add refreshTokenExample column
    await queryInterface.addColumn('Apps', 'refreshTokenExample', {
      type: Sequelize.TEXT,
      allowNull: false
    });
  }
};

