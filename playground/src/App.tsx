import { createState } from '@graph-state/core'
import { useGraph } from '@graph-state/react'
import { useState } from 'react'


const statex = createState({})

window.statex = statex


function App() {
  const [value, setValue] = useState('')
  const [index, setIndex] = useState(0)
  const document = useGraph(statex, statex.root)

  return (
    <>
      <h1>Selections</h1>
fdzffsdfdsfs
    </>
  )
}

export default App
