import React from 'react'
import Channel from './Channel'

import { Store, Resolver, Action } from 'app-types' // eslint-disable-line

interface Props {
  getStore: () => Store
  children?: undefined
  dispatch: (action: Action) => void
  ids: string[]
}

const Channels: React.FC<Props> = (props) => {
  const resolversRef = React.useRef<{ [id: string]: Resolver }>({})

  const { ids, dispatch, getStore } = props

  React.useState(() => {
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

  const channels = React.useMemo(() => {
    const store = getStore()
    return ids.map((id) => (
      <Channel
        key={id}
        hook={store.helpers.getHook(id)}
        resolver={store.helpers.getResolver(id)}
      />
    ))
  }, [ids, getStore])

  return <React.Fragment>{channels}</React.Fragment>
}

export default React.memo(Channels)
