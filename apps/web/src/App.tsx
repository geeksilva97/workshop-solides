import { useEffect, useState } from 'react'
import { helloResponseSchema } from '@workshop/shared'
import './App.css'

function App() {
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(helloResponseSchema.parse(data).message))
      .catch(() => setMessage('API is offline'))
  }, [])

  return (
    <main>
      <h1>Workshop Solides</h1>
      <p>{message}</p>
    </main>
  )
}

export default App
