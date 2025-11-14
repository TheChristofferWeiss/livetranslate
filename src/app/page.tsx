import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          Next.js + Supabase + Vercel Starter
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          A production-ready starter template with authentication, database, and deployment configured.
        </p>

        {user ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">Welcome back!</h2>
            <p className="text-gray-700 mb-4">You are signed in as: {user.email}</p>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Go to Dashboard
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">Get Started</h2>
            <p className="text-gray-700 mb-4">Sign in to access your dashboard.</p>
            <div className="flex gap-4">
              <Link
                href="/auth/login"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>✅ Email/password authentication with Supabase</li>
            <li>✅ Role-based access control</li>
            <li>✅ Type-safe database queries</li>
            <li>✅ Server-side rendering with Next.js 14</li>
            <li>✅ Ready for Vercel deployment</li>
          </ul>
        </div>
      </div>
    </main>
  )
}

