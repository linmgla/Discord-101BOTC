const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');
const axios = require('axios');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GAS_URL = process.env.GAS_URL;

if (!DISCORD_TOKEN || !GAS_URL) {
  console.error('❌ 錯誤：請確保環境變數 DISCORD_TOKEN 與 GAS_URL 設定正確！');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Discord Bot & Calendar Sync is active!');
});

server.listen(PORT, () => {
  console.log(`✅ HTTP Server 已啟動，通訊埠：${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot 成功登入為：${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.channel.isThread()) return;

  const content = message.content;
  
  // 嚴格觸發條件：必須包含「說書：」或「說書人：」
  const hasExplicitHost = /(?:說書人|說書|说书人|说书)\s*[:：]/i.test(content);

  if (hasExplicitHost) {
    try {
      const payload = {
        guildId: message.guild.id,
        threadName: message.channel.name,
        content: content,
        author: message.author.username,
        messageUrl: message.url
      };

      const response = await axios.post(GAS_URL, payload);

      if (response.data && response.data.status === 'success') {
        console.log(`✅ 成功同步至日曆：${response.data.eventTitle}`);
      } else {
        console.error('⚠️ GAS 回傳異常：', response.data);
      }

    } catch (error) {
      console.error('❌ 同步失敗：', error.message);
    }
  }
});

client.login(DISCORD_TOKEN);