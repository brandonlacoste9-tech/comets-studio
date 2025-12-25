'use client';

import { Check, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500/30">
      <div className="container mx-auto px-4 py-24">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
            Studio-Grade AI. <br/> Without the Monthly Subscription.
          </h1>
          <p className="text-xl text-slate-400">
            Pay only for what you create. Keep your credits forever.
            <br /> <span className="text-purple-400">Join the community to earn free tokens.</span>
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Free Tier */}
          <div className="relative p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-2">Community Starter</h3>
            <div className="text-4xl font-bold mb-4">$0 <span className="text-lg font-normal text-slate-400">/ forever</span></div>
            <p className="text-slate-400 mb-6">Perfect for hobbyists and students.</p>
            <ul className="space-y-3 mb-8 text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> 1,000 Tokens / day</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> Standard AI Models</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> Public Community Profile</li>
            </ul>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Get Started</Link>
            </Button>
          </div>

          {/* Pay-per-Project (The Winner) */}
          <div className="relative p-8 rounded-2xl border border-purple-500/50 bg-gradient-to-b from-purple-900/20 to-slate-900/40 shadow-2xl transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">Best Value</div>
            <h3 className="text-xl font-semibold text-white mb-2">Studio Credits</h3>
            <div className="text-4xl font-bold mb-4">$10 <span className="text-lg font-normal text-slate-400">/ 500k Tokens</span></div>
            <p className="text-slate-400 mb-6">No expiration. Use whenever you need.</p>
            <ul className="space-y-3 mb-8 text-slate-300">
              <li className="flex items-center gap-2"><Zap className="w-5 h-5 text-purple-400" /> <span className="font-semibold text-white">Advanced Artiste Mode</span></li>
              <li className="flex items-center gap-2"><Zap className="w-5 h-5 text-purple-400" /> Max Speed & Priority</li>
              <li className="flex items-center gap-2"><Zap className="w-5 h-5 text-purple-400" /> Private Projects</li>
              <li className="flex items-center gap-2"><Zap className="w-5 h-5 text-purple-400" /> 1-Click Deployment</li>
            </ul>
            <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
              <Link href="#">Buy Credits</Link>
            </Button>
          </div>

          {/* Subscription (The Reference) */}
          <div className="relative p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm opacity-70 hover:opacity-100 transition-opacity">
            <h3 className="text-xl font-semibold text-white mb-2">Comet Pro</h3>
            <div className="text-4xl font-bold mb-4">$25 <span className="text-lg font-normal text-slate-400">/ month</span></div>
            <p className="text-slate-400 mb-6">For heavy power users.</p>
            <ul className="space-y-3 mb-8 text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> Unlimited Artiste Mode</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> 10M Tokens / month</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-400" /> Priority Support</li>
            </ul>
             <Button asChild variant="ghost" className="w-full border border-white/10">
              <Link href="#">Subscribe</Link>
            </Button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Comet vs. The Others?</h2>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-white/5 text-white uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Feature</th>
                  <th className="px-6 py-4 text-purple-400">Comet Studio</th>
                  <th className="px-6 py-4">Bolt.new</th>
                  <th className="px-6 py-4">v0.dev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">Live App Preview</td>
                  <td className="px-6 py-4 text-green-400"><Check className="inline w-4 h-4 mr-1"/> Yes (Sandpack)</td>
                  <td className="px-6 py-4">Yes</td>
                  <td className="px-6 py-4">Yes</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-white">Pricing Model</td>
                  <td className="px-6 py-4 text-purple-400 font-bold">Pay-as-you-go ($10)</td>
                  <td className="px-6 py-4">$20/mo Subscription</td>
                  <td className="px-6 py-4">$20/mo Subscription</td>
                </tr>
                <tr className="bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">Credit Expiration</td>
                  <td className="px-6 py-4 text-green-400"><Check className="inline w-4 h-4 mr-1"/> Never</td>
                  <td className="px-6 py-4 text-red-400">Monthly</td>
                  <td className="px-6 py-4 text-red-400">Monthly</td>
                </tr>
                 <tr>
                  <td className="px-6 py-4 font-medium text-white">Artiste Mode (Aesthetics)</td>
                  <td className="px-6 py-4 text-green-400"><Check className="inline w-4 h-4 mr-1"/> Built-in</td>
                  <td className="px-6 py-4">Manual Prompting</td>
                  <td className="px-6 py-4">Manual Prompting</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
