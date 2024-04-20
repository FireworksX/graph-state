import { createState } from '@graph-state/core'
import { useGraph } from '@graph-state/react'
import { useState } from 'react'
import useSWR from 'swr'

export const generateId = () => Math.random().toString(16).slice(2)


const fetcher = url => fetch(url).then(r => r.json())

const statex = createState({})

window.statex = statex


function App() {
  const { data, error } = useSWR('https://jsonplaceholder.typicode.com/todos', fetcher)

  console.log(data)


  return (
    <>
      <h1>Selections</h1>
fdzffsdfdsfs
    </>
  )
}

export default App
