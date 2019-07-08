/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
    let chatroom_list= sequelize.define('chatroom_list', {
        chatroom_id: {
            primaryKey : true,
            references: {
                model: 'chatroom',
                key: 'chatroom_id'
            },
            type : DataTypes.STRING(50)
        },
        user_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            references: {
                model: 'user',
                key: 'id'
            },
            primaryKey : true
        },
        last_update : {
            type: DataTypes.DATE,
        }
    }, {
        tableName: 'chatroom_list',
        freezeTableName: true

    });


    chatroom_list.associate = (models) => {
        chatroom_list.belongsTo(models.user, {foreignKey : 'user_id', targetKey : "id", onDelete : "CASCADE", onUpdate : "CASCADE"}),
        chatroom_list.belongsTo(models.chatroom, {foreignKey : 'chatroom_id', targetKey : "chatroom_id", onDelete : "CASCADE", onUpdate : "CASCADE"});

    };


    return chatroom_list;
};
