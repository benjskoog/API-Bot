import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

// Define User model
const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true,
        defaultValue: DataTypes.UUIDV4
    },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Define Conversation model
const Conversation = sequelize.define('Conversation', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true,
        defaultValue: DataTypes.UUIDV4
    },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: User, 
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Define Message model
const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true,
        defaultValue: DataTypes.UUIDV4
    },
  conversationId: {
    type: DataTypes.UUID,
    references: {
      model: Conversation, 
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: User, 
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

// Define APIRequest model
const APIRequest = sequelize.define('APIRequest', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true,
        defaultValue: DataTypes.UUIDV4
    },
  conversationId: {
    type: DataTypes.UUID,
    references: {
      model: Conversation, 
      key: 'id'
    }
  },
  endpoint: {
    type: DataTypes.STRING,
    allowNull: false
  },
  requestPayload: {
    type: DataTypes.JSON,
    allowNull: true
  },
  responsePayload: {
    type: DataTypes.JSON,
    allowNull: true
  },
  statusCode: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

// Update App model
const App = sequelize.define('App', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true,
        defaultValue: DataTypes.UUIDV4
    },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  clientId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  clientSecret: {
    type: DataTypes.STRING,
    allowNull: false
  },
  authType: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  authUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accessTokenUrl: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  documentationUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  apiUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  documentation: {
    type: DataTypes.JSON,
    allowNull: true
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  formFields: {
    type: DataTypes.JSON,
    allowNull: true
  }

});

// New UserApp model
const UserApp = sequelize.define('UserApp', {
  id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    defaultValue: DataTypes.UUIDV4
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  appId: {
    type: DataTypes.UUID,
    references: {
      model: App,
      key: 'id'
    }
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  apiKey: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  userInputs: {
    type: DataTypes.JSON,
    allowNull: true
  },
  // Any other fields needed for authentication or configuration with the app
});

const PasswordResetToken = sequelize.define('PasswordResetToken', {
  id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      unique: true,
      defaultValue: DataTypes.UUIDV4
  },
  userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
          model: User, 
          key: 'id'
      }
  },
  token: {
      type: DataTypes.TEXT,
      allowNull: false
  },
  expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
  }
});

// User - UserApp relationship
User.hasMany(UserApp, {
  foreignKey: 'userId'
});
UserApp.belongsTo(User, {
  foreignKey: 'userId'
});

// App - UserApp relationship
App.hasMany(UserApp, {
  as: 'userApps', // Alias
  foreignKey: 'appId',
});
UserApp.belongsTo(App, {
  foreignKey: 'appId',
});


// User - Conversation relationship
User.hasMany(Conversation, {
  foreignKey: 'userId'
});
Conversation.belongsTo(User, {
  foreignKey: 'userId'
});

// User - Message relationship
User.hasMany(Message, {
  foreignKey: 'userId'
});
Message.belongsTo(User, {
  foreignKey: 'userId'
});

// Conversation - Message relationship
Conversation.hasMany(Message, {
  foreignKey: 'conversationId'
});
Message.belongsTo(Conversation, {
  foreignKey: 'conversationId'
});

// Conversation - APIRequest relationship
Conversation.hasMany(APIRequest, {
  foreignKey: 'conversationId'
});
APIRequest.belongsTo(Conversation, {
  foreignKey: 'conversationId'
});

User.hasMany(PasswordResetToken, { foreignKey: 'userId' });
PasswordResetToken.belongsTo(User, { foreignKey: 'userId' });

export { User, Conversation, Message, APIRequest, App, PasswordResetToken, UserApp };
