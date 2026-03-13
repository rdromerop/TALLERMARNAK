import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 text-white font-bold text-xl">
            M
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Panel Marnak</h1>
          <p className="text-slate-500 text-sm mt-1">Inicia sesión en tu cuenta</p>
        </div>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-slate-900 bg-white"
              placeholder="admin@marnak.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-slate-900 bg-white"
              placeholder="••••••••"
            />
          </div>
          <div className="pt-2 flex gap-4">
            <button formAction={login} className="flex-1 bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              Ingresar
            </button>
            <button formAction={signup} className="flex-1 bg-slate-100 text-slate-700 font-medium py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors">
              Registrarse
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
