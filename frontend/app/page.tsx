import Link from 'next/link';

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">چت آنلاین</h1>
      <p className="text-gray-300 mb-6">یک اتاق نمونه:</p>
      <Link href="/room/general" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white rounded px-4 py-2">
        ورود به اتاق General
      </Link>
    </main>
  );
}


