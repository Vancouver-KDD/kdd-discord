import {serve} from '@hono/node-server'
import {Hono} from 'hono'
import {verifyKey} from 'discord-interactions'
import {Client, GatewayIntentBits, REST, Routes} from 'discord.js'
import {stream, streamText, streamSSE} from 'hono/streaming'

const app = new Hono()

const welcomeStrings = [
  'Hello Hono!2',
  'To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/hono',
]

app.get('/', (c) => {
  return c.text(welcomeStrings.join('\n\n'))
})

app.get('/discord', (c) => {
  return streamText(c, async (stream) => {
    await stream.writeln('Hello')
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds, // Required for general guild-related events
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent, // Crucial for reading message content
      ],
    })
    client.on('ready', () => {
      stream.writeln(`Logged in as ${client.user?.tag}`)
    })
    client.on('messageCreate', (message) => {
      stream.writeln(`Message received: ${message.content}`)
    })
    client.login(process.env.DISCORD_BOT_TOKEN)
    // return c.text('Hello World')
    // Write a text with a new line ('\n').
    // Wait 1 second.
    // await stream.sleep(1000)
    // // Write a text without a new line.
    // await stream.write(`Hono!`)
  })
})

// Reusable Discord REST client for serverless-friendly message fetches
// const discordRest = new REST({version: '10'}).setToken(process.env.DISCORD_BOT_TOKEN ?? '')

// app.get('/discord/history', async (c) => {
//   const token = process.env.DISCORD_BOT_TOKEN
//   if (!token) {
//     return c.text('Missing DISCORD_BOT_TOKEN', 500)
//   }

//   const channelId = c.req.query('channelId')
//   const limitRaw = c.req.query('limit')
//   const limit = Math.min(Math.max(Number(limitRaw ?? 50), 1), 100)

//   if (!channelId) {
//     return c.text('Query param "channelId" is required', 400)
//   }

//   try {
//     const route = `${Routes.channelMessages(channelId)}?limit=${limit}`
//     const messages = (await discordRest.get(route)) as any[]
//     const simplified = messages.map((m) => ({
//       id: m.id,
//       content: m.content,
//       createdAt: m.timestamp ?? m.created_at,
//       author: m.author
//         ? {id: m.author.id, username: m.author.username, globalName: m.author.global_name}
//         : null,
//       attachments: Array.isArray(m.attachments)
//         ? m.attachments.map((a: any) => ({id: a.id, url: a.url, filename: a.filename}))
//         : [],
//     }))
//     return c.json({channelId, count: simplified.length, messages: simplified})
//   } catch (err: any) {
//     const status = typeof err?.status === 'number' ? err.status : 500
//     return c.json({error: err?.message ?? 'Failed to fetch messages'}, status)
//   }
// })

// app.get('/discord/general-history', async (c) => {
//   const token = process.env.DISCORD_BOT_TOKEN
//   if (!token) {
//     return c.text('Missing DISCORD_BOT_TOKEN', 500)
//   }

//   const guildId = c.req.query('guildId')
//   const channelName = (c.req.query('channelName') || 'general').toLowerCase()
//   const limitRaw = c.req.query('limit')
//   const limit = Math.min(Math.max(Number(limitRaw ?? 50), 1), 100)

//   if (!guildId) {
//     return c.text('Query param "guildId" is required', 400)
//   }

//   try {
//     const channels = (await discordRest.get(Routes.guildChannels(guildId))) as any[]
//     // Discord API v10: type 0 = GUILD_TEXT
//     const textChannels = channels.filter((ch) => ch.type === 0)
//     const targetChannel =
//       textChannels.find(
//         (ch) => typeof ch.name === 'string' && ch.name.toLowerCase() === channelName
//       ) || textChannels[0]

//     if (!targetChannel) {
//       return c.text('No text channels available in this guild', 404)
//     }

//     const route = `${Routes.channelMessages(targetChannel.id)}?limit=${limit}`
//     const messages = (await discordRest.get(route)) as any[]
//     const simplified = messages.map((m) => ({
//       id: m.id,
//       content: m.content,
//       createdAt: m.timestamp ?? m.created_at,
//       author: m.author
//         ? {id: m.author.id, username: m.author.username, globalName: m.author.global_name}
//         : null,
//       attachments: Array.isArray(m.attachments)
//         ? m.attachments.map((a: any) => ({id: a.id, url: a.url, filename: a.filename}))
//         : [],
//     }))
//     return c.json({
//       guildId,
//       channelId: targetChannel.id,
//       channelName: targetChannel.name,
//       count: simplified.length,
//       messages: simplified,
//     })
//   } catch (err: any) {
//     const status = typeof err?.status === 'number' ? err.status : 500
//     return c.json({error: err?.message ?? 'Failed to fetch general channel history'}, status)
//   }
// })

app.post('/api/v1/discord/webhook', async (c) => {
  const signature = c.req.header('X-Signature-Ed25519')
  const timestamp = c.req.header('X-Signature-Timestamp')
  const rawBody = await c.req.text()

  if (!signature || !timestamp) {
    return c.status(400)
  }

  const publicKey = process.env.DISCORD_PUBLIC_KEY
  if (!publicKey) {
    return c.status(500)
  }

  const isValid = verifyKey(rawBody, signature, timestamp, publicKey)
  if (!isValid) {
    return c.status(401)
  }

  const body = JSON.parse(rawBody)
  if (body.application_id !== process.env.DISCORD_APPLICATION_ID) {
    return c.status(401)
  }

  if (body.type === 0) {
    return c.status(204)
  }

  if (body.type === 1) {
    console.log(body)
  }
  return c.status(500)
})

export default app
serve(app)
