# React hooks in callback

> When it comes to deal with action or event callback, often we use to define a hook in a component and then we pass its state as parameter to the callback.

this package will help us:

- to filter out unwanted hooks re-renders.
- to define a hook and get its state directly in a callback (usefull for actions)
- to have a simplified version of async actions (a really nice alternative to _redux-thunk_).

## Usage

```typescript
import { useHooksInCallback } from "react-hooks-in-callback";
import { useMyCustomHook } from "./my-custom-hooks";
... // here is the component body
const [HooksWrapper, getHookState, subscribeToHookState] = useHooksInCallback();
// HooksWrapper: is a React component where your hooks will be mounted.
// getHookState: an helper that let you get the hook state in an async way.
// subscribeToHookState: same as getHookState, but designed to work with useEffect
...
return (
    <div>
        {/* useMyCustomHook will be mounted in HooksWrapper */}
        <HooksWrapper />
        <button onClick={async () => {
            // mount useMyCustomHook and wait for its state to be resolved.
            const hookState = await getHookState(useMyCustomHook);
            // after being resolved, useMyCustomHook is directly unmounted.
        }}/>
    </div>
)
```

## dispatch action on click event

```typescript
import React from 'react'
import { createStore } from 'redux'
import { useDispatch, Provider } from 'react-redux'
import { useHooksInCallback } from 'react-hooks-in-callback'

// creating a store with a dumb reducer
const store = createStore((state: any = {}) => state)
const TestComponent = () => {
  const [HooksWrapper, getHookState] = useHooksInCallback()
  return (
    <Provider store={store}>
      {/* HooksWrapper is where useDispatch will be mounted */}
      <HooksWrapper />
      <div>
        <button
          onClick={async () => {
            // useDispatch is beeing used directly in a callback.
            // maybe it doesn't make sense right now but we will see a nice example
            // where we'll use completly this approach instead of redux-thunk
            const dispatch = await getHookState(useDispatch)
            dispatch({ type: 'test' })
          }}
        >
          click to dispatch
        </button>
      </div>
    </Provider>
  )
}
```

## Filtering context re-render noise: Formik example

Imagine to have a list of fields where each field component uses formik context just to set the field value on click event.
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

The issue here is the re-render noise introduced by the formik context. everytime a field will be updated, all the other fields will re-render since they are using the same context. this will lead to a bad performance.

Check the **formik with context's re-render noise** example [here](https://codesandbox.io/s/formik-normal-5vchh?file=/src/Field.js)

We can solve that issue if we can take the formik context out of the Field component and get its state only when there is a click event. This is what we are going to do by using useHooksInCallback.

```typescript
const Field = (name: string) => {
    // const formik = useFormikContext(); // removed!
    const [HooksWrapper, getHookState] = useHooksInCallback(); // added!
    ...
    return (
        <div>
            <HooksWrapper /> {/* added! */}
            <button onClick={async () => {
              // formik context will be used only once in this callback
              const formik = await getHookState(useFormikContext); // added!
              formik.setFieldValue(name, newFieldValue)
            }}/>
        <div/>
    )
}
```

Check the **formik with hooks-in-callback** example [here](https://codesandbox.io/s/formik-with-hooks-in-callback-jeo4i?file=/src/Field.js)

## createCleanContext

this helper creates a context and returns an object with this following signature

```tsx
type CleanContext<T> = {
  Provider: Context.Provider<T>
  Consummer: Context.Consummer<T>
  useCleanContext: <R>(selector: (ctx: T) => R) => R
}
```

The Provider and the Consummer behave the same way as in the standard react context.
The most important part here is the _useCleanContext_ hook, where
we define the React.useContext but in a way to avoid rerenders.
To do so, we subscribes to React.useContext state in useEffect (_in the advanced section, it's explanned how to subscribe to hook state_) instead of using it in the hook body.
In this way, we can select only desired states from each update to update our hook value.

we will use these variables the same way we use them with React.context

```tsx
import React, { useState } from 'react'
import { createCleanContext } from 'react-hooks-in-callback'

// let's define our context initial value
const initialValue = {
  num: 0, // we will increment num on click events
  title: 'test' // tis value instead won't change
}
// we will use the Provider to dispatch new context value and useCleanContext
// to select the desired part of the context we want to use
const { Provider, Consummer, useCleanContext } = createCleanContext(
  initialValue
)

// this is a component which value, title, never changes
// so the expected behaviour is to render only once
const Title = () => {
  console.log('title rerender')
  const title = useCleanContext((ctx) => ctx.title)
  return <div>{title}</div>
}

// this component instead will rerender at each click event
const Num = () => {
  console.log('num rerender')
  const num = useCleanContext((ctx) => ctx.num)
  return <div>{num}</div>
}

// let's then use our Title and Num components here in the App component
// wrapping them by the context Provider
const App = (props) => {
  const [ctx, setCtx] = useState(initialValue)
  return (
    <Provider value={ctx}>
      <button
        onClick={() => {
          setCtx({ ...ctx, num: ctx.num + 1 })
        }}
      >
        increment num
      </button>
      <Title />
      <Num />
    </Provider>
  )
}
```

you can replace the same example with the normal React.creacteContext and React.useContext to see how the Title component will bahave

## use createActionUtils instead of redux-thunk

A place where we usually use hooks states is in a **redux-thunk** action.
the reason to use the **react-hooks-in-callback** approach instead is because it brings a few benefits.

- **your action has only one callback layer** (const myAction = async () => {} : **not a curry function like in redux-thunk action**)
- **hooks based params are not defined anymore in the component**: just think if you have a login action and you need to change it in a way to push _/login_ on start and _/home_ on success, you need to have _history_ as parameter and define const history = useHistory() to every component where your _login_ action will be used.
- **filtering re-render noise as we saw earlier**.

let's see some concret example.

First, let's define some configs and utilities in our **configs.ts**

```typescript
import Axios from "axios";
import { useStore } from "react-redux";
import { useHistory } from "react-router";
// createActionUtils is the main point in this file
import { createActionUtils } from "react-hooks-in-callback";

const ROOT_URL = "app";
const api = {
    login: (user: string) => Axios.get(`${ROOT_URL}/login?${user}`),
    ...
}
const configs = {
    api,
    token: undefined as undefined | string
}

// this hook is a custom hook, so you can add whatever you want.
export const useActionUtils = () => {
    const { getState, dispatch } = useStore();
    const history = useHistory();
    return { history, getState, dispatch };
}

// this is similar to applyMiddleware(thunk.withExtraArgument(configs))
export const utils = createActionUtils(configs);
// Utils: { getHookState, getConfig, setConfig, useConfig, HooksWrapper }
```

Then we can define our **actions.ts** file and use our configs like this:

```typescript
import { utils, useActionUtils } from './configs'

const { getHookState, getConfig, setConfig } = utils

const login = async (user: string) => {
  const { getState, dispatch, history } = await getHookState(useActionUtils)
  try {
    history.push('/login')
    const configs = getConfig()
    const { data: token } = await configs.api.login(user)
    // setConfig to modify the config value and dispatch the new state to the useConfig hook
    setConfig((cfg) => {
      // cfg is our custom config: what we defined in configs.ts
      cfg.token = token // we can access the cfg value by using useConfig in the component,
    })
    history.push('/home')
    const { data: users } = await configs.api.getUsers(token)
    dispatch({ type: 'usersFetchSuccess', payload: users })
    // just to check if everything is fine, you can log your redux state here
    // const storeState = getState();
    // console.log(storeState)
  } catch (error) {
    dispatch({ type: 'usersFetchError', payload: error })
  }
}
```

As we can notice in our action, the only one parameter is _user_. every other parameters related to hooks are defined directly in **useActionUtils** and every change depending on it will be done only in it and won't affect our components.

if it was a redux-thunk action, the synthax would be more complex, we can see the difference bellow.

```typescript
// redux-thunk action synthax
const login = (user: string, history: History) => {
  //  hooks values/states should be passed as action params like we passed history in this example
  return async (dispatch, getState, config: Config) => {
    // action logic goes here
  }
}
// react-hooks-in-callback action synthax
const login = async (user: string) => {
  //  hooks values/states and config are defined directly in the action body
  // action logic goes here
}
```

So after defining our actions, the last step now is to use the **HooksWrapper** component where our **useActionUtils** hook will be mounted.

Let's then define our **index.tsx** file.

```typescript
import { createStore } from 'redux'
import { Provider, useSelector } from 'react-redux'
import { utils } from './configs'
import { login } from './actions'

const store = createStore((state: { users: string[] }, action) => {
  // just listening to usersFetchSuccess action
  return action.type === 'usersFetchSuccess' ? action.payload : state
})

const { useConfig, HooksWrapper } = utils

const App = () => {
  // if we used a redux-thunk action we should need dispatch and history in our component like bellow
  // const dispatch = useDispatch();
  // const history = useHistory();
  useEffect(() => {
    // using react-hooks-in-callback action!
    login('admin') // => react-hooks-in-callback

    // instead if we used redux-thunk action;
    // we should dispatch this action and pass history as parameter
    // and also we should add dispatch as dependency of our useEffect
    // dispatch(login("admin", history)); // => redux-thunk
  }, [])
  // we can use useConfig in our component to get the token value.
  const token = useConfig((config) => config.token)
  const users = useSelector((state) => state.users)
  if (!token) return <div>user not logged in</div>

  return (
    <div>
      <h2>users list</h2>
      <ul>
        {users.map((user) => (
          <li key={user}>{user}</li>
        ))}
      </ul>
    </div>
  )
}

export const Root = () => {
  return (
    <Provider store={store}>
      ...
      <Router>
        {/*
          HooksWrapper is where useStore, useHistory, useParams,... will be mounted
          so it should be under the providers tree (in our case under redux and router Providers).
          it also should be mounted before the App component where the actions will be called.
        */}
        <HooksWrapper />
        <App />
      </Router>
    </Provider>
  )
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

So in this case what we want to do is to skip the undefined value and wait for the number value.

```typescript
const hookState = await getHookState(
  useDivCount,
  (state, utils) => {
    if (state !== undefined) {
      utils.resolve(state)
      return
    }
    if (utils.isBeforeUnmount) {
      // this should not happen normally, but if it happens and
      // you did not resolve the getHookState and some how you are unmounting the component
      // you should do something to not keep this promise in pending state
      // resolve your state or
      // use utils.reject or throw some error
    }
  },
  'useDivCount' // (optional) This parameter is just for debugging purpose,so you can check which hook is still mounted in react dev tools in your browser
)
```

you can also subscribe to state changes in useEffect using _subscribeToHookState_

```typescript
const [HooksWrapper, , subscribeToHookState] = useHooksInCallback()
useEffect(() => {
  const subscription = subscribeToHookState(
    useDivCount,
    (state, isBeforeUnmount) => {
      // subscription logic goes here
    },
    'useDivCountSubscription'
  )
  return subscription.unsubscribe
}, [])
```

Find an advanced example [here](https://codesandbox.io/s/waiting-for-a-specific-state-ilqtv?file=/src/UserPass.js)

## Github

[react-hooks-in-callback](https://github.com/fernandoem88/react-hooks-in-callback)

## see also

- [react-redux-selector-utils](https://www.npmjs.com/package/react-redux-selector-utils): a package that will help you to define and use in a **clean**, **easy** and **fast** way your redux selectors
