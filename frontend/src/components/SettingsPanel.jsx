import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, X, Shield } from 'lucide-react'

const ALL_SERVICES = [
  { id: 'zomato', label: 'Zomato', emoji: '🍕' },
  { id: 'swiggy', label: 'Swiggy', emoji: '🧡' },
  { id: 'blinkit', label: 'Blinkit', emoji: '⚡' },
  { id: 'zepto', label: 'Zepto', emoji: '🟣' },
  { id: 'flights', label: 'Flights', emoji: '✈️' },
  { id: 'utilities', label: 'Utilities', emoji: '💡' },
  { id: 'calendar', label: 'Calendar', emoji: '📅' },
]

export function SettingsPanel({ onClose }) {
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings/default_user')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(console.error)
  }, [])

  const handleToggleService = (serviceId) => {
    setSettings(prev => {
      const current = prev.enabled_services || []
      const updated = current.includes(serviceId)
        ? current.filter(s => s !== serviceId)
        : [...current, serviceId]
      return { ...prev, enabled_services: updated }
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await fetch('/api/settings/default_user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_spend_per_action: parseFloat(settings.max_spend_per_action),
          require_confirmation_above: parseFloat(settings.require_confirmation_above),
          enabled_services: settings.enabled_services,
          name: settings.name,
          phone: settings.phone,
          preferred_payment: settings.preferred_payment,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('Failed to save settings', e)
    } finally {
      setSaving(false)
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-400" />
          <h2 className="font-semibold text-white">Trust & Settings</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Profile */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Profile</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Your name</label>
              <input
                type="text"
                value={settings.name || ''}
                onChange={e => setSettings(s => ({ ...s, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Phone number</label>
              <input
                type="tel"
                value={settings.phone || ''}
                onChange={e => setSettings(s => ({ ...s, phone: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>
        </section>

        {/* Spending limits */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Spending Limits</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Ask confirmation above <span className="text-white">₹{settings.require_confirmation_above}</span>
              </label>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={settings.require_confirmation_above}
                onChange={e => setSettings(s => ({ ...s, require_confirmation_above: e.target.value }))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>₹0</span><span>₹5,000</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Max spend per action <span className="text-white">₹{settings.max_spend_per_action}</span>
              </label>
              <input
                type="range"
                min={500}
                max={50000}
                step={500}
                value={settings.max_spend_per_action}
                onChange={e => setSettings(s => ({ ...s, max_spend_per_action: e.target.value }))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>₹500</span><span>₹50,000</span>
              </div>
            </div>
          </div>
        </section>

        {/* Enabled services */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Enabled Services</h3>
          <div className="grid grid-cols-2 gap-2">
            {ALL_SERVICES.map(svc => {
              const enabled = (settings.enabled_services || []).includes(svc.id)
              return (
                <button
                  key={svc.id}
                  onClick={() => handleToggleService(svc.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
                    ${enabled
                      ? 'bg-brand-700/50 border border-brand-600/60 text-white'
                      : 'bg-white/5 border border-white/10 text-gray-500'
                    }
                  `}
                >
                  <span>{svc.emoji}</span>
                  <span>{svc.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Payment */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Default Payment</h3>
          <div className="flex gap-2">
            {['UPI', 'Card', 'Net Banking'].map(method => (
              <button
                key={method}
                onClick={() => setSettings(s => ({ ...s, preferred_payment: method }))}
                className={`
                  flex-1 py-2 rounded-xl text-sm font-medium transition-all
                  ${settings.preferred_payment === method
                    ? 'bg-brand-700/50 border border-brand-600/60 text-white'
                    : 'bg-white/5 border border-white/10 text-gray-500'
                  }
                `}
              >
                {method}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Save button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </motion.div>
  )
}
