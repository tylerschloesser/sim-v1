import { App } from './app.js'
import './index.scss'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import invariant from 'tiny-invariant'

const container = document.getElementById('root')
invariant(container)

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <>TODO handle errors</>,
  },
])

createRoot(container).render(<RouterProvider router={router} />)
