import React, { useState } from 'react';
import {
  Download,
  Code2,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  Copy,
  Check,
  FileCode,
  IndianRupee,
} from 'lucide-react';
import { ANDROID_PROJECT_FILES, downloadAndroidStudioZip } from '../android/androidProjectFiles';
import firebaseConfig from '../../firebase-applet-config.json';

export function AndroidStudioHub({ darkMode }: { darkMode: boolean }) {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const activeFile = ANDROID_PROJECT_FILES[selectedFileIndex] || ANDROID_PROJECT_FILES[0];

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      await downloadAndroidStudioZip();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & 1-Click ZIP Download Banner */}
      <div
        className={`rounded-2xl p-6 border flex flex-wrap items-center justify-between gap-6 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
            Native Kotlin · Jetpack Compose · Material 3 · MVVM Architecture
          </p>
          <h2 className="text-xl font-bold">
            Complete Android Studio Project &amp; APK Build Guide (<code className="text-base font-mono">in.manaexperts.app</code>)
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Pre-wired to your provisioned Firebase Spark project (<code className="font-mono">{firebaseConfig.projectId}</code>) and Firestore database
            (<code className="font-mono">{firebaseConfig.firestoreDatabaseId}</code>). Download the ZIP to open directly in Android Studio, compile the
            APK on your laptop, and install it on your physical Android phone at ₹0 cost.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={isDownloading}
          className="min-h-[46px] px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? 'Packaging ZIP...' : 'Download Android Studio Project (.zip)'}
        </button>
      </div>

      {/* Interactive Native Android Source File Browser */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div
          className={`lg:col-span-4 rounded-2xl border overflow-hidden ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-teal-600" />
              Android Project Files ({ANDROID_PROJECT_FILES.length})
            </span>
            <span className="text-[11px] font-mono text-slate-400">Kotlin / XML / Gradle</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
            {ANDROID_PROJECT_FILES.map((file, idx) => (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedFileIndex(idx)}
                className={`w-full text-left px-4 py-3 text-xs transition-colors flex flex-col gap-0.5 ${
                  selectedFileIndex === idx
                    ? 'bg-teal-600/10 text-teal-700 dark:text-teal-300 font-semibold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="font-mono break-all">{file.path}</span>
                <span className="text-[11px] text-slate-500 font-normal line-clamp-1">{file.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          className={`lg:col-span-8 rounded-2xl border overflow-hidden ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-mono font-bold">{activeFile.path}</p>
              <p className="text-[11px] text-slate-500">{activeFile.description}</p>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy File'}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed bg-slate-950 text-slate-100">
            <code>{activeFile.content}</code>
          </pre>
        </div>
      </div>

      {/* Phase 1-4 Engineering Report & ₹800 Budget Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className={`rounded-2xl p-5 border space-y-3 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-teal-600" />
            Install APK on Your Android Phone (₹0)
          </h3>
          <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
            <li>Click <strong>Download Android Studio Project (.zip)</strong> above and extract it.</li>
            <li>Open the folder in <strong>Android Studio Ladybug (2024.2+)</strong> (100% free tool).</li>
            <li>
              Enable <strong>Developer Options &rarr; USB Debugging</strong> on your Android phone and connect via USB,
              or choose <strong>Build &rarr; Build Bundle(s) / APK(s) &rarr; Build APK(s)</strong>.
            </li>
            <li>
              Share the generated <code>app-debug.apk</code> via WhatsApp or USB with your initial Bapatla customers
              and technicians for real device field testing.
            </li>
          </ol>
        </div>

        <div
          className={`rounded-2xl p-5 border space-y-3 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h3 className="text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Security Architecture & Limitations
          </h3>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <li>
              <strong>First Admin Provisioning:</strong> Your owner email (<code>sumanth.bandela11@gmail.com</code>) is
              bootstrapped in <code>firestore.rules</code> via <code>isAdmin()</code> and can authorize additional
              admins in <code>/admins/&#123;uid&#125;</code>.
            </li>
            <li>
              <strong>PII Split Protection:</strong> Customer phone &amp; full street address are isolated in{' '}
              <code>/bookings/&#123;id&#125;/private/details</code> and locked until a technician accepts.
            </li>
            <li>
              <strong>Atomic Coin &amp; Booking Guard:</strong> Uses Firestore <code>runTransaction</code> + rule{' '}
              <code>getAfter()</code> so simultaneous accept attempts deduct 1 coin from the winner and 0 from the
              second technician.
            </li>
          </ul>
        </div>

        <div
          className={`rounded-2xl p-5 border space-y-3 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h3 className="text-sm font-bold flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-orange-500" />
            ₹800 Budget & Free-Tier Compliance
          </h3>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <li>
              <strong>Firebase Spark Plan (₹0):</strong> Includes Google Sign-In, 50,000 Firestore reads/day, 20,000
              writes/day, and 1 GiB storage at zero cost.
            </li>
            <li>
              <strong>Zero Paid SMS / OTP (₹0):</strong> Phone numbers are collected and labeled as unverified without
              paid SMS gateways.
            </li>
            <li>
              <strong>Play Store Note:</strong> Google Play Console charges a one-time $25 (~₹2,100) fee for public
              Store listing. Until your Bapatla marketplace revenue grows beyond ₹800, distribute the signed APK
              directly to Bapatla users at ₹0 cost.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
