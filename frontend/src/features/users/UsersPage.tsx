import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus, Shield } from 'lucide-react'
import { Button, Card, CardHeader, DataTable, Badge, EmptyState, type Column, Tabs, useTabs, Switch } from '@/components/ui'
import { PageHeader } from '@/components/layout/AppShell'
import { useAuthStore, can } from '@/stores/auth'

interface RoleDefinition {
  code: string
  name: string
  description: string
  capabilities: string[]
}

const ROLES: RoleDefinition[] = [
  { code: 'ADMIN', name: 'Administrator', description: 'Full platform control — users, settings, audit and every workflow.', capabilities: ['Everything'] },
  { code: 'OFFICER', name: 'Revenue Officer', description: 'Uploads documents, reviews and edits records, submits verification.', capabilities: ['Upload', 'Edit records', 'Review', 'Submit verification', 'Export'] },
  { code: 'VERIFIER', name: 'Verifier', description: 'Reviews AI extraction, approves or rejects, corrects extracted fields.', capabilities: ['Review AI extraction', 'Approve / reject', 'Correct fields'] },
  { code: 'VIEWER', name: 'Viewer', description: 'Read-only access to dashboards, records and audit trail.', capabilities: ['Read-only access'] },
]

const DEMO_USERS = [
  { id: 'u-1001', name: 'K. Murugan', username: 'officer.kumar', role: 'OFFICER', active: true, lastActive: '10m ago' },
  { id: 'u-1002', name: 'V. Selvi', username: 'verifier.selvi', role: 'VERIFIER', active: true, lastActive: '2h ago' },
  { id: 'u-1003', name: 'S. Pandian', username: 'officer.pandian', role: 'OFFICER', active: true, lastActive: 'Yesterday' },
  { id: 'u-1004', name: 'R. Rajeshwari', username: 'admin.rajeshwari', role: 'ADMIN', active: true, lastActive: '3d ago' },
  { id: 'u-1005', name: 'A. Kannan', username: 'viewer.kannan', role: 'VIEWER', active: false, lastActive: '1w ago' },
]

export default function UsersPage() {
  const { t } = useTranslation()
  const current = useAuthStore((s) => s.user)
  const isAdmin = can(current, 'users')
  const { active, setActive } = useTabs('list')

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('users.title')}
        subtitle="Role management and access control. Backend independently enforces every permission."
        actions={
          isAdmin ? (
            <Button leftIcon={<UserPlus className="h-4 w-4" aria-hidden />} disabled>
              Invite user
            </Button>
          ) : null
        }
      />

      <Tabs
        tabs={[
          { key: 'list', label: `Users (${DEMO_USERS.length})` },
          { key: 'roles', label: 'Role definitions' },
        ]}
        active={active}
        onChange={setActive}
      />

      {active === 'list' ? (
        isAdmin ? (
          <UserTable />
        ) : (
          <Card bare className="ring-line">
            <EmptyState
              icon={<Shield className="h-5 w-5" />}
              title="Restricted"
              description="Only administrators can view and manage user accounts."
            />
          </Card>
        )
      ) : (
        <RoleDefinitions />
      )}
    </div>
  )
}

function UserTable() {
  const [page, setPage] = useState(1)
  const columns: Column<(typeof DEMO_USERS)[number]>[] = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div>
          <p className="font-medium text-ink">{u.name}</p>
          <p className="text-[11px] text-ink-faint">@{u.username}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <Badge tone={u.role === 'ADMIN' ? 'accent' : u.role === 'OFFICER' ? 'info' : u.role === 'VERIFIER' ? 'warning' : 'neutral'} size="xs">
          {u.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <Badge tone={u.active ? 'success' : 'neutral'} size="xs" dot>
          {u.active ? 'Active' : 'Disabled'}
        </Badge>
      ),
    },
    { key: 'last', header: 'Last active', accessor: (u) => <span className="text-[12px] text-ink-muted">{u.lastActive}</span> },
  ]

  return (
    <Card bare padded={false} className="ring-line overflow-hidden">
      <DataTable
        columns={columns}
        data={DEMO_USERS}
        getRowId={(u) => u.id}
        emptyState={<EmptyState title="No users" />}
      />
    </Card>
  )
}

function RoleDefinitions() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {ROLES.map((role) => (
        <Card key={role.code} bare className="ring-line">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[14px] font-semibold text-ink">{role.name}</p>
              <p className="text-[12px] text-ink-faint">Role code: {role.code}</p>
            </div>
            <Badge tone="accent" size="xs">{role.code}</Badge>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">{role.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {role.capabilities.map((cap) => (
              <span key={cap} className="rounded-chip bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                {cap}
              </span>
            ))}
          </div>
          <div className="mt-4 border-t border-line pt-3">
            <Switch
              checked={role.code !== 'VIEWER'}
              onChange={() => {}}
              label="Role enabled"
              description="Backend enforces capabilities on every route."
            />
          </div>
        </Card>
      ))}
    </div>
  )
}