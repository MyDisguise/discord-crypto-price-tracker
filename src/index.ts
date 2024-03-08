import 'dotenv/config';
import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import { CronJob } from 'cron';
import fetch from 'node-fetch';

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.login(process.env.DISCORD_BOT_TOKEN);

client.on('ready', async () => {
    console.log('Price Tracker Bot Connected!');
    priceBot();
});

async function setPrice() {
    try {
        const symbolTicker = process.env.SYMBOL_TICKER as string; // Ensure this matches the CoinGecko ID
        const currency = process.env.CURRENCY as string;

        const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(symbolTicker)}`;
        const response = await fetch(url);
        const result = await response.json();

        const price = result.market_data.current_price[currency];
        const priceChangePercentage1h = result.market_data.price_change_percentage_1h_in_currency[currency];

        if (price === undefined || priceChangePercentage1h === undefined) throw new Error('Data Not Found.');

        const formattedPrice = `$${Number(price).toFixed(5)}`;
        const formattedChange = `${priceChangePercentage1h >= 0 ? '+' : ''}${priceChangePercentage1h.toFixed(2)}%`;

        client.guilds.cache.forEach(async (guild) => {
            try {
                await guild.members.me?.setNickname(formattedPrice);
            } catch (error) {
                console.error(`Could not set nickname in guild ${guild.name}:`, error);
            }
        });

        client.user?.setPresence({
            activities: [{
                name: `1h: ${formattedChange}`,
                type: ActivityType.Watching
            }],
            status: 'online'
        });

    } catch (error) {
        console.log(error);
    }
}

function priceBot() {
    setPrice();

    new CronJob(
        `*/${process.env.PRICE_UPDATE_IN_MINUTES!} * * * *`,
        function() {
            setPrice();
        },
        null,
        true,
    );
}

