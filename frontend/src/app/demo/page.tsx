'use client';

import { LanguageDemo } from '@/components/LanguageDemo';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🌍 Language Switching Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test the multi-language functionality of cPiggyFX
          </p>
        </div>

        {/* Language Demo Component */}
        <LanguageDemo />

        {/* Additional Info */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            🚀 Features Implemented
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-600 mb-2">✅ Automatic Detection</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• IP geolocation detection</li>
                <li>• Browser language preference</li>
                <li>• Country-based language mapping</li>
                <li>• Fallback to English</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">✅ User Control</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Manual language switching</li>
                <li>• Persistent user preferences</li>
                <li>• Real-time language updates</li>
                <li>• Smooth transitions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            🔧 Technical Implementation
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p><strong>Hook:</strong> <code>useLanguageDetection</code> - Detects language from IP, browser, and user preferences</p>
            <p><strong>Context:</strong> <code>LanguageContext</code> - Manages language state across the app</p>
            <p><strong>Component:</strong> <code>LanguageSwitcher</code> - UI for manual language selection</p>
            <p><strong>Translation:</strong> <code>t()</code> function - Retrieves text based on current language</p>
            <p><strong>Storage:</strong> localStorage - Persists user language choice</p>
          </div>
        </div>
      </div>
    </div>
  );
}

