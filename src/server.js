global['logger'] = {
    info: (data) => {
        // do something for logging
    }
}
const Koa = require('koa');
const app = new Koa();
const PORT = 8092;
const Router = require('koa-router');
const router = new Router();
const cart = require('./cart');
const mysql      = require('mysql');
const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'kyousougiga',
    database : 'test'
});
connection.connect();

app.use(async function(ctx, next) {
    if(!ctx.connection) {
        ctx.connection = connection;
    }
    await next();
})
router.get('/cart', cart);

app
    .use(router.routes())
    .use(router.allowedMethods());
app.listen(PORT, function () {
    console.log('listening on port ' + PORT);
});