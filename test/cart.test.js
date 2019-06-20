const chai = require('chai');
const cart = require('../src/cart');
const db = require('../src/db');
const sinon = require('sinon');
let expect = chai.expect;

function getListFromDB(connection, userId) {
    return new Promise((resolve) => {
        if (userId) {
            resolve([
                { vendor_id: 11, product_name: 'p1' },
                { vendor_id: 22, product_name: 'p2' },
                { vendor_id: 11, product_name: 'p3' }
            ])
        }
        return resolve();
    })
}

describe('cart路由逻辑测试', () => {
    beforeEach(() => {
        sinon.stub(db, 'getListFromDB').callsFake(getListFromDB)
    })
    afterEach(() => {
        sinon.restore();
    })
    it('如果cookie中的user_id为空，则返回的group的为空对象', (done) => {
        let ctx = {
            cookies: {
                get: function (key) {
                    if (key === 'user_id') return '';
                }
            }
        };
        cart(ctx).then(() => {
            expect(ctx.body.group).to.be.deep.equal({});
            done();
        });
    });

    it('如果cookie中的user_id有效，则返回的对应的group', (done) => {
        let ctx = {
            cookies: {
                get: function (key) {
                    if (key === 'user_id') return '1234';
                }
            }
        };
        cart(ctx).then(() => {
            expect(ctx.body.group).to.be.deep.equal({
                '11': [{ vendor_id: 11, product_name: 'p1' }, { vendor_id: 11, product_name: 'p3' }],
                '22': [{ vendor_id: 22, product_name: 'p2' }]
            });
            done();
        });
    }); 
});