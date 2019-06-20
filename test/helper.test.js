const chai = require('chai');
const helper = require('../src/helper');
let expect = chai.expect;

describe('getUserId方法测试', () => {
    it('如果userId是纯数字，则直接透传', () => {
        expect(helper.getNumberUserId('1234')).to.be.equal('1234');
    });
    it('如果userId开头有ox，则去掉ox', () => {
        expect(helper.getNumberUserId('ox1234')).to.be.equal('1234'); 
    })
});

describe('getGroup', () => {
    it('如果list为undefined或空数组，则返回一个空对象', () => {
        expect(helper.getGroup()).to.be.deep.equal({});
        expect(helper.getGroup([])).to.be.deep.equal({});
    });
    it('如果list有数据，则按vendor_id生成group', () => {
        let list = [
            { vendor_id: 11, product_name: 'p1' },
            { vendor_id: 22, product_name: 'p2' },
            { vendor_id: 11, product_name: 'p3' }
        ];
        expect(helper.getGroup(list)).to.be.deep.equal({
            '11': [{ vendor_id: 11, product_name: 'p1' }, { vendor_id: 11, product_name: 'p3' }],
            '22': [{ vendor_id: 22, product_name: 'p2' }]
        })
    });
    it('如果list中没有vendor_id的item，则该item不加入到group中', () => {
        let list = [
            { vendor_id: 11, product_name: 'p1' },
            { product_name: 'p2' },
        ];
        expect(helper.getGroup(list)).to.be.deep.equal({
            '11': [{ vendor_id: 11, product_name: 'p1' }]
        })
    });
})