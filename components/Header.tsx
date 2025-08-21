import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white border-b-8 border-black" style={{
      backgroundImage: `
        linear-gradient(0deg, transparent 24%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05) 76%, transparent 77%, transparent),
        linear-gradient(90deg, transparent 24%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05) 76%, transparent 77%, transparent)
      `,
      backgroundSize: '50px 50px'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-16 md:h-20 py-4">
          {/* Centered Logo */}
          <div className="text-center">
            <Link href="/" className="text-xl sm:text-2xl md:text-4xl font-black text-black leading-tight" style={{ fontFamily: 'Times, serif' }}>
              TRADING INTELLIGENCE HUB
            </Link>
            <p className="text-xs md:text-sm text-gray-700 font-bold mt-1">
              CRYPTOCURRENCY • REGULATORY • MARKET ANALYSIS
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
