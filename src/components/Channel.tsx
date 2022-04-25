import React from 'react'
import { Resolver } from 'app-types'

const Channel: React.FC<{
  id: string
  getHook: (id: string) => () => any
  getResolver: (id: string) => Resolver
}> = (props) => {
  const { getHook, getResolver } = props
  const [useHookState] = React.useState(() => {
    return getHook(props.id)
  })
  const hookState = useHookState()

  React.useEffect(() => {
    const resolver = getResolver(props.id)
    resolver(hookState)
  }, [props.id, getResolver, hookState])

  const hookStateRef = React.useRef(hookState)
  hookStateRef.current = hookState

  React.useEffect(() => {
    return () => {
      const resolver = getResolver(props.id)
      resolver(hookStateRef.current, true)
    }
  }, [props.id, getResolver])
  return null
}

export default React.memo(Channel)
