import React, { useState, useMemo, useRef } from 'react'
import Channel from './Channel'

import { Store, Resolver, Action } from 'app-types' // eslint-disable-line

interface Props {
  getStore: () => Store
  children?: undefined
  dispatch: (action: Action) => void
  ids: string[]
}

const Channels: React.FC<Props> = (props) => {
  const resolversRef = useRef<{ [id: string]: Resolver }>({})

  const { ids, dispatch } = props

  useState(() => {
    const setResolver = (id: string, resolver: any) => {
      resolversRef.current[id] = resolver
    }
    const getResolver = (id: string) => {
      return resolversRef.current[id]
    }
    const deleteResolver = (id: string) => {
      delete resolversRef.current[id]
    }
    const store = props.getStore()
    store.helpers.setResolver = setResolver
    store.helpers.getResolver = getResolver
    store.helpers.deleteResolver = deleteResolver
    store.dispatch = (action: any) => dispatch(action)
  })

  const channels = useMemo(() => {
    const store = props.getStore()
    return ids.map((id) => (
      <Channel
        id={id}
        key={id}
        getHook={store.helpers.getHook}
        getResolver={store.helpers.getResolver}
      />
    ))
  }, [ids, props.getStore])

  return <>{channels}</>
}

export default React.memo(Channels)
