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
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

// Define Request model
const Request = sequelize.define('Request', {
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
  userRequest: {
    type: DataTypes.TEXT,
    allowNull: false
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
  tasks: {
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
  systemName: {
    type: DataTypes.TEXT,
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
  authFlowType: {
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

const Documentation = sequelize.define('Documentation', {
  id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    defaultValue: DataTypes.UUIDV4
  },
  vecId: {
    type: DataTypes.UUID,
    allowNull: true // makes it mandatory
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false // makes it mandatory
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false // makes it mandatory
  },
  method: {
    type: DataTypes.STRING,
    allowNull: false // makes it mandatory
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true // makes it mandatory
  },
  botSummary: {
    type: DataTypes.TEXT,
    allowNull: true // makes it mandatory
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true // makes it mandatory
  },
  botDescription: {
    type: DataTypes.TEXT,
    allowNull: true // makes it mandatory
  },
  specification: {
    type: DataTypes.JSON,
    allowNull: false // makes it mandatory
  },
  next: {
    type: DataTypes.JSON, // stores metadata
    allowNull: true // makes it optional
  },
  appId: {
    type: DataTypes.UUID,
    references: {
      model: App,
      key: 'id'
    },
    allowNull: false
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
  apiUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  appUserId: {
    type: DataTypes.STRING,
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


// App - Documentation relationship
App.hasMany(Documentation, {
  onDelete: 'CASCADE', // if an App is deleted, also delete its associated Documentation
  foreignKey: 'appId'
});
Documentation.belongsTo(App, {
  foreignKey: 'appId'
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

// Conversation - Request relationship
Conversation.hasMany(Request, {
  foreignKey: 'conversationId'
});
Request.belongsTo(Conversation, {
  foreignKey: 'conversationId'
});

User.hasMany(PasswordResetToken, { foreignKey: 'userId' });
PasswordResetToken.belongsTo(User, { foreignKey: 'userId' });

export { User, Conversation, Message, Request, App, PasswordResetToken, UserApp, Documentation };
