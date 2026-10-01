const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const path = require('node:path')

dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
const port = Number(process.env.PORT) || 3001
const companies = [
  'Wipro',
  'Infosys',
  'Tata Consultancy Services',
  'HCLTech',
  'Accenture',
  'Cognizant',
  'Capgemini',
  'IBM',
  'Tech Mahindra',
  'LTIMindtree',
]

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true },
    studentIdNormalized: { type: String, required: true, unique: true, select: false },
    department: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    bloodGroup: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    motherName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, match: /^[0-9]{10}$/ },
    email: { type: String, required: true, trim: true, lowercase: true },
    arrears: { type: Number, required: true, min: 0, validate: Number.isInteger },
    companies: [{ type: String, enum: companies }],
  },
  { timestamps: true },
)

const Student = mongoose.model('Student', studentSchema)

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})

app.get('/api/students', async (_request, response, next) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 }).lean()
    response.json(students)
  } catch (error) {
    next(error)
  }
})

app.post('/api/students', async (request, response, next) => {
  try {
    const body = request.body || {}
    const requiredFields = [
      'name',
      'studentId',
      'department',
      'year',
      'section',
      'bloodGroup',
      'fatherName',
      'motherName',
      'phone',
      'email',
    ]
    const missingField = requiredFields.find(
      (field) => typeof body[field] !== 'string' || !body[field].trim(),
    )

    if (missingField) {
      return response.status(400).json({ error: `${missingField} is required.` })
    }
    if (!Number.isInteger(body.arrears) || body.arrears < 0) {
      return response.status(400).json({ error: 'Arrears must be a non-negative whole number.' })
    }
    if (!/^[0-9]{10}$/.test(body.phone.trim())) {
      return response.status(400).json({ error: 'Phone number must contain exactly 10 digits.' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
      return response.status(400).json({ error: 'Enter a valid email address.' })
    }

    const selectedCompanies = body.companies
    if (!Array.isArray(selectedCompanies)) {
      return response.status(400).json({ error: 'Company preferences must be a list.' })
    }
    if (body.arrears === 0) {
      const validChoices =
        selectedCompanies.length === 4 &&
        new Set(selectedCompanies).size === 4 &&
        selectedCompanies.every((company) => companies.includes(company))
      if (!validChoices) {
        return response.status(400).json({ error: 'Eligible students must choose exactly four listed companies.' })
      }
    } else if (selectedCompanies.length !== 0) {
      return response.status(400).json({ error: 'Students with standing arrears cannot select companies.' })
    }

    const normalizedId = body.studentId.trim().toLowerCase()
    const student = await Student.create({
      ...body,
      studentId: body.studentId.trim(),
      studentIdNormalized: normalizedId,
      companies: selectedCompanies,
    })
    response.status(201).json(student)
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ error: 'That student ID is already registered.' })
    }
    if (error.name === 'ValidationError') {
      return response.status(400).json({ error: 'Student registration details are invalid.' })
    }
    next(error)
  }
})

app.use((error, _request, response, _next) => {
  console.error('API error:', error.message)
  response.status(500).json({ error: 'The registration service could not complete the request.' })
})

async function startServer() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing from server/.env')
  }
  await mongoose.connect(process.env.MONGO_URI)
  app.listen(port, () => {
    console.log(`Placement API listening on http://localhost:${port}`)
  })
}

startServer().catch((error) => {
  console.error('Could not start placement API:', error.message)
  process.exit(1)
})