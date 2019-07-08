module.exports = function(sequelize, DataTypes) {
    let chatroom_info= sequelize.define('chatroom_info', {
        chatroom_id: {
            type : DataTypes.STRING(50),
            references: {
                model: 'chatroom',
                key: 'chatroom_id'
            },
            primaryKey : true
        },
        chatroom_title : {
            type : DataTypes.STRING(100),
            allowNull : true
        },
        user_id : {
            type : DataTypes.INTEGER(10).UNSIGNED,
            references: {
                model: 'user',
                key: 'id'
            },
            primaryKey : true
        }
    }, {
        tableName: 'chatroom_info',
        freezeTableName: true

    });

    chatroom_info.associate = (models) => {
        chatroom_info.belongsTo(models.user, {foreignKey : 'user_id', targetKey : "id", onDelete : "CASCADE", onUpdate : "CASCADE"})
        chatroom_info.belongsTo(models.chatroom, {foreignKey : 'chatroom_id', targetKey : "chatroom_id", onDelete : "CASCADE", onUpdate : "CASCADE"})

    };

    return chatroom_info;
};