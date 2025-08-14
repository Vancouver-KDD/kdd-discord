import {Hono} from 'hono'
import {verifyKey} from 'discord-interactions'

const app = new Hono()

const welcomeStrings = [
  'Hello Hono!2',
  'To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/hono',
]

app.get('/', (c) => {
  return c.text(welcomeStrings.join('\n\n'))
})

app.post('/api/v1/discord/webhook', async (c) => {
  const signature = c.req.header('x-signature-ed25519')
  const timestamp = c.req.header('x-signature-timestamp')
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
