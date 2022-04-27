# React hooks in callback

> using hooks in callbacks will be helpful in some cases to filter out noisy hooks and in other cases to avoid defining useless and repetitive hooks in our components just to pass their values to those callbacks

so, This package will help us

- **to filter out unwanted hooks re-renders** (eg: react context related hooks, hooks with timeout or time interval, etc...).
- **to have a simplified version of async actions** (that will allow us to have a really nice alternative to the _redux-thunk_ approach)

[![NPM](https://img.shields.io/npm/v/react-hooks-in-callback.svg)](https://www.npmjs.com/package/react-hooks-in-callback)

## Install

```bash
npm i -S react-hooks-in-callback
```

## useHooksInCallback

```typescript
import { useHooksInCallback } from "react-hooks-in-callback";
import { useYourCustomHook } from "./my-custom-hooks";
... // here is the component body
const [HooksWrapper, getHookState, subscribeToHookState] = useHooksInCallback();
// HooksWrapper: is a React component where your hooks will be mounted.
// getHookState: an helper that let you get the hook state in an async way.
// subscribeToHookState: same as getHookState, but designed to work with useEffect
...
// you can either use getHookState or subscribeToHookState, depending on your case
...
return (
    <div>
        {/* useYourCustomHook will be mounted in HooksWrapper */}
        <HooksWrapper />
        <button onClick={async () => {
            // mount useYourCustomHook and wait for its state to be resolved.
            const hookState = await getHookState(useYourCustomHook);
            // after being resolved, useYourCustomHook is directly unmounted.
        }}/>
    </div>
)
```

### Formik example

Imagine to have a list of fields where each field component uses **useFormikContext**, just to set the field value on click event.
the scenario is the following one:

```typescript
const Field = (name: string) => {
    const formik = useFormikContext();
    ...
    return (
        <div>
            <button onClick={() => formik.setFieldValue(name, newFieldValue)}/>
        <div/>
    )
}
```

The issue here is the **re-render noise** introduced by the formik context. Everytime a field will be updated, all the other fields will re-render since they are using the same react context. This will lead to a bad performance.

Check the **formik with context's re-render noise** example [here](https://codesandbox.io/s/formik-normal-5vchh?file=/src/Field.js)

We can solve that issue if we can take the _useFormikContext_ out of the Field component and get its state only when there is a click event. This is what we are going to do by using **useHooksInCallback**.

```typescript
const Field = (name: string) => {
    const [HooksWrapper, getHookState] = useHooksInCallback();
    ...
    return (
        <div>
            <HooksWrapper /> {/* added! */}
            <button onClick={async () => {
              // formik context will be used only once in this callback
              const formik = await getHookState(useFormikContext);
              formik.setFieldValue(name, newFieldValue)
            }}/>
        <div/>
    )
}
```

Check the **formik with hooks-in-callback** example [here](https://codesandbox.io/s/formik-with-hooks-in-callback-jeo4i?file=/src/clean/Field.js)

## useActionUtils

A place where we usually use hooks states is in a _redux-thunk_ action.
the reason to use the **react-hooks-in-callback** approach instead is because it brings some benefits.

- **your action has only one callback layer**: not a curry function like in redux-thunk approach
- **hooks based params are not defined anymore in the component but directly in the action callback**: just think if we have a login action and we need to change it in a way to push _/login_ on start and _/home_ on success, we need to have _history_ as parameter and define _const history = useHistory()_ in **every** component where our _login_ action will be used.
- **filtering unwanted re-renders as we saw previously**

### usage

first of all, we need to create utilities for our async actions

```ts
import { createActionsPackage } from 'react-hooks-in-callback'

export const actionsPkg = createActionsPackage()
// actionsPkg: { HooksWrapper, getHookState, subscribeToHookState }
// HooksWrapper => Component to be mounted at the top level, directly under all used hooks contexts providers
// getHookState => get your hook state in an async way in your action
// subscribeToHookState => subscribe to hooks state changes (probably you don't need it for your actions)
```

then we need to mount the HooksWrapper to process our hooks states

```ts
import { actionsPkg } from './configs'

const { HooksWrapper } = actionsPkg

const MyRootComponent = (props) => {
  return (
    <Provider store={store}>
      <Router>
        {/*
          HooksWrapper is where action utils hooks will be mounted
          so it should be under the providers tree and before the components where the actions will be called.
        */}
        <HooksWrapper />
        {props.children}
      </Router>
    </Provider>
  )
}
```

now we can define a custom hook for our actions

```ts
export const useActionUtils = () => {
  const { dispatch, getState } = useStore()
  const history = useHistory()
  return { dispatch, getState, history }
}
```

and use it like follows

```ts
import { actionsPkg, api } from './configs'
import { useActionUtils } from './hooks'

const { getHookState } = actionsPkg

const login = async (userId: string) => {
  // here we will mount useActionUtils in the HooksWrapper component and wait for its state to be resolved.
  const { dispatch, history, getState } = await getHookState(useActionUtils)

  try {
    history.push('/login')
    dispatch({ type: 'LoginStart' })
    const { data: token } = await api.login(userId)
    const { data: users } = await api.getUsers(token)
    dispatch({ type: 'LoginSuccess', payload: users })
    history.push('/home')
    // just to check if everything is fine, you can log your redux state here
    // const storeState = getState();
    // console.log(storeState)
  } catch (error) {
    dispatch({ type: 'LoginError', payload: error })
  }
}
```

As we can notice in our action, the only one parameter is _userId_. every other parameters related to hooks are defined directly in **useActionUtils** and every change depending on it will be done only in it and won't affect our components.

if it was a redux-thunk action, the synthax would be more complex, we can see the difference bellow.

```typescript
// redux-thunk action synthax
const login = (userId: string, history: History) => {
  //  hooks values/states should be passed as action params like we passed history in this example
  return async (dispatch, getState, config: Config) => {
    // your logic goes here
  }
}
// react-hooks-in-callback action synthax
const login = async (userId: string) => {
  // hooks values/states are defined directly in the action body
  // your logic goes here
}
```

the last step now is to use everything in a component

```typescript
import { login } from './actions'

const App = () => {
  useEffect(() => {
    login('admin') // don't need to dispatch or to pass history
  }, [])

  return <div>...</div>
}
```

just to compare both approaches, if we used a _redux-thunk_ way instead, we had to define _dispatch_ and _history_ in our components to dispatch the login action and pass history as parameter

```typescript
import { login } from './actions'

const App = () => {
  // if we used a redux-thunk action we should need dispatch and history in our component like bellow
  const dispatch = useDispatch() // +++++
  const history = useHistory() // +++++

  useEffect(() => {
    dispatch(
      // we need to dispatch an action passing also history
      login('admin', history)
    )
  }, [dispatch])

  return <div>...</div>
}
```

You can find the redux sandbox example [here](https://codesandbox.io/s/redux-with-hooks-in-callback-bzzjb?file=/src/actions.js)

Try it out!

# Advanced

## Waiting for a specific state before resolving the getHookState

sometimes your expected hook state is not the first provided one and you should wait for a specific state before resolving the **getHookState** value.

For example this following hooks returns the total number of divs in the DOM, but initially returns _undefined_.

```typescript
const useDivCount = () => {.
  const [state, setState] = useState<number>();
  useEffect(() => {
    const divs = document.querySelectorAll("div");
    setState(divs?.length || 0);
  }, []);
  return state; // undefined | number
};
```

So in this case what we want to do is to skip the undefined value and wait for the number value. to do so, we just need to implement it by adding a _suspender_ as a second argument to the _getHookState_

```typescript
const hookState = await getHookState(useDivCount, (state, utils) => {
  if (state !== undefined) {
    utils.resolve() // this will resolve the current state
    return
  }
  if (utils.isBeforeUnmount) {
    // this should not happen normally, but if it happens and
    // you did not resolve the getHookState and some how you are unmounting the component
    // you should do something to not keep this promise in pending state
    // utils.resolve or use utils.reject
  }
})
```

you can also subscribe to state changes in useEffect using _subscribeToHookState_

```typescript
const [HooksWrapper, , subscribeToHookState] = useHooksInCallback()
useEffect(() => {
  const subscription = subscribeToHookState(useDivCount, (
    error,
    data /*{ state: S; isBeforeUnmount: boolean }*/
  ) => {
    if (error) {
      // console.error(error.message);
      return
    }
    // subscription logic goes here
    const { state, isBeforeUnmount } = data
  })
  return subscription.unsubscribe
}, [])
```

Find an advanced example [here](https://codesandbox.io/s/waiting-for-a-specific-state-ilqtv?file=/src/UserPass.js)

## see also

- [react-requests-manager](https://www.npmjs.com/package/react-requests-manager)

# License

MIT © [https://github.com/fernandoem88/react-hooks-in-callback](https://github.com/fernandoem88/react-hooks-in-callback)
