require('dotenv').config();

import DiscordJs from 'discord.js'
import Cron from 'cron'
import fetch from 'node-fetch'

const client = new DiscordJs.Client({
    intents: [DiscordJs.Intents.FLAGS.GUILDS]
})

client.login(process.env.DISCORD_BOT_TOKEN)

client.on('ready', async () => {
    console.log('Price Tracker Bot Connected!')
})

const priceBot = async () => {

    async function setPrice() {
        try {
            // Assert that environment variables are defined
            const symbolTicker = process.env.SYMBOL_TICKER as string; // Ensure this matches the CoinGecko ID
            const currency = process.env.CURRENCY as string;
    
            // Fetching detailed coin information to get current price and 1h price change
            const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(symbolTicker)}`;
            const response = await fetch(url);
            const result = await response.json();
    
            // Extracting current price and 1-hour price change percentage
            const price = result.market_data.current_price[currency];
            const priceChangePercentage1h = result.market_data.price_change_percentage_1h_in_currency[currency];
    
            if (price === undefined || priceChangePercentage1h === undefined) throw new Error('Data Not Found.');
    
            // Formatting the price and price change for display
            const formattedPrice = `$${Number(price).toFixed(2)}`; // Adjust decimal places as needed
            const formattedChange = `${priceChangePercentage1h >= 0 ? '+' : ''}${priceChangePercentage1h.toFixed(2)}%`;
    
            // Updating bot's nickname with the current price
            client.guilds.cache.forEach(async (guild) => {
                try {
                    await guild.me?.setNickname(formattedPrice);
                } catch (error) {
                    console.error(`Could not set nickname in guild ${guild.name}:`, error);
                }
            });
    
            // Updating bot's "watching" status to display the 1-hour price change
            client.user?.setPresence({ 
                activities: [{ 
                    name: `1h: ${formattedChange}`, 
                    type: 'WATCHING' 
                }], 
                status: 'online' 
            });
    
        } catch (error) {
            console.log(error);
        }
    }
    

    setPrice();

    new Cron.CronJob(
        `*/${process.env.PRICE_UPDATE_IN_MINUTES!} * * * *`,
        async function () {
            setPrice();
        },
        null,
        true,
    )
}

priceBot();

