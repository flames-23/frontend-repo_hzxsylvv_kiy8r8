import { useEffect, useMemo, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(() => {
    const d = localStorage.getItem('user')
    return d ? JSON.parse(d) : null
  })

  const login = async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) throw new Error('Invalid credentials')
    const data = await res.json()
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }

  const register = async (name, email, password) => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })
    if (!res.ok) throw new Error('Registration failed')
    const data = await res.json()
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken('')
    setUser(null)
  }

  return { token, user, login, register, logout }
}

function DarkLayout({ children, title, onLogout, user }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/80 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-emerald-400 font-bold">CC</span>
            </div>
            <h1 className="text-lg font-semibold">SecureView</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {user && <span className="text-zinc-400">{user.name}</span>}
            {onLogout && (
              <button onClick={onLogout} className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700">Logout</button>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">{children}</main>
      <footer className="max-w-5xl mx-auto p-4 text-xs text-zinc-500">© {new Date().getFullYear()} SecureView</footer>
    </div>
  )
}

function AuthScreen({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') await onLogin(email, password)
      else await onRegister(name, email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-1">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="text-sm text-zinc-400 mb-6">Secure access to your cameras and alerts.</p>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/40" required />
            </div>
          )}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/40" required />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/40" required />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded mt-2">{loading ? 'Please wait...' : (mode==='login'?'Sign in':'Create account')}</button>
        </form>
        <button onClick={()=>setMode(mode==='login'?'register':'login')} className="mt-4 text-sm text-zinc-400 hover:text-zinc-200">
          {mode==='login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}

function Dashboard({ token, user, onLogout }) {
  const [tab, setTab] = useState('live')
  const [cameras, setCameras] = useState([])
  const [alerts, setAlerts] = useState([])
  const [services, setServices] = useState([])
  const [subscription, setSubscription] = useState(null)

  const headers = useMemo(()=>({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }), [token])

  const load = async () => {
    const [camRes, alertRes, svcRes, subRes] = await Promise.all([
      fetch(`${API}/cameras`, { headers }),
      fetch(`${API}/alerts`, { headers }),
      fetch(`${API}/services`, { headers }),
      fetch(`${API}/subscription`, { headers }),
    ])
    setCameras(await camRes.json())
    setAlerts(await alertRes.json())
    setServices(await svcRes.json())
    setSubscription(await subRes.json())
  }

  useEffect(()=>{ load() }, [])

  const createService = async () => {
    const address = prompt('Service address')
    if (!address) return
    await fetch(`${API}/services`, { method:'POST', headers, body: JSON.stringify({ service_type:'maintenance', address }) })
    await load()
  }

  const pay = async () => {
    await fetch(`${API}/payments/checkout`, { method:'POST', headers, body: JSON.stringify({ amount: 19.99, description: 'Monthly subscription' }) })
    await load()
    alert('Payment successful')
  }

  return (
    <DarkLayout user={user} onLogout={onLogout}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="col-span-3">
          <div className="flex gap-2 mb-3">
            {['live','recordings','alerts','services','account'].map(t=> (
              <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded border ${tab===t?'bg-zinc-800 border-zinc-600':'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>{t.toUpperCase()}</button>
            ))}
          </div>

          {tab==='live' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cameras.length===0 && (
                <div className="p-6 border border-zinc-800 rounded-lg text-zinc-400">No cameras yet. Add one to view live feeds.</div>
              )}
              {cameras.map(c => (
                <div key={c._id} className="bg-black border border-zinc-800 rounded-lg overflow-hidden">
                  <div className="p-3 flex items-center justify-between border-b border-zinc-800">
                    <div>
                      <div className="text-sm text-zinc-300">{c.name}</div>
                      <div className="text-xs text-zinc-500">{c.location || 'Unspecified location'}</div>
                    </div>
                  </div>
                  <div className="aspect-video bg-zinc-900 flex items-center justify-center text-zinc-500">
                    {c.stream_url ? (
                      <video src={c.stream_url} controls autoPlay muted className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-sm">Stream unavailable</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab==='recordings' && (
            <Recordings headers={headers} />
          )}

          {tab==='alerts' && (
            <div className="space-y-2">
              {alerts.map(a => (
                <div key={a._id} className="p-3 rounded border border-zinc-800 bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-zinc-100">{a.title}</div>
                      <div className="text-sm text-zinc-400">{a.message}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded border ${a.level==='critical'?'border-red-600 text-red-400':a.level==='warning'?'border-amber-600 text-amber-400':'border-emerald-600 text-emerald-400'}`}>{a.level}</span>
                  </div>
                </div>
              ))}
              {alerts.length===0 && <p className="text-zinc-500">No alerts yet.</p>}
            </div>
          )}

          {tab==='services' && (
            <div>
              <button onClick={createService} className="mb-3 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500">Book service</button>
              <div className="space-y-2">
                {services.map(s => (
                  <div key={s._id} className="p-3 rounded border border-zinc-800 bg-zinc-900 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{s.service_type}</div>
                      <div className="text-sm text-zinc-400">{s.address}</div>
                    </div>
                    <span className="text-xs text-zinc-400">{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='account' && (
            <div className="space-y-3">
              <div className="p-4 rounded border border-zinc-800 bg-zinc-900">
                <div className="text-sm text-zinc-400">Plan</div>
                <div className="text-lg">{subscription?.plan || 'basic'}</div>
              </div>
              <button onClick={pay} className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500">Pay $19.99</button>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <AddCameraCard headers={headers} onAdded={load} />
          <AdminPanel headers={headers} user={user} />
        </div>
      </div>
    </DarkLayout>
  )
}

function AddCameraCard({ headers, onAdded }) {
  const [name, setName] = useState('Front Door')
  const [location, setLocation] = useState('Entrance')
  const [stream_url, setStreamUrl] = useState('')
  const add = async () => {
    await fetch(`${API}/cameras`, { method:'POST', headers, body: JSON.stringify({ name, location, stream_url }) })
    setName('')
    setLocation('')
    setStreamUrl('')
    onAdded && onAdded()
  }
  return (
    <div className="p-4 rounded border border-zinc-800 bg-zinc-900">
      <div className="font-medium mb-2">Add Camera</div>
      <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="w-full mb-2 bg-zinc-950 border border-zinc-800 rounded px-3 py-2" />
      <input placeholder="Location" value={location} onChange={e=>setLocation(e.target.value)} className="w-full mb-2 bg-zinc-950 border border-zinc-800 rounded px-3 py-2" />
      <input placeholder="Stream URL (HLS)" value={stream_url} onChange={e=>setStreamUrl(e.target.value)} className="w-full mb-2 bg-zinc-950 border border-zinc-800 rounded px-3 py-2" />
      <button onClick={add} className="w-full bg-zinc-800 hover:bg-zinc-700 rounded py-2">Add</button>
    </div>
  )
}

function Recordings({ headers }) {
  const [items, setItems] = useState([])
  useEffect(()=>{
    (async()=>{
      const res = await fetch(`${API}/recordings`, { headers })
      const data = await res.json()
      setItems(data)
    })()
  }, [])
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.length===0 && <div className="p-6 border border-zinc-800 rounded-lg text-zinc-400">No recordings found.</div>}
      {items.map(r => (
        <div key={r._id} className="border border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-zinc-800">
            <div className="text-sm">{new Date(r.started_at).toLocaleString()} - {new Date(r.ended_at).toLocaleString()}</div>
          </div>
          <div className="aspect-video bg-black flex items-center justify-center">
            <video src={r.playback_url} controls className="w-full h-full object-cover" />
          </div>
        </div>
      ))}
    </div>
  )
}

function AdminPanel({ headers, user }) {
  const isAdmin = user?.role === 'admin'
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [cams, setCams] = useState([])
  const [svcs, setSvcs] = useState([])
  const [alertMsg, setAlertMsg] = useState('')
  const [alertTitle, setAlertTitle] = useState('Motion detected')

  const load = async () => {
    if (!isAdmin) return
    const [u, c, s] = await Promise.all([
      fetch(`${API}/admin/users`, { headers }),
      fetch(`${API}/admin/cameras`, { headers }),
      fetch(`${API}/admin/services`, { headers }),
    ])
    setUsers(await u.json())
    setCams(await c.json())
    setSvcs(await s.json())
  }

  useEffect(()=>{ load() }, [isAdmin])

  const sendAlert = async () => {
    await fetch(`${API}/admin/alerts`, { method:'POST', headers, body: JSON.stringify({ title: alertTitle, message: alertMsg, level:'warning' }) })
    setAlertMsg('')
    alert('Alert sent')
  }

  if (!isAdmin) return (
    <div className="p-4 rounded border border-zinc-800 bg-zinc-900">
      <div className="text-sm text-zinc-400">Admin panel available for admin accounts.</div>
    </div>
  )

  return (
    <div className="p-4 rounded border border-zinc-800 bg-zinc-900">
      <div className="flex gap-2 mb-3">
        {['users','cameras','services','alerts'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded border ${tab===t?'bg-zinc-800 border-zinc-600':'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab==='users' && (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u._id} className="p-3 border border-zinc-800 rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-zinc-400">{u.email}</div>
              </div>
              <span className="text-xs text-zinc-500">{u.role}</span>
            </div>
          ))}
        </div>
      )}

      {tab==='cameras' && (
        <div className="space-y-2">
          {cams.map(c => (
            <div key={c._id} className="p-3 border border-zinc-800 rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-zinc-400">{c.location}</div>
              </div>
              <span className="text-xs text-zinc-500">{c.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab==='services' && (
        <div className="space-y-2">
          {svcs.map(s => (
            <div key={s._id} className="p-3 border border-zinc-800 rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{s.service_type}</div>
                <div className="text-xs text-zinc-400">{s.address}</div>
              </div>
              <span className="text-xs text-zinc-500">{s.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab==='alerts' && (
        <div>
          <input placeholder="Title" value={alertTitle} onChange={e=>setAlertTitle(e.target.value)} className="w-full mb-2 bg-zinc-950 border border-zinc-800 rounded px-3 py-2" />
          <textarea placeholder="Message" value={alertMsg} onChange={e=>setAlertMsg(e.target.value)} className="w-full mb-2 bg-zinc-950 border border-zinc-800 rounded px-3 py-2" />
          <button onClick={sendAlert} className="w-full bg-emerald-600 hover:bg-emerald-500 rounded py-2">Send Alert</button>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const { token, user, login, register, logout } = useAuth()
  if (!token) return <AuthScreen onLogin={login} onRegister={register} />
  return <Dashboard token={token} user={user} onLogout={logout} />
}
