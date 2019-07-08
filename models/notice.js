/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(
        "notice",
        {
            idx: {
                type: DataTypes.INTEGER(10).UNSIGNED,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            type: {
                type: DataTypes.ENUM("COMMENT", "FOLDER", "NOTE",'CHAT'),
                allowNull: false
            },
            from: {
                type: DataTypes.INTEGER(10).UNSIGNED,
                allowNull: false,
            },
            to: {
                type: DataTypes.INTEGER(10).UNSIGNED,
                allowNull: false,
            },
            object: {
                type: DataTypes.INTEGER(10).UNSIGNED,
                allowNull: false,
            },
            message: {
                type: DataTypes.STRING(300),
                allowNull: false
            },
           
            reg_date: {
                type: DataTypes.DATE,
                allowNull: false
            },
            check: {
                type: DataTypes.ENUM("TRUE","FALSE"),
                allowNull: false
            },
            
        },
        {
            tableName: "notice"
        }
    );
};