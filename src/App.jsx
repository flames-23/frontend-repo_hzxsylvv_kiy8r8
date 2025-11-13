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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
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
      <main className="max-w-6xl mx-auto p-4">{children}</main>
      <footer className="max-w-6xl mx-auto p-4 text-xs text-zinc-500">© {new Date().getFullYear()} SecureView</footer>
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
        <p className="text-sm text-zinc-400 mb-6">Shop CCTV products and book professional installation.</p>
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
  const [tab, setTab] = useState('shop')

  return (
    <DarkLayout user={user} onLogout={onLogout}>
      <div className="flex flex-wrap gap-2 mb-4">
        {['shop','cart','services','account','admin'].map(t=> (
          <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded border ${tab===t?'bg-zinc-800 border-zinc-600':'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab==='shop' && <Shop token={token} />}
      {tab==='cart' && <Cart token={token} />}
      {tab==='services' && <Services token={token} />}
      {tab==='account' && <Account token={token} />}
      {tab==='admin' && <AdminPanel token={token} user={user} />}
    </DarkLayout>
  )
}

function useAuthHeaders(token){
  return useMemo(()=>({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }), [token])
}

function Shop({ token }){
  const [products, setProducts] = useState([])
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    const res = await fetch(`${API}/products?${params.toString()}`)
    const data = await res.json()
    setProducts(data)
    setLoading(false)
  }
  useEffect(()=>{ load() }, [])

  const addToCart = (p) => {
    const existing = JSON.parse(localStorage.getItem('cart') || '[]')
    const idx = existing.findIndex(i => i.product_id === p._id)
    if (idx >= 0) existing[idx].qty += 1
    else existing.push({ product_id: p._id, name: p.name, price: p.price, qty: 1, image: p.images?.[0] })
    localStorage.setItem('cart', JSON.stringify(existing))
    alert('Added to cart')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <input placeholder="Search products" value={q} onChange={e=>setQ(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2" />
        <select value={category} onChange={e=>setCategory(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2">
          <option value="">All categories</option>
          <option value="camera">Cameras</option>
          <option value="accessory">Accessories</option>
          <option value="system">Systems</option>
          <option value="dvr">DVR</option>
          <option value="nvr">NVR</option>
          <option value="cable">Cables</option>
          <option value="service">Service</option>
        </select>
        <button onClick={load} className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700">Filter</button>
      </div>

      {loading && <div className="text-zinc-400">Loading...</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map(p => (
          <div key={p._id} className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900">
            <div className="aspect-video bg-black">
              {p.images?.[0] ? (
                <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">No image</div>
              )}
            </div>
            <div className="p-3">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-zinc-400 line-clamp-2 min-h-[2.5rem]">{p.description}</div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-emerald-400 font-semibold">${(p.price||0).toFixed(2)}</div>
                <button onClick={()=>addToCart(p)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded">Add to cart</button>
              </div>
            </div>
          </div>
        ))}
        {products.length===0 && !loading && (
          <div className="text-zinc-500">No products found.</div>
        )}
      </div>
    </div>
  )
}

function Cart({ token }){
  const headers = useAuthHeaders(token)
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'))
  const [address, setAddress] = useState('')

  const updateQty = (product_id, delta) => {
    const next = items.map(i => i.product_id===product_id ? { ...i, qty: Math.max(1, i.qty + delta)} : i)
    setItems(next)
    localStorage.setItem('cart', JSON.stringify(next))
  }
  const removeItem = (product_id) => {
    const next = items.filter(i => i.product_id !== product_id)
    setItems(next)
    localStorage.setItem('cart', JSON.stringify(next))
  }

  const subtotal = items.reduce((s,i)=> s + i.price * i.qty, 0)
  const tax = +(subtotal * 0.07).toFixed(2)
  const total = +(subtotal + tax).toFixed(2)

  const placeOrder = async () => {
    if (items.length===0) return
    const res = await fetch(`${API}/orders`, { method:'POST', headers, body: JSON.stringify({ items: items.map(i=>({ product_id: i.product_id, qty: i.qty })), address }) })
    if (!res.ok) { alert('Order failed'); return }
    const order = await res.json()
    const pay = await fetch(`${API}/payments/checkout`, { method:'POST', headers, body: JSON.stringify({ amount: order.total, description: `Order ${order._id}`, order_id: order._id }) })
    if (!pay.ok) { alert('Payment failed'); return }
    localStorage.removeItem('cart')
    setItems([])
    alert('Order placed and paid successfully!')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2 space-y-2">
        {items.map(i => (
          <div key={i.product_id} className="p-3 border border-zinc-800 rounded bg-zinc-900 flex items-center gap-3">
            <div className="w-20 h-16 bg-black rounded overflow-hidden flex items-center justify-center">
              {i.image ? <img src={i.image} className="w-full h-full object-cover" /> : <span className="text-zinc-600 text-xs">No image</span>}
            </div>
            <div className="flex-1">
              <div className="font-medium">{i.name}</div>
              <div className="text-xs text-zinc-400">${i.price.toFixed(2)} each</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>updateQty(i.product_id, -1)} className="px-2 py-1 bg-zinc-800 rounded">-</button>
              <span>{i.qty}</span>
              <button onClick={()=>updateQty(i.product_id, 1)} className="px-2 py-1 bg-zinc-800 rounded">+</button>
            </div>
            <div className="w-20 text-right">${(i.price*i.qty).toFixed(2)}</div>
            <button onClick={()=>removeItem(i.product_id)} className="text-red-400 text-sm">Remove</button>
          </div>
        ))}
        {items.length===0 && <div className="text-zinc-500">Your cart is empty.</div>}
      </div>
      <div className="p-4 border border-zinc-800 rounded bg-zinc-900 h-fit">
        <div className="font-medium mb-2">Order summary</div>
        <div className="text-sm flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        <div className="text-sm flex justify-between text-zinc-400"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
        <div className="text-sm flex justify-between mt-1 pt-2 border-t border-zinc-800"><span>Total</span><span className="font-semibold">${total.toFixed(2)}</span></div>
        <div className="mt-3">
          <textarea placeholder="Shipping/installation address" value={address} onChange={e=>setAddress(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2" />
        </div>
        <button onClick={placeOrder} disabled={items.length===0} className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded py-2">Place order</button>
      </div>
    </div>
  )
}

function Services({ token }){
  const headers = useAuthHeaders(token)
  const [services, setServices] = useState([])

  const load = async () => {
    const res = await fetch(`${API}/services`, { headers })
    setServices(await res.json())
  }
  useEffect(()=>{ load() }, [])

  const book = async () => {
    const address = prompt('Service address')
    if (!address) return
    await fetch(`${API}/services`, { method:'POST', headers, body: JSON.stringify({ service_type:'installation', address }) })
    await load()
  }

  return (
    <div>
      <button onClick={book} className="mb-3 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500">Book installation</button>
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
        {services.length===0 && <p className="text-zinc-500">No service bookings yet.</p>}
      </div>
    </div>
  )
}

function Account({ token }){
  const headers = useAuthHeaders(token)
  const [sub, setSub] = useState(null)
  const load = async () => {
    const res = await fetch(`${API}/subscription`, { headers })
    setSub(await res.json())
  }
  useEffect(()=>{ load() }, [])

  const changePlan = async (plan) => {
    await fetch(`${API}/subscription`, { method:'POST', headers, body: JSON.stringify({ plan }) })
    await load()
  }

  return (
    <div className="space-y-3">
      <div className="p-4 rounded border border-zinc-800 bg-zinc-900">
        <div className="text-sm text-zinc-400">Subscription</div>
        <div className="text-lg">{sub?.plan || 'basic'}</div>
        <div className="text-xs text-zinc-500">Status: {sub?.status || 'active'}</div>
      </div>
      <div className="flex gap-2">
        {['basic','standard','pro'].map(p => (
          <button key={p} onClick={()=>changePlan(p)} className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700">{p}</button>
        ))}
      </div>
    </div>
  )
}

function AdminPanel({ token, user }){
  const headers = useAuthHeaders(token)
  const isAdmin = user?.role === 'admin'
  const [tab, setTab] = useState('products')
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [svcs, setSvcs] = useState([])

  const [pForm, setPForm] = useState({ name:'', price:'', category:'camera', stock:0, description:'', images:'' })

  const load = async () => {
    if (!isAdmin) return
    const [u, p, o, s] = await Promise.all([
      fetch(`${API}/admin/users`, { headers }),
      fetch(`${API}/products`),
      fetch(`${API}/admin/orders`, { headers }),
      fetch(`${API}/admin/services`, { headers }),
    ])
    setUsers(await u.json())
    setProducts(await p.json())
    setOrders(await o.json())
    setSvcs(await s.json())
  }
  useEffect(()=>{ load() }, [isAdmin])

  const createProduct = async () => {
    const body = { ...pForm, price: parseFloat(pForm.price||0), stock: parseInt(pForm.stock||0), images: pForm.images? pForm.images.split(',').map(s=>s.trim()).filter(Boolean): [] }
    const res = await fetch(`${API}/admin/products`, { method:'POST', headers, body: JSON.stringify(body) })
    if (!res.ok) { alert('Failed to create product'); return }
    setPForm({ name:'', price:'', category:'camera', stock:0, description:'', images:'' })
    await load()
  }

  const deleteProduct = async (id) => {
    await fetch(`${API}/admin/products/${id}`, { method:'DELETE', headers })
    await load()
  }

  const updateOrderStatus = async (id, status) => {
    await fetch(`${API}/admin/orders/${id}`, { method:'PATCH', headers, body: JSON.stringify({ status }) })
    await load()
  }

  if (!isAdmin) return (
    <div className="p-4 rounded border border-zinc-800 bg-zinc-900">
      <div className="text-sm text-zinc-400">Admin dashboard is available for admin accounts.</div>
    </div>
  )

  return (
    <div className="p-4 rounded border border-zinc-800 bg-zinc-900">
      <div className="flex flex-wrap gap-2 mb-3">
        {['products','orders','customers','services'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded border ${tab===t?'bg-zinc-800 border-zinc-600':'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab==='products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            {products.map(p => (
              <div key={p._id} className="p-3 border border-zinc-800 rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-zinc-400">{p.category} • ${p.price?.toFixed(2)} • stock {p.stock}</div>
                </div>
                <button onClick={()=>deleteProduct(p._id)} className="text-red-400 text-sm">Delete</button>
              </div>
            ))}
            {products.length===0 && <div className="text-zinc-500">No products yet.</div>}
          </div>
          <div className="space-y-2">
            <div className="font-medium">New product</div>
            <input placeholder="Name" value={pForm.name} onChange={e=>setPForm(v=>({...v,name:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2" />
            <textarea placeholder="Description" value={pForm.description} onChange={e=>setPForm(v=>({...v,description:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2" />
            <div className="flex gap-2">
              <input placeholder="Category" value={pForm.category} onChange={e=>setPForm(v=>({...v,category:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2" />
              <input placeholder="Price" value={pForm.price} onChange={e=>setPForm(v=>({...v,price:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2" />
            </div>
            <div className="flex gap-2">
              <input placeholder="Stock" value={pForm.stock} onChange={e=>setPForm(v=>({...v,stock:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2" />
              <input placeholder="Images (comma-separated URLs)" value={pForm.images} onChange={e=>setPForm(v=>({...v,images:e.target.value}))} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2" />
            </div>
            <button onClick={createProduct} className="w-full bg-emerald-600 hover:bg-emerald-500 rounded py-2">Create</button>
          </div>
        </div>
      )}

      {tab==='orders' && (
        <div className="space-y-2">
          {orders.map(o => (
            <div key={o._id} className="p-3 border border-zinc-800 rounded">
              <div className="flex items-center justify-between">
                <div className="font-medium">Order {o._id}</div>
                <div className="text-xs text-zinc-400">{new Date(o.created_at).toLocaleString?.() || ''}</div>
              </div>
              <div className="text-sm text-zinc-400">{o.items.length} items • ${o.total?.toFixed(2)} • {o.status}</div>
              <div className="mt-2 flex gap-2">
                {['paid','processing','shipped','completed','cancelled'].map(s => (
                  <button key={s} onClick={()=>updateOrderStatus(o._id, s)} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs">{s}</button>
                ))}
              </div>
            </div>
          ))}
          {orders.length===0 && <div className="text-zinc-500">No orders yet.</div>}
        </div>
      )}

      {tab==='customers' && (
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
          {users.length===0 && <div className="text-zinc-500">No customers yet.</div>}
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
          {svcs.length===0 && <div className="text-zinc-500">No service requests.</div>}
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
