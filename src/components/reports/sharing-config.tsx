'use client';

import { Button } from '@/components/ui';

interface SharingConfigProps {
  onSave: () => void;
}

const reportOptions = [
  { id: 'weekly', label: 'Weekly Progress', schedule: 'Auto-send every Friday', icon: '📊' },
  { id: 'topics', label: 'Topics Progress', schedule: 'After each session', icon: '🎯' },
  { id: 'monthly', label: 'Monthly Summary', schedule: 'End of each month', icon: '📅' },
];

const recipients = [
  { name: 'Sarah Johnson', role: 'Operations Director', icon: '👩‍💼' },
  { name: 'Michael Torres', role: 'HR Manager', icon: '👨‍💼' },
];

export function SharingConfig({ onSave }: SharingConfigProps) {
  return (
    <div
      className="bg-white rounded-lg p-8 mb-8"
      style={{ border: '1px solid var(--border)' }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        📤 Share with Leadership
      </h3>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Configure automatic sharing of reports with team leaders and managers.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Report Types */}
        <div
          className="rounded-lg p-6"
          style={{ background: 'var(--neutral-pale)', border: '1px solid var(--border)' }}
        >
          <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Team Leaders/Managers
          </h4>
          <div className="space-y-3">
            {reportOptions.map((option) => (
              <label
                key={option.id}
                className="flex gap-3 p-3 bg-white rounded-lg cursor-pointer transition-all hover:shadow-sm"
                style={{ border: '1px solid var(--border)' }}
              >
                <input
                  type="checkbox"
                  className="w-5 h-5 cursor-pointer"
                  style={{ accentColor: 'var(--primary)' }}
                />
                <div className="text-sm">
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {option.icon} {option.label}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {option.schedule}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Recipients */}
        <div
          className="rounded-lg p-6"
          style={{ background: 'var(--neutral-pale)', border: '1px solid var(--border)' }}
        >
          <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Recipients
          </h4>
          <div className="space-y-3">
            {recipients.map((recipient) => (
              <div
                key={recipient.name}
                className="p-3 bg-white rounded-lg text-sm"
                style={{ border: '1px solid var(--border)' }}
              >
                <span className="text-xl mr-2">{recipient.icon}</span>
                {recipient.name}
                <br />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {recipient.role}
                </span>
              </div>
            ))}
            <Button variant="secondary" size="sm" fullWidth className="mt-2">
              ➕ Add Recipients
            </Button>
          </div>
        </div>
      </div>

      <Button fullWidth onClick={onSave}>
        💾 Save Sharing Settings
      </Button>
    </div>
  );
}
