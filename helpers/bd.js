const mysql = require('mysql2/promise');

class MysqlHandler {
    constructor(bd) {
        this.conn = null;
        this.bd = bd;
        this.approval = null
    }

    async initMysql() {
        //console.log(this.bd)
        this.conn = this.conn != null ? this.conn : await mysql.createConnection(this.bd)
    }

    //timezone: 'Z'
    endMysql() {
        if (this.conn)
            this.conn.end();
    }

    async getSet(query, property, disconnect = true) {
        //console.log(this.conn)
        if (this.conn == null) await this.initMysql()
        const [rows] = await this.conn.execute(query)
        let items = rows.reduce(
            (set, obj) => {
                set.add(obj[property]);
                return set;
            },
            new Set()
        );
        if (disconnect) {
            this.endMysql()
            this.conn = null
        }
        return items
    }

    async getMap(query, id, property, disconnect = true) {
        //console.log(this.conn)
        if (this.conn == null) await this.initMysql()
        const [rows] = await this.conn.execute(query)
        let items = rows.reduce(
            (map, obj) => {
                map.set(obj[id], obj[property]);
                return map;
            },
            new Map()
        );
        if (disconnect) {
            this.endMysql()
            this.conn = null
        }
        return items
    }

    async getObj(query, property, disconnect = true) {
        //console.log(this.conn)
        if (this.conn == null) await this.initMysql()
        const [rows] = await this.conn.execute(query)
        let obj = {}
        rows.map(i => (obj[i[property]] = i))

        if (disconnect) {
            this.endMysql()
            this.conn = null
        }
        return obj
    }

    async getArr(query, disconnect = true) {
        //console.log(this.conn)
        if (this.conn == null) await this.initMysql()
        const [rows] = await this.conn.execute(query)
        if (disconnect) {
            this.endMysql()
            this.conn = null
        }
        return rows
    }

    async insertRows(query, data, disconnect = true) {

        if (data.length == 0) return;
        if (this.conn == null) await this.initMysql();

        const [res, fields] = await this.conn.query(query, [data], function (err, results, fields) {
        })
        //console.log(res.insertId)


        if (disconnect) {
            this.endMysql();
            this.conn = null;
        }
        return res.insertId;
    }

    async executeRow(query, disconnect = true) {
        if (this.conn == null) await this.initMysql()
        const result = await this.conn.execute(query)
        if (disconnect) {
            this.endMysql()
            this.conn = null
        }
        return result[0].insertId
    }

    escapeStr(str) {
        return this.conn.escape(str);
    }

    async getOrders(day) {
        //console.log(this.conn)
        const ordersByIdArr = await this.getArr(`SELECT utm_id, sum(price) price, count(*) count FROM orders WHERE utm_source="tiktok" AND DATE(sent_at) = CURDATE() - INTERVAL ${day} DAY AND utm_id is NOT NULL GROUP BY utm_id`)//, "utm_id")
        let ordersById = {}
        ordersByIdArr.map(i=>(ordersById[i['utm_id']]={price:parseFloat(i.price), count:parseFloat(i.count)}))
        return ordersById
    }

    async getAccounts() {
        //console.log(this.conn)
        const arr = await this.getArr(`SELECT * FROM ad_accounts WHERE platform="Tiktok" and status='active'`)//, "utm_id")

        return arr
    }

}

module.exports = MysqlHandler