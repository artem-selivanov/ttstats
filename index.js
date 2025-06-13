const SheetHandler = require('./helpers/spreadsheet');
const mysqlHandler = require('./helpers/bd');
const ttHandler = require('./helpers/tiktok');
const path = require('path');
const pathWay = process.cwd().indexOf("/root")>-1?"/root/ttstats":"D:\\OpenServer\\domains\\ttstats"
//require('dotenv').config({path: path.join(pathWay, `.env`)});
require('dotenv').config({});
const moment = require('moment')

const s = new SheetHandler(process.env.SPREADSHEET);
const m = new mysqlHandler({
    host: process.env.HOST,
    user: process.env.LOGIN,
    database: 'my_database',
    password: process.env.PASS,
    charset: 'cp1251'
});


(async function () {
    const now = new Date();
    if (now.getHours() < 6) {
        return;
    }

    const current = await s.getCurrentStats('Complex')
    console.log(current)
    const results = []
    const accounts = await m.getAccounts()
    for (let {account_id, name, exchange_rate, token} of accounts) {
        const t = new ttHandler({api: token, id: account_id});
        const names = await t.getCampaignsNames()
        for (let i = 21; i > 0; i--) {
            const day = i
            const date = moment().subtract(day, 'days').format('YYYY-MM-DD');
            console.log(date)
            if (current.has(`${date}${account_id}`)) {
                console.log(`Already exist stats`)
                continue
            }
            const ordersById = await m.getOrders(day)
            const stats = await t.getCampaignStats(date)
            for (let {metrics, dimensions} of stats) {
                console.log({metrics, dimensions})
                const clicks = parseInt(metrics.clicks)
                const impressions = parseInt(metrics.impressions)
                const spend = parseFloat(metrics.spend)*parseFloat(exchange_rate)
                const ctr = impressions == 0 ? 0 : clicks * 100 / impressions
                const cpm = impressions == 0 ? 0 : spend * 1000 / impressions
                const leads = ordersById[dimensions.campaign_id]?.count || 0
                const sum = ordersById[dimensions.campaign_id]?.price || 0
                const cpl = leads == 0 ? 0 : spend / leads
                const cpc = spend / clicks
                if (spend == 0 && impressions == 0 && clicks == 0) continue
                const row = [date,
                    account_id,
                    name,
                    dimensions.campaign_id,
                    names[dimensions.campaign_id],
                    impressions,
                    clicks,
                    spend,
                    ctr.toFixed(2),
                    cpc.toFixed(2),
                    cpm.toFixed(2),
                    cpl.toFixed(2),
                    leads,
                    sum.toFixed(2),
                    'TikTok'
                ]
                results.push(row)
            }
        }
    }
    await s.addRows(results, "Complex")
    //console.log(results)
})()