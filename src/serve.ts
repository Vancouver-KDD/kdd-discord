import {serve} from '@hono/node-server'

import app from './index.js'

// serve on port 3000
serve(app, (info: {port: number}) => {
  console.log(`http://localhost:${info.port}`)
})
