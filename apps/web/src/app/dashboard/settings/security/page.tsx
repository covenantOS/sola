import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { ArrowLeft, ExternalLink, Shield, Key, Smartphone } from "lucide-react"
import Link from "next/link"

export default async function SecuritySettingsPage() {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return null
  }

  const logtoEndpoint = process.env.LOGTO_ENDPOINT || ""

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/settings"
          className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white/60" />
        </Link>
        <div>
          <h1 className="font-display text-2xl text-white uppercase tracking-wide">
            Security Settings
          </h1>
          <p className="text-white/60 mt-1">
            Manage your account security and authentication.
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-sola-gold/10 border border-sola-gold/30 p-6">
        <div className="flex items-start gap-4">
          <Shield className="h-6 w-6 text-sola-gold flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-white uppercase tracking-wide mb-2">
              Managed by Logto
            </h2>
            <p className="text-white/70 text-sm">
              Your account security is managed through Logto, our secure authentication provider.
              You can update your password, enable two-factor authentication, and manage connected
              accounts directly in your Logto profile.
            </p>
          </div>
        </div>
      </div>

      {/* Security Options */}
      <div className="space-y-4">
        {/* Password */}
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
                <Key className="h-5 w-5 text-white/60" />
              </div>
              <div>
                <h3 className="font-display text-white uppercase tracking-wide">
                  Password
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  Change your account password
                </p>
              </div>
            </div>
            <a
              href={`${logtoEndpoint}/account`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sola-gold hover:text-sola-gold/80 transition-colors text-sm"
            >
              Manage
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-white/60" />
              </div>
              <div>
                <h3 className="font-display text-white uppercase tracking-wide">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  Add an extra layer of security with 2FA
                </p>
              </div>
            </div>
            <a
              href={`${logtoEndpoint}/account`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sola-gold hover:text-sola-gold/80 transition-colors text-sm"
            >
              Manage
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white/60" />
              </div>
              <div>
                <h3 className="font-display text-white uppercase tracking-wide">
                  Active Sessions
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  View and manage your active login sessions
                </p>
              </div>
            </div>
            <a
              href={`${logtoEndpoint}/account`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sola-gold hover:text-sola-gold/80 transition-colors text-sm"
            >
              Manage
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Account Management Link */}
      <div className="pt-4 border-t border-white/10">
        <a
          href={`${logtoEndpoint}/account`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
        >
          Open Account Settings
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
