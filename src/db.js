
exports.getListFromDB = function(connection, userId) {
    return new Promise((resolve) => {
        connection.query(`SELECT * from Cart WHERE user_id='${userId}'`, function (error, results) {
            if (error) throw error;
            resolve(results);
        });
    });
}
