const logger = global['logger'];
const helper = require('./helper');
let getNumberUserId = helper.getNumberUserId;
let getGroup = helper.getGroup; 
let db = require('./db');

module.exports = async (ctx) => {
    let userId = ctx.cookies.get('user_id');
    let numberUserId = getNumberUserId(userId); 

    logger.info(`user_id: ${userId}`);

    let list = await db.getListFromDB(ctx.connection, numberUserId);

    let group = getGroup(list); 

    ctx.body = {
        group: group
    };
}