import React, { useRef, useState, useMemo, FC, memo, Fragment } from 'react'
import Channel from './Channel'

import { Store, Resolver, Action } from 'app-types' // eslint-disable-line

interface Props {
  getStore: () => Store
  children?: undefined
  dispatch: (action: Action) => void
  ids: string[]
}

const Channels: FC<Props> = (props) => {
  const resolversRef = useRef<{ [id: string]: Resolver }>({})

  const { ids, dispatch, getStore } = props

  useState(() => {
    const store = getStore()
    const addResolver = (id: string, resolver: any) => {
      resolversRef.current[id] = resolver
    }
    const getResolver = (id: string) => {
      return resolversRef.current[id]
    }
    const deleteResolver = (id: string) => {
      store.dispatch({ type: 'DELETE', payload: id })
      delete resolversRef.current[id]
    }

    store.helpers.addResolver = addResolver
    store.helpers.getResolver = getResolver
    store.helpers.deleteResolver = deleteResolver
    store.dispatch = (action: any) => dispatch(action)
  })

  const channels = useMemo(() => {
    const store = getStore()
    return ids.map((id) => (
      <Channel
        key={id}
        hook={store.helpers.getHook(id)}
        resolver={store.helpers.getResolver(id)}
      />
    ))
  }, [ids, getStore])

  return <Fragment>{channels}</Fragment>
}

export default memo(Channels)
