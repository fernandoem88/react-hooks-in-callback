import React, { FC, useReducer, useEffect } from 'react'
import { Action, Store } from 'app-types'
import Channels from './Channels'

export const HooksWrapper: FC<{
  children?: undefined
  getStore: () => Store
}> = (props) => {
  if (props.children !== undefined) {
    throw new Error(
      `the HooksWrapper do not accept any children components
        and should be mounted as first child in the components tree`
    )
  }

  useEffect(() => {
    const store = props.getStore()
    store.mounted = true
    return () => {
      store.mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [ids, dispatch] = useReducer((ids: string[], action: Action) => {
    if (action.type === 'ADD') {
      return [...ids, action.payload]
    }
    if (action.type === 'DELETE') {
      return ids.filter((id) => id !== action.payload)
    }
    return ids
  }, [])

  return <Channels getStore={props.getStore} ids={ids} dispatch={dispatch} />
}

export default HooksWrapper // memo(HooksWrapper) as FC<{}>
