import React, { useState, createContext } from 'react'
import { MyForm } from './Form'

import { createContextSelector } from 'react-hooks-in-callback'
const ctxValue = { x: 1, title: 'pippo-test' }
const ctx = createContext(ctxValue)
export const [Cleanner, useContextSelector] = createContextSelector(ctx)

export default () => {
  const [state, setState] = useState(ctxValue)
  return (
    <ctx.Provider value={state}>
      <Cleanner />
      <button
        onClick={() => {
          setState((s) => {
            return { ...s, x: s.x + 1 }
          })
        }}
      >
        increment x
      </button>
      <MyForm />
    </ctx.Provider>
  )
}
