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
        const symbolTicker = process.env.SYMBOL_TICKER as string; // Make sure this matches your env
        const contractAddress = process.env.CONTRACT_ADDRESS as string; // Assuming you've added this

        // Updated URL for fetching data
        const url = `https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`;
        const response = await fetch(url);
        const result = await response.json();

        // Accessing the first pair's USD price and price change over the last 24 hours
        const priceUsd = result.pairs[0].priceUsd;
        const priceChange24h = result.pairs[0].priceChange.h24;

        if (!priceUsd) throw new Error('Price data not found.');

        const formattedPrice = `$${Number(priceUsd).toFixed(5)}`;
        const formattedChange = `${priceChange24h}%`; // Assuming this is a percentage

        client.guilds.cache.forEach(async (guild) => {
            try {
                await guild.members.me?.setNickname(formattedPrice);
            } catch (error) {
                console.error(`Could not set nickname in guild ${guild.name}:`, error);
            }
        });

        client.user?.setPresence({
            activities: [{
                name: `24h: ${formattedChange}`,
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
