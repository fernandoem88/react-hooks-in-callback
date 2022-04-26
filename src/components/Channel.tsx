import { useEffect, useRef, FC, memo } from 'react'
import { Resolver } from 'app-types'

const Channel: FC<{
  hook: () => any
  resolver: Resolver
}> = (props) => {
  const { hook: useHookState, resolver } = props

  const hookState = useHookState()

  useEffect(() => {
    resolver(hookState)
  }, [resolver, hookState])

  const hookStateRef = useRef(hookState)
  hookStateRef.current = hookState

  useEffect(() => {
    return () => {
      resolver(hookStateRef.current, true)
    }
  }, [resolver])
  return null
}

export default memo(Channel)
