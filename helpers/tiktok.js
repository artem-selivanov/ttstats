const axios = require("axios");

class ttHandler {
    constructor({api, id}) {
        this.api = api;
        this.id = id;
    }
    async getCampaignStats(date) {
        let page = 1
        const results = []
        while (true){
            const data = await this.getCampaignStatsPage(date,page)
            //console.log(data)
            results.push(...data)
            if (data.length<10) break;
            page++
        }
        console.log(`The script found ${results.length} campaigns`)
        return results
    }

    async getCampaignStatsPage(date,page) {
        try {
            //console.log({date,page})
            const response = await axios.get('https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/', {
                headers: {
                    'Access-Token': this.api,
                },
                params: {
                    advertiser_id: this.id,
                    service_type: 'AUCTION',
                    data_level: 'AUCTION_CAMPAIGN',
                    report_type: 'BASIC',
                    dimensions: JSON.stringify(["campaign_id"]),
                    metrics: JSON.stringify(["clicks", "impressions", "spend"]),
                    start_date: date,
                    end_date: date,
                    page
                },
            });
            //console.log(response.data.data.list.length);
            return response?.data?.data?.list||[]

        } catch (error) {
            console.error('Error fetching TikTok report:', error.response?.data || error.message);
            return []
        }
    }

    async getCampaignsNames(){
        let page = 1
        const results = []
        while (true){
            const data = await this.getCampaignPage(page)
            //console.log(data)
            results.push(...data)
            if (data.length<10) break;
            page++
        }
        console.log(`The script found ${results.length} campaigns name`)
        let obj = {}
        results.map(i=>(obj[i['campaign_id']]=i.campaign_name))
        return obj
    }

    async getCampaignPage(page) {
        try {
            const response = await axios.get('https://business-api.tiktok.com/open_api/v1.3/campaign/get/', {
                headers: {
                    'Access-Token': this.api, // замените на ваш токен
                    'Content-Type': 'application/json'
                },
                params: {
                    advertiser_id: this.id,
                    page: page
                }
            });

            //console.log(response.data);
            return response?.data?.data?.list||[]
        } catch (error) {
            console.error('Ошибка при запросе:', error.response?.data || error.message);
            return []
        }
    }



}

module.exports = ttHandler