import { useState } from 'react'
import './App.css'
import ListPolicy from './components/ListPolicy/ListPolicy'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <ListPolicy/>
    </div>
  )
}

export default App


