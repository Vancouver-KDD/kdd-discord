// import {serve} from '@hono/node-server'
import {Hono} from 'hono'
import {verifyKey} from 'discord-interactions'
// import {Client, GatewayIntentBits, REST, Routes} from 'discord.js'
import {stream, streamText, streamSSE} from 'hono/streaming'
import {Ollama} from 'ollama'

const ollama = new Ollama({
  host: process.env.OLLAMA_SERVER_URL,
  headers: {
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
  },
})

const app = new Hono()

const welcomeStrings = [
  'Hello Hono!2',
  'To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/hono',
]

app.get('/', (c) => {
  return c.text(welcomeStrings.join('\n\n'))
})

app.get('/ollama', async (c) => {
  return streamText(c, async (stream) => {
    await stream.writeln('Connecting to ollama...')
    // const responseOllama = await fetch(process.env.OLLAMA_SERVER_URL ?? '')
    // await stream.writeln(await responseOllama.text())
    await stream.writeln('Generating Text from ollama... (Explain quantum computing)')
    const response = await ollama.chat({
      model: process.env.OLLAMA_MODEL ?? 'gemma3n:e4b',
      messages: [{role: 'user', content: 'Explain quantum computing'}],
      stream: true,
    })
    for await (const part of response) {
      stream.write(part.message.content)
    }
  })
})

app.get('/discord', (c) => {
  return streamText(c, async (stream) => {
    // await stream.writeln('Hello')
    const members = await fetchDiscordGuildMembers(process.env.DISCORD_GUILD_ID ?? '')
    await stream.writeln(JSON.stringify(members, null, 2))

    const guildsData = await fetchDiscordMessages()
    const formatted = JSON.stringify(guildsData, null, 2)
    await stream.writeln(formatted)
    // JSON stringify but formatted
    // await stream.writeln(formatted)
    // await stream.sleep(1000)
    // await stream.writeln(' World2')
    // const client = new Client({
    //   intents: [
    //     GatewayIntentBits.Guilds, // Required for general guild-related events
    //     GatewayIntentBits.GuildMessages,
    //     GatewayIntentBits.DirectMessages,
    //     GatewayIntentBits.MessageContent, // Crucial for reading message content
    //   ],
    // })
    // client.on('ready', () => {
    //   stream.writeln(`Logged in as ${client.user?.tag}`)
    // })
    // client.on('messageCreate', (message) => {
    //   stream.writeln(`Message received: ${message.content}`)
    // })
    // client.login(process.env.DISCORD_BOT_TOKEN)
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
// serve(app)

async function fetchDiscordMessages() {
  try {
    // 1. fetch all guild ids
    // const guilds = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    //   headers: {
    //     Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    //     'Content-Type': 'application/json',
    //   },
    // })

    // const guildsData = await guilds.json()
    // const guildsData2 = guildsData.map((guild: any) => {
    //   return {
    //     id: guild.id,
    //     name: guild.name,
    //   }
    // })

    // guildsData.forEach(async (guild: any) => {
    //   const channels = await fetch(
    //     `https://discord.com/api/v10/guilds/${guild.id}/channels`,
    //     {
    //       headers: {
    //         Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    //         'Content-Type': 'application/json',
    //       },
    //     }
    //   )

    //   const channelsData = await channels.json()
    //   console.log(channelsData)
    // })

    // return guildsData
    // console.log(guildsData)
    //1. Fetch all members in a guild

    // 1. fetch all channels in a guild
    const channels = await fetch(
      `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/channels`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!channels.ok) {
      const errorBody = await channels.text()
      throw new Error(
        `Failed to fetch channels (${channels.status} ${channels.statusText}): ${errorBody}`
      )
    }

    const channelsData = await channels.json()
    const textChannels = channelsData.filter((channel: any) => channel.type === 0)
    // console.log(textChannels)
    const channelMessages: Record<string, {messages: any[]}> = {}

    await Promise.all(
      textChannels.map(async (channel: any) => {
        const messagesResponse = await fetch(
          `https://discord.com/api/v10/channels/${channel.id}/messages?limit=50`,
          {
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!messagesResponse.ok) {
          const errorBody = await messagesResponse.text()
          console.error(
            `Failed to fetch messages for channel ${channel.id} (${messagesResponse.status} ${messagesResponse.statusText}): ${errorBody}`
          )
          channelMessages[channel.id] = {messages: []}
          return
        }

        const messagesData = await messagesResponse.json()
        channelMessages[channel.id] = {messages: messagesData}
      })
    )

    return channelMessages

    // textChannels.forEach(async (channel: any) => {

    // const response = await fetch(
    //   'https://discord.com/api/v10/channels/1291999999999999999/messages',
    //   {
    //     headers: {
    //       Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    //       'Content-Type': 'application/json',
    //     },
    //   }
    // )

    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`)
    // }

    // const messages = await response.json()
    // console.log(messages) // Array of message objects
  } catch (error) {
    console.error('Error fetching messages:', error)
  }
}

async function fetchDiscordUserMessages(userId: string) {
  const messages = await fetch(`https://discord.com/api/v10/users/${userId}/messages`, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
  })
  return messages.json()
}

async function fetchDiscordGuildMembers(guildId: string) {
  const members = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
  })
  return members.json()
}
