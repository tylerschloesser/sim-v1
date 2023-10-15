import { useRouteError } from 'react-router-dom'

export function ErrorPage() {
  const error = useRouteError()
  return (
    <>
      <h1>ERROR 🔥🔥🔥</h1>
      <pre>{JSON.stringify(error, null, 2)}</pre>
    </>
  )
}
