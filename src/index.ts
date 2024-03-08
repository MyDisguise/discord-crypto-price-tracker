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
        const contractAddress = process.env.CONTRACT_ADDRESS as string;
        const networkId = process.env.NETWORK_ID as string; // "ethereum", "binance-smart-chain", etc.

        // Assuming DexScreener has an endpoint format like this - adjust as needed
        const url = `https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`;
        const response = await fetch(url);
        const result = await response.json();

        // Adjust these paths according to the actual response structure from DexScreener
        const price = result.pair.lastPrice; // Example path
        // DexScreener may not provide a direct 1h price change, you might need to calculate or adjust based on available data

        if (price === undefined) throw new Error('Data Not Found.');

        const formattedPrice = `$${Number(price).toFixed(5)}`;
        // Example: if DexScreener does not provide price change, skip or implement alternative
        const formattedChange = `+0.00%`; // Placeholder

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
