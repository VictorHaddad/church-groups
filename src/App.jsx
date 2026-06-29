import AdminApp from './AdminApp'
import PublicRanking from './components/PublicRanking'

const basePath = import.meta.env.BASE_URL
const path = window.location.pathname.slice(basePath.length).replace(/\/$/, '')
const isAdmin = path === 'admin'

export default function App() {
  return isAdmin ? <AdminApp /> : <PublicRanking />
}
