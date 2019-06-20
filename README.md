# 一个a unit test exampe

一个koa单元测试的例子

## 安装&运行
```sh
npm install
npm test
```

## 背景
前端的业务逻辑日益复杂，对于逻辑正确性的要求也越来越高，单元测试作为一种简单快捷的测试工具为前端业务的正确性提供了有力的支持。所谓单元测试，就是通过测试单个代码单元以测试代码的单一功能，单元测试可以让开发人发现很多潜在的问题。

## 为什么要写单元测试
单元测试费时费力的苦力活，很多人都不愿意写，甚至有大部分人潜意识觉得写单元测试就是在浪费时间。但是你写出来的代码是需要维护的，一旦现网出现bug，配置环境、排查问题、修改代码、验证、发布等一连串的过程需要耗费大量时间，如果把这些时间用来写单元测试，提前发现问题，从长远来看是不是节省了时间？


## 一个koa的例子
下面我们来尝试测试一个购物车路由控制器的逻辑：

**cart.js**
```javascript
const logger = global['logger'];

module.exports = async (ctx) => {
    // 从cookie中获取user_id
    let userId = ctxCookies.get('user_id') || '';
    userId = userId.replace(/(\D)/, '');

    logger.info(`user_id: ${userId}`)
    
    // 从数据库获取当前用户的购物车列表
    let list = await new Promise((resolve) => {
        ctx.connection.query(`SELECT * from Cart WHERE user_id='${userId}'`, function (error, results) {
            if (error) throw error;
            resolve(results);
        });
    });

    // 对购物车列表按供应商分类
    let group = [];
    for(let i = 0; i < list.length; i++) {
        let item = list[i];
        let vendorId = item.vendor_id;
        if(group[vendorId]) {
            group[vendorId].push(item);
        } else {
            group[vendorId] = [item];
        }
    }

    ctx.body = {
        group: group
    };
}
```

单元测试是测试代码单一功能的测试，上面的控制器作为一个单元实在是有点“大”，而且相互依赖的逻辑比较多。为了进行单元测试，我们应该**将大块的代码分离出功能单一、对其他模块依赖较小的单元代码**。

## 分离代码
首先，我们先分析一下这个控制器做了什么事情：
* 1.从cookie中获取 `user_id` ，并过滤 `user_id`
* 2.从数据库获取当前用户的购物车列表
* 3.对购物车列表按供应商分类

我们将代码分离成下面的样子：

**helper.js**
```javascript
exports.getNumberUserId = function(userId) {
    return userId.replace(/(\D)/g, '');
}

exports.getGroup = function(list=[]) {
    let group = {};
    for(let i = 0; i < list.length; i++) {
        let item = list[i];
        let vendorId = item.vendor_id;
        if(vendorId) {
            if(group[vendorId]) {
                group[vendorId].push(item);
            } else {
                group[vendorId] = [item];
            }
        }
    };
    return group;
};
```

**db.js**
```javascript
exports.getListFromDB = function(connection, userId) {
    return new Promise((resolve) => {
        connection.query(`SELECT * from Cart WHERE user_id='${userId}'`, function (error, results) {
            if (error) throw error;
            resolve(results);
        });
    });
}
```

**cart.js**
```javascript
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
```

## 使用mocha + chai测试单元
`mocha` 是一个NodeJS实现的测试框架，其作用是运行测试脚本。下面是测试脚本的一个例子：
```javascript
var add = require('./add.js');
var expect = require('chai').expect;

describe('加法函数的测试', function() {
  it('1 加 1 应该等于 2', function() {
    expect(add(1, 1)).to.be.equal(2);
  });
});
```

其中 `describe` 称为测试套件，表示一组相关的测试。 `it` 称为为测试用例，表示一个单独的测试。 `describe` 和 `it` 都是 `mocha` 自带的全局方法。

chai是一个断言库，用于判断源码的执行结果是否与预期结果一致，如果不一致就会抛出一个错误。 `expect` 是 `chai` 其中一个断言方法。

我们通过 npm script 来运行测试脚本
```javascript
{
    "scripts": {
    "test": "mocha --require ./test/setup.js test/**/*.test.js"
    },
}
```

上面的 `npm script` 会运行 `test` 目录下所有 `test.js` 后缀的脚本。

其中的 `--require ./test/setup.js` 下文会解析它的作用，现在先忽略。

## 测试getNumberUserId方法
先回顾一下 `getNumberUserId` 方法的代码：

```javascript
exports.getNumberUserId = function(userId) {
    return userId.replace(/(\D)/g, '');
}
```

`getNumberUserId` 方法的主程序只有一行正则替换的代码。要完整测试正则表达式的正确性需要很多测试用例，然而这里的实际环境中的 `user_id` 只可能是 纯数字或者 "ox" + 数字的形式 ，因此测试脚本中只需要写两个测试用例：

```javascript
describe('getUserId方法测试', () => {
    it('如果userId是纯数字，则直接透传', () => {
        expect(helper.getNumberUserId('1234')).to.be.equal('1234');
    });
    it('如果userId开头有ox，则去掉ox', () => {
        expect(helper.getNumberUserId('ox1234')).to.be.equal('1234'); 
    })
});
```

**测试用例并不是越多越好，只要测试用例能覆盖到有效的场景就足够了。**

## 测试getGroup方法
先回顾代码：
```javascript
exports.getGroup = function(list=[]) {
    let group = {};
    for(let i = 0; i < list.length; i++) {
        let item = list[i];
        let vendorId = item.vendor_id;
        if(vendorId) {
            if(group[vendorId]) {
                group[vendorId].push(item);
            } else {
                group[vendorId] = [item];
            }
        }
    };
    return group;
};
```

`getGroup` 的测试脚本：
```javascript
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
```


单元测试实质上是白盒测试，白盒测试包含六种覆盖方法，本文不具体介绍白盒测试，有兴趣的同学可以到[白盒测试的这篇文章](https://www.cnblogs.com/ITGirl00/p/3858357.html)看具体的介绍。

`getGroup` 方法没有复杂的组合条件判断，因此测试覆盖只需要做到语句覆盖即可，即做到程序中每个语句至少执行一次。 `getGroup` 方法的流程图如下图所示：

![](https://user-gold-cdn.xitu.io/2019/6/20/16b72b4a9dd14117?w=1110&h=1422&f=png&s=108393)


每个测试用例所覆盖的路径

| 用例 | 路径 |
| --- | --- |
| 用例1 | AG |
| 用例2 | ABCD、BCE、BCDG |
| 用例3 | ABCD、BFG |

如上表所示，这3个用例能覆盖A~G所有路径。

## 测试cart控制器
先来回顾代码：

```javascript
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
```

控制器中有两个部分并不需要测试：
* 1.通过 `logger.info` 将 `userId` 打到log中的逻辑。打log并不是程序的主逻辑，所以不测试也没有关系。
* 2.从数据库获取购物车列表的逻辑。测试这段逻辑需要搭建数据库，成本比较大。

为了“避开”这两段逻辑，我们使用mock(模拟)。

### 单元测试的mock（模拟）
在单元测试中有时候会遇到一些不容易构造或者获取的对象，这个时候构造一个虚拟对象以便测试，这就是mock。mock还适用于一些没必要测试的逻辑。

对于打log的逻辑的mock，我们使用以下方式：
**package.json**
```javascript
{
  "scripts": {
    "test": "mocha --require ./test/setup.js test/**/*.test.js"
  }
}
```

**setup.js**
```javascript
global['logger'] = {
    info: () => {}
}
```

`mocha` 中的 `--require` 参数用于置在运行每个测试脚本运行前引入一些前置模块。我们可以利用前置脚本 mock 全局变量，保证每个测试脚本都能使用mock后的全局变量。
上面的 setup.js 脚本模拟了 `global.logger.info` 方法，该方法什么都不做，只是为了程序不会报 `undefined` 错误。

对于数据库方法 `getListFromDB`，可以使用 `sinon` 来实现mock。`sinon` 的作用是替换代码中复杂的部分以简化代码，具体使用方式请参考[sinon的官网](https://sinonjs.org/)。先来看看控制器的测试脚本：

**cart.test.js**
```javascript
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
```

mock `getListFromDB`方法的代码在这里：
```javascript
describe('cart路由逻辑测试', () => {
    beforeEach(() => {
        sinon.stub(db, 'getListFromDB').callsFake(getListFromDB)
    })
    // other code
});
```

这一段代码的使用 `mocha` 的 `beforeEach` 函数，在每个 `it` 测试用例执行前，将主程序的 `db.getListFromDB` 方法替换成自定义的 `getListFromDB` 方法。通过这个自定义的 `getListFromDB` 我们就可以直接模拟数据，无需再配置数据库。

## 结语
本文从一个 `koa` 的单元测试例子出发，讲述了单元测试的几个技巧：

* 1.当被测试的单元模块太大时，将模块拆分成功能单一、依赖更小的模块。
* 2.测试用例不是越多越好，而是越有效越好。
* 3.借助白盒测试的覆盖方法能体能测试代码的覆盖率。
* 4.当遇到一些无需测试或者难以测试的模块时，通过mock（模拟）替换这些模块。

这些技巧不只可以用在 `koa` 的单元测试上，还可以用于 `react` 组件测试、UI测试等测试上。 只要找对对应的工具和懂得使用单元测试的技巧，就能简单快捷地编写单元测试，为代码质量护航。