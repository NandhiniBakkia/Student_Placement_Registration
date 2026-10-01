import { useEffect, useState } from 'react'
import './App.css'

const companies = [
  { name: 'Wipro', field: 'Technology services', mark: 'W' },
  { name: 'Infosys', field: 'Digital consulting', mark: 'I' },
  { name: 'Tata Consultancy Services', field: 'IT services', mark: 'T' },
  { name: 'HCLTech', field: 'Engineering & IT', mark: 'H' },
  { name: 'Accenture', field: 'Technology & strategy', mark: 'A' },
  { name: 'Cognizant', field: 'Digital solutions', mark: 'C' },
  { name: 'Capgemini', field: 'Business technology', mark: 'C' },
  { name: 'IBM', field: 'Cloud & AI', mark: 'I' },
  { name: 'Tech Mahindra', field: 'Connected experiences', mark: 'T' },
  { name: 'LTIMindtree', field: 'Technology consulting', mark: 'L' },
]

const emptyStudent = {
  name: '',
  studentId: '',
  department: '',
  year: '',
  section: '',
  bloodGroup: '',
  fatherName: '',
  motherName: '',
  phone: '',
  email: '',
  arrears: '',
}

async function fetchStudents() {
  const response = await fetch('/api/students')
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Could not load student registrations.')
  }
  return data
}

function App() {
  const [view, setView] = useState('student')
  const [step, setStep] = useState('details')
  const [form, setForm] = useState(emptyStudent)
  const [selectedCompanies, setSelectedCompanies] = useState([])
  const [students, setStudents] = useState([])
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    fetchStudents()
      .then((records) => {
        if (active) setStudents(records)
      })
      .catch((error) => {
        if (active) setApiError(error.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setMessage('')
  }

  const saveStudent = async (companyChoices) => {
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          studentId: form.studentId.trim(),
          arrears: Number(form.arrears),
          companies: companyChoices,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not save this registration.')
      }
      setStudents((current) => [data, ...current])
      setForm(emptyStudent)
      setSelectedCompanies([])
      setStep('details')
      setMessage(`${data.name} has been registered successfully.`)
    } catch (error) {
      setMessage(error.message || 'Could not reach the registration server.')
    } finally {
      setSaving(false)
    }
  }

  const handleDetailsSubmit = async (event) => {
    event.preventDefault()
    const duplicate = students.some(
      (student) => student.studentId.toLowerCase() === form.studentId.trim().toLowerCase(),
    )
    if (duplicate) {
      setMessage('That student ID is already registered.')
      return
    }
    if (Number(form.arrears) === 0) {
      setStep('companies')
      setMessage('')
      return
    }
    await saveStudent([])
  }

  const toggleCompany = (name) => {
    setSelectedCompanies((selected) =>
      selected.includes(name)
        ? selected.filter((company) => company !== name)
        : selected.length < 4
          ? [...selected, name]
          : selected,
    )
  }

  const filteredStudents = students.filter((student) => {
    const search = query.trim().toLowerCase()
    return (
      !search ||
      student.name.toLowerCase().includes(search) ||
      student.studentId.toLowerCase().includes(search) ||
      student.department.toLowerCase().includes(search)
    )
  })

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#student" onClick={() => setView('student')}>
          <span className="brand-mark">N</span>
          <span>Northstar<span className="brand-sub">CAREER SERVICES</span></span>
        </a>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="view-nav" aria-label="Workspace views">
          <button
            type="button"
            className={view === 'student' ? 'nav-item active' : 'nav-item'}
            onClick={() => { setView('student'); setMessage('') }}
          >
            <span className="nav-icon">01</span> Student registration
          </button>
          <button
            type="button"
            className={view === 'admin' ? 'nav-item active' : 'nav-item'}
            onClick={() => {
              setView('admin')
              setMessage('')
              fetchStudents()
                .then((records) => { setStudents(records); setApiError('') })
                .catch((error) => setApiError(error.message))
            }}
          >
            <span className="nav-icon">02</span> Admin roster
          </button>
        </nav>
        <div className="sidebar-bottom">
          <span className="status-dot" /> Registration portal
          <small>PLACEMENT SEASON · 2026</small>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <span>CAREER SERVICES <span className="crumb-divider">/</span> {view === 'student' ? 'STUDENT PORTAL' : 'ADMINISTRATION'}</span>
          <span className="term-label">ACADEMIC YEAR 2026–27</span>
        </header>

        {view === 'student' ? (
          <section className="content-wrap">
            <div className="page-heading">
              <div>
                <div className="eyebrow">PLACEMENT REGISTRATION <span>●</span> 2026</div>
                <h1>{step === 'details' ? 'Your next chapter starts here.' : 'Choose your four.'}</h1>
                <p className="page-description">
                  {step === 'details'
                    ? 'Share your details to get started with campus placements.'
                    : 'Select four companies you would like to be considered for.'}
                </p>
              </div>
              <div className="heading-art" aria-hidden="true"><span>26</span><i /></div>
            </div>

            {apiError && <div className="notice error" role="alert">{apiError}. Start the API server and confirm MongoDB is connected.</div>}

            <div className="stepper" aria-label="Registration progress">
              <div className={step === 'details' ? 'step active' : 'step done'}>
                <span className="step-number">{step === 'details' ? '01' : '✓'}</span>
                <span>Student details</span>
              </div>
              <span className="step-line" />
              <div className={step === 'companies' ? 'step active' : 'step'}>
                <span className="step-number">02</span>
                <span>Company choices</span>
              </div>
            </div>

            {message && <div className="notice" role="status">{message}</div>}

            {step === 'details' ? (
              <form className="form-panel" onSubmit={handleDetailsSubmit}>
                <div className="panel-heading">
                  <div><span className="section-index">01</span><h2>Student information</h2></div>
                  <span className="required-note">* REQUIRED FIELDS</span>
                </div>

                <div className="form-grid">
                  <label className="field field-wide">Student name <span>*</span>
                    <input name="name" value={form.name} onChange={updateField} placeholder="As shown on your college ID" autoComplete="name" required />
                  </label>
                  <label className="field">Student ID <span>*</span>
                    <input name="studentId" value={form.studentId} onChange={updateField} placeholder="e.g. 26CS014" required />
                  </label>
                  <label className="field">Department <span>*</span>
                    <select name="department" value={form.department} onChange={updateField} required>
                      <option value="" disabled>Select department</option>
                      <option>Computer Science</option><option>Information Technology</option><option>Electronics & Communication</option><option>Electrical & Electronics</option><option>Mechanical Engineering</option><option>Civil Engineering</option><option>Artificial Intelligence & Data Science</option><option>Other</option>
                    </select>
                  </label>
                  <label className="field">Year <span>*</span>
                    <select name="year" value={form.year} onChange={updateField} required>
                      <option value="" disabled>Select year</option><option>1st year</option><option>2nd year</option><option>3rd year</option><option>4th year</option>
                    </select>
                  </label>
                  <label className="field">Section <span>*</span>
                    <input name="section" value={form.section} onChange={updateField} placeholder="e.g. A" required />
                  </label>
                  <label className="field">Blood group <span>*</span>
                    <select name="bloodGroup" value={form.bloodGroup} onChange={updateField} required>
                      <option value="" disabled>Select blood group</option><option>A+</option><option>A−</option><option>B+</option><option>B−</option><option>AB+</option><option>AB−</option><option>O+</option><option>O−</option><option>Unknown</option>
                    </select>
                  </label>
                  <div className="form-divider"><span>FAMILY & CONTACT</span></div>
                  <label className="field">Father's name <span>*</span>
                    <input name="fatherName" value={form.fatherName} onChange={updateField} autoComplete="off" required />
                  </label>
                  <label className="field">Mother's name <span>*</span>
                    <input name="motherName" value={form.motherName} onChange={updateField} autoComplete="off" required />
                  </label>
                  <label className="field">Phone number <span>*</span>
                    <input name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="10-digit mobile number" pattern="[0-9]{10}" autoComplete="tel" required />
                  </label>
                  <label className="field">Email ID <span>*</span>
                    <input name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" required />
                  </label>
                  <div className="form-divider"><span>ACADEMIC ELIGIBILITY</span></div>
                  <label className="field arrears-field">Number of standing arrears <span>*</span>
                    <input name="arrears" type="number" min="0" step="1" value={form.arrears} onChange={updateField} placeholder="0" required />
                    <small>Students with zero standing arrears can select four companies.</small>
                  </label>
                  <div className="eligibility-note"><span className="note-symbol">i</span><span>Enter your current standing arrears. This determines your company selection eligibility.</span></div>
                </div>

                <div className="form-footer">
                  <span>All information is used for placement coordination.</span>
                  <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Submitting…' : form.arrears !== '' && Number(form.arrears) === 0 ? 'Continue to companies' : 'Submit registration'} <span aria-hidden="true">→</span></button>
                </div>
              </form>
            ) : (
              <section className="company-panel">
                <div className="company-intro">
                  <div><span className="section-index">02</span><h2>Company preferences</h2></div>
                  <p>Pick exactly four from this year's participating employers. Your choices can’t be changed after submission.</p>
                </div>
                <div className="selection-count"><span>{String(selectedCompanies.length).padStart(2, '0')}</span> / 04 SELECTED</div>
                <div className="company-grid">
                  {companies.map((company, index) => {
                    const checked = selectedCompanies.includes(company.name)
                    return (
                      <button
                        type="button"
                        key={company.name}
                        className={checked ? 'company-option selected' : 'company-option'}
                        disabled={selectedCompanies.length === 4 && !checked}
                        onClick={() => toggleCompany(company.name)}
                        aria-pressed={checked}
                      >
                        <span className={`company-mark mark-${index % 5}`}>{company.mark}</span>
                        <span className="company-copy"><strong>{company.name}</strong><small>{company.field}</small></span>
                        <span className="company-check" aria-hidden="true">{checked ? '✓' : '+'}</span>
                      </button>
                    )
                  })}
                </div>
                {selectedCompanies.length === 4 && <p className="selection-ready">Four preferences selected. You’re ready to submit.</p>}
                <div className="form-footer company-footer">
                  <button className="text-button" type="button" onClick={() => { setStep('details'); setSelectedCompanies([]) }}>← Back to details</button>
                  <button className="primary-button" type="button" disabled={selectedCompanies.length !== 4 || saving} onClick={() => saveStudent(selectedCompanies)}>{saving ? 'Submitting…' : 'Submit preferences'} <span aria-hidden="true">→</span></button>
                </div>
              </section>
            )}
            <p className="privacy-note"><span>✳</span> Your details are visible to the placement administration team only.</p>
          </section>
        ) : (
          <section className="content-wrap admin-wrap">
            <div className="page-heading admin-heading">
              <div>
                <div className="eyebrow">PLACEMENT OFFICE <span>●</span> ADMIN</div>
                <h1>Student roster.</h1>
                <p className="page-description">A live view of submitted placement registrations.</p>
              </div>
              <div className="roster-total"><strong>{students.length.toString().padStart(2, '0')}</strong><span>REGISTERED<br />STUDENTS</span></div>
            </div>
            {apiError && <div className="notice error" role="alert">{apiError}. Start the API server and confirm MongoDB is connected.</div>}
            <div className="roster-toolbar">
              <div className="roster-title"><span className="section-index">↳</span><h2>All registrations</h2></div>
              <label className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, ID, department" aria-label="Search students" /></label>
            </div>
            <div className="roster-table-wrap">
              <table className="roster-table">
                <thead><tr><th>STUDENT</th><th>DEPARTMENT</th><th>YEAR / SECTION</th><th>ARREARS</th><th>COMPANY PREFERENCES</th><th>STATUS</th></tr></thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.studentId}>
                      <td>
                        <strong>{student.name}</strong>
                        <small>{student.studentId}</small>
                        <details className="student-details">
                          <summary>Full record</summary>
                          <div><span>Phone</span>{student.phone}</div>
                          <div><span>Email</span>{student.email}</div>
                          <div><span>Blood group</span>{student.bloodGroup}</div>
                          <div><span>Father</span>{student.fatherName}</div>
                          <div><span>Mother</span>{student.motherName}</div>
                        </details>
                      </td>
                      <td>{student.department}</td>
                      <td>{student.year}<small>Section {student.section}</small></td>
                      <td><span className={student.arrears === 0 ? 'arrears-zero' : 'arrears-count'}>{student.arrears}</span></td>
                      <td>{student.companies.length ? <div className="company-tags">{student.companies.map((company) => <span key={company}>{company}</span>)}</div> : <span className="muted-cell">Not eligible</span>}</td>
                      <td><span className={student.arrears === 0 ? 'status-pill eligible' : 'status-pill pending'}><i />{student.arrears === 0 ? 'Eligible' : 'Ineligible'}</span></td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && <tr><td colSpan="6" className="empty-state"><span>{loading ? '…' : students.length ? '⌕' : '＋'}</span><strong>{loading ? 'Loading registrations' : students.length ? 'No matching students' : 'No registrations yet'}</strong><small>{loading ? 'Connecting to the registration database.' : students.length ? 'Try another name, student ID, or department.' : 'New student submissions will appear here.'}</small></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="roster-foot"><span>Showing {filteredStudents.length} of {students.length} registrations</span><span>PLACEMENT SEASON · 2026</span></div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
