import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR  = join(__dirname, 'data')
const DATA_PATH = join(DATA_DIR, 'db.json')

// ── Express & Socket setup ───────────────────────────────────────
const app        = express()
const httpServer = createServer(app)
const io         = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
})

// ── Seed data (mirrors the original hardcoded state) ──────────────
const SEED = {
  events: {
    '2026-04-16': [
      { id: 'e1001', time: '10:00',         title: 'Batsukh Baagii',       details: '' },
      { id: 'e1002', time: '11:30',         title: 'Bolovsrol TV',          details: '' },
      { id: 'e1003', time: '14:00 — 17:00', title: 'Хос биет',              details: '' },
      { id: 'e1004', time: '18:00',         title: 'Кино нээлт',            details: '' },
    ],
    '2026-04-17': [
      { id: 'e1005', time: '09:00 — 12:00', title: 'Хос биет',              details: '' },
      { id: 'e1006', time: '13:00',         title: 'Batuka (4/1 хувь)',      details: '' },
      { id: 'e1007', time: '14:30',         title: 'Ariuka',                 details: '' },
    ],
    '2026-04-18': [
      { id: 'e1008', time: '15:30 — 16:30', title: 'Болдсайхан',            details: '' },
      { id: 'e1009', time: '17:00 — 18:00', title: 'Анарсайхан',            details: '' },
    ],
    '2026-04-20': [
      { id: 'e1010', time: '10:00',         title: 'Дошхайрхан (биет)',      details: '' },
      { id: 'e1011', time: '11:30',         title: 'Batu (4/4)',             details: '' },
    ],
    '2026-04-21': [
      { id: 'e1012', time: '16:00 — 18:00', title: 'Хэнтий аймаг (300 км)', details: 'Сэдэв: Ажилтны болон нийгмийн сэтгэлзүй • 2 цагийн лекц — 4,000,000₮ + бензин' },
    ],
    '2026-04-22': [
      { id: 'e1013', time: '10:00 — 12:00', title: 'Өмнөговь, Даланзадгад', details: '200 хүн / 500 км • 2 цагийн лекц — 5,000,000₮' },
    ],
  },
  tasks: {
    marlaa: [
      { id: 't1014', text: '4 дугаарын хаалттай грүпп хичээл бэлтгэх',          done: false },
      { id: 't1015', text: 'Оюукааас тест авч өгөх',                             done: false },
      { id: 't1016', text: 'Өөрийн сошиал сувагт Подкаст бичлэг постерууд хийх', done: false },
    ],
    tsogooGroups: [
      { label: '', deadline: '04-17', tasks: [
        { id: 't1017', text: 'Barter website хийж дуусгах эцсийн байдлаар', done: false },
      ]},
      { label: '', deadline: '04-20', tasks: [
        { id: 't1018', text: 'Марлаа website test хувилбар хөгжүүлж дуусгах', done: false },
      ]},
      { label: '', deadline: '04-30', tasks: [
        { id: 't1019', text: 'AI website хийж дуусгах', done: false },
      ]},
      { label: 'Подкаст даалгаврууд', deadline: null, tasks: [
        { id: 't1020', text: 'Подкаст дугааруудыг эдит хийх',                   done: false },
        { id: 't1021', text: 'Reels & Poster бэлтгэх (4 подкаст = 8 reels)',     done: false },
        { id: 't1022', text: '5 Нийтлэл бэлтгэх',                               done: false },
        { id: 't1023', text: 'Хаалттай грүпп шинээр organize хийх',              done: false },
      ]},
      { label: 'Байгууллагын сургалт', deadline: null, tasks: [
        { id: 't1024', text: 'Зураг бичлэг авч сошиал сувгуудад тавигдах',      done: false },
        { id: 't1025', text: 'Бичлэг хийж Reels edit хийх',                     done: false },
        { id: 't1026', text: 'Вэбсайт тавигдах контент байрлуулах',              done: false },
        { id: 't1027', text: 'Маркетинг хийж бусад байгууллагуудад суртчилах',  done: false },
        { id: 't1028', text: 'Байгууллагууд луу явуулах материал вэбсайт бэлэн болгох', done: false },
      ]},
    ],
    shared: [
      { id: 't1029', text: 'Podcast 4 дугаар бичих',       deadline: '2026-04-20', done: false, sub: null },
      { id: 't1030', text: 'Хөдөө орон нутгийн лекцүүд',   deadline: null,         done: false,
        sub: ['Маршрут гаргах', 'Буудаллах буудал зохицуулах', 'Унаа болон жолоо барих хүн зохицуулах'] },
    ],
  },
}

function readDb() {
  if (!existsSync(DATA_PATH)) {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR)
    writeFileSync(DATA_PATH, JSON.stringify(SEED, null, 2))
    return JSON.parse(JSON.stringify(SEED))   // deep clone
  }
  return JSON.parse(readFileSync(DATA_PATH, 'utf-8'))
}

function writeDb(data) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
  io.emit('sync', data)   // broadcast to all connected clients
}

io.on('connection', socket => {
  socket.emit('sync', readDb())   // send current state to new client
})

app.use(express.json())

// Allow cross-origin
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// ── GET all state ────────────────────────────────────────────────
app.get('/api/state', (req, res) => {
  res.json(readDb())
})

// ── Events ───────────────────────────────────────────────────────
app.post('/api/events/move', (req, res) => {
  const { fromDate, toDate, eventId } = req.body
  const db = readDb()
  const src = db.events[fromDate] || []
  const idx = src.findIndex(e => e.id === eventId)
  if (idx === -1) return res.status(404).json({ error: 'Event not found' })
  const [evt] = src.splice(idx, 1)
  db.events[fromDate] = src
  if (!db.events[toDate]) db.events[toDate] = []
  db.events[toDate].push(evt)
  writeDb(db)
  res.json({ ok: true })
})

app.post('/api/events/:date', (req, res) => {
  const db = readDb()
  if (!db.events[req.params.date]) db.events[req.params.date] = []
  const event = req.body
  db.events[req.params.date].push(event)
  writeDb(db)
  res.status(201).json(event)
})

app.delete('/api/events/:date/:id', (req, res) => {
  const db = readDb()
  const arr = db.events[req.params.date] || []
  db.events[req.params.date] = arr.filter(e => e.id !== req.params.id)
  writeDb(db)
  res.json({ ok: true })
})

app.delete('/api/events/:date', (req, res) => {
  const db = readDb()
  db.events[req.params.date] = []
  writeDb(db)
  res.json({ ok: true })
})

// ── Marlaa tasks ─────────────────────────────────────────────────
app.post('/api/tasks/marlaa', (req, res) => {
  const db = readDb()
  db.tasks.marlaa.push(req.body)
  writeDb(db)
  res.status(201).json(req.body)
})

app.patch('/api/tasks/marlaa/:id', (req, res) => {
  const db = readDb()
  const task = db.tasks.marlaa.find(t => t.id === req.params.id)
  if (!task) return res.status(404).json({ error: 'Not found' })
  Object.assign(task, req.body)
  writeDb(db)
  res.json(task)
})

app.delete('/api/tasks/marlaa/:id', (req, res) => {
  const db = readDb()
  db.tasks.marlaa = db.tasks.marlaa.filter(t => t.id !== req.params.id)
  writeDb(db)
  res.json({ ok: true })
})

// ── Tsogoo tasks ─────────────────────────────────────────────────
app.patch('/api/tasks/tsogoo/:gi/:id', (req, res) => {
  const db  = readDb()
  const grp = db.tasks.tsogooGroups[+req.params.gi]
  if (!grp) return res.status(404).json({ error: 'Group not found' })
  const task = grp.tasks.find(t => t.id === req.params.id)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  Object.assign(task, req.body)
  writeDb(db)
  res.json(task)
})

app.delete('/api/tasks/tsogoo/:gi/:id', (req, res) => {
  const db  = readDb()
  const grp = db.tasks.tsogooGroups[+req.params.gi]
  if (!grp) return res.status(404).json({ error: 'Group not found' })
  grp.tasks = grp.tasks.filter(t => t.id !== req.params.id)
  writeDb(db)
  res.json({ ok: true })
})

// ── Shared tasks ─────────────────────────────────────────────────
app.post('/api/tasks/shared', (req, res) => {
  const db = readDb()
  db.tasks.shared.push(req.body)
  writeDb(db)
  res.status(201).json(req.body)
})

app.patch('/api/tasks/shared/:id', (req, res) => {
  const db = readDb()
  const task = db.tasks.shared.find(t => t.id === req.params.id)
  if (!task) return res.status(404).json({ error: 'Not found' })
  Object.assign(task, req.body)
  writeDb(db)
  res.json(task)
})

app.delete('/api/tasks/shared/:id', (req, res) => {
  const db = readDb()
  db.tasks.shared = db.tasks.shared.filter(t => t.id !== req.params.id)
  writeDb(db)
  res.json({ ok: true })
})

// ── Drag-drop: move task between marlaa ↔ shared ─────────────────
app.post('/api/tasks/move', (req, res) => {
  const { fromList, toList, taskId } = req.body
  const db = readDb()
  if (fromList === 'marlaa' && toList === 'shared') {
    const idx = db.tasks.marlaa.findIndex(t => t.id === taskId)
    if (idx === -1) return res.status(404).json({ error: 'Task not found' })
    const [t] = db.tasks.marlaa.splice(idx, 1)
    db.tasks.shared.push({ ...t, deadline: null, sub: null })
  } else if (fromList === 'shared' && toList === 'marlaa') {
    const idx = db.tasks.shared.findIndex(t => t.id === taskId)
    if (idx === -1) return res.status(404).json({ error: 'Task not found' })
    const [t] = db.tasks.shared.splice(idx, 1)
    db.tasks.marlaa.push(t)
  } else {
    return res.status(400).json({ error: 'Unsupported move' })
  }
  writeDb(db)
  res.json({ ok: true })
})

// ── AI Scheduler ─────────────────────────────────────────────────
app.post('/api/schedule', async (req, res) => {
  const { prompt, apiKey, currentEvents } = req.body
  if (!apiKey) return res.status(400).json({ error: 'API key required' })
  if (!prompt)  return res.status(400).json({ error: 'Prompt required' })

  const today = new Date().toISOString().split('T')[0]

  const systemPrompt = `You are a smart calendar scheduling assistant.
Today's date: ${today}

The user's existing calendar events:
${JSON.stringify(currentEvents || {}, null, 2)}

Given the user's request, create optimal calendar events that fit around existing ones.

IMPORTANT: Return ONLY a valid JSON array — no markdown, no explanation, nothing else. Format:
[
  {
    "date": "YYYY-MM-DD",
    "time": "HH:MM — HH:MM",
    "title": "Clear event title",
    "details": "Optional details, or empty string"
  }
]

Rules:
- Avoid conflicts with existing events
- Use reasonable hours (09:00 — 21:00) unless the user specifies otherwise
- Respect any deadlines mentioned
- For long tasks, split into multiple focused sessions if needed
- Keep titles short and clear`

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].text.trim()
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return res.status(500).json({ error: 'Could not parse AI response as JSON' })

    const events = JSON.parse(match[0])
    res.json({ events })
  } catch (e) {
    console.error('Anthropic error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ── Start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => console.log(`API server → http://localhost:${PORT}`))
