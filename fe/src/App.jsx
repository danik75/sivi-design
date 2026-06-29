import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(null)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setToken(null)
    try {
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`${res.status} ${res.statusText}: ${text}`)
      }
      const data = await res.json()
      setToken(data.access_token || data.token || JSON.stringify(data))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="app-root">
      <header>
        <img src={reactLogo} className="logo" alt="React" />
        <h1>sivi-design — Login (dev)</h1>
      </header>

      <main>
        <section className="login-panel">
          <form onSubmit={submit} className="login-form">
            <label>
              Username
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <div className="actions">
              <button type="submit">Login</button>
            </div>
          </form>

          {token && (
            <div className="result">
              <h3>Logged in — token</h3>
              <textarea rows={5} readOnly value={token}></textarea>
            </div>
          )}

          {error && (
            <div className="error">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="hint">Use username: <code>cv</code> password: <code>cv</code> (dev seed)</div>
        </section>

        <section className="info">
          <img src={heroImg} className="hero" width="170" height="179" alt="" />
          <p>Simple local login page for development. Not for production.</p>
        </section>
      </main>

      <footer>
        <small>Local dev — JWT stored in-memory only for demo.</small>
      </footer>
    </div>
  )
}

export default App
