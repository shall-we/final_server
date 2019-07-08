/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
    let folder = sequelize.define(
        "folder",
        {
            id: {
                type: DataTypes.INTEGER(10).UNSIGNED,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING(50),
                allowNull: false
            }
        },
        {
            tableName: "folder"
        }
    );

    // folder 1 : note n
    // folder 1 : folderList n
    folder.associate = models => {
        folder.hasMany(models.note, { foreignKey: "folder_id", onDelete : 'cascade' });
        folder.hasMany(models.folder_list, { foreignKey: "folder_id", onDelete : 'cascade' });
    };

    return folder;
};
