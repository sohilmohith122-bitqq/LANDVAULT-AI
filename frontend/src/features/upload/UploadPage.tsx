import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { UploadCloud, FileText, Image as ImageIcon, X, Camera, CheckCircle2, Loader2, Info } from 'lucide-react'
import { Card, CardHeader, Button, Progress, Badge, Input, toast } from '@/components/ui'
import { PageHeader } from '@/components/layout/AppShell'
import { TN_DISTRICTS, DOCUMENT_TYPE_OPTIONS } from '@/lib/reference/geo'
import { documentsApi } from '@/lib/api'
import { getApiErrorMessage } from '@/components/QueryFeedback'
import { can, useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import type { DocumentType, LanguageCode } from '@/types'

const MAX_MB = 25
const ACCEPTED = { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }

interface UpItem { id: string; name: string; size: number; progress: number; status: 'uploading' | 'done' | 'error'; message?: string }

export default function UploadPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<UpItem[]>([])
  const [docType, setDocType] = useState<DocumentType>('PATTA')
  const [langTa, setLangTa] = useState(true)
  const [langEn, setLangEn] = useState(true)
  const [district, setDistrict] = useState<string>(TN_DISTRICTS[0])
  const [village, setVillage] = useState('')

  const languages = [langTa ? 'ta' : null, langEn ? 'en' : null].filter(Boolean) as LanguageCode[]

  /* Real upload — files POST to the backend, which hands them to the OCR/extraction pipeline
     (Bhashini-powered Tamil+English OCR runs server-side). Progress reflects the actual HTTP transfer. */
  const uploadOne = (item: UpItem, file: File) => {
    documentsApi
      .upload(file, { documentType: docType, district, village: village || undefined, languages }, (pct) =>
        setItems((p) => p.map((x) => (x.id === item.id ? { ...x, progress: pct } : x))),
      )
      .then((doc) => {
        setItems((p) => p.map((x) => (x.id === item.id ? { ...x, status: 'done', progress: 100, message: doc.referenceNo } : x)))
        toast.success('Upload complete', `${file.name} queued for OCR and extraction (${doc.referenceNo}).`)
      })
      .catch((err: unknown) => {
        setItems((p) => p.map((x) => (x.id === item.id ? { ...x, status: 'error', message: getApiErrorMessage(err) } : x)))
        toast.danger('Upload failed', `${file.name} — ${getApiErrorMessage(err)}`)
      })
  }

  const addFiles = (files: File[]) => {
    const valid: File[] = []
    for (const f of files) {
      if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) {
        toast.danger('Unsupported file type', `${f.name} — only PDF, JPG, JPEG and PNG are accepted.`)
        continue
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.danger('File too large', `${f.name} exceeds the ${MAX_MB} MB limit.`)
        continue
      }
      valid.push(f)
    }
    if (!valid.length) return
    const next = valid.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, size: f.size, progress: 0, status: 'uploading' as const }))
    setItems((p) => [...p, ...next])
    next.forEach((item, i) => uploadOne(item, valid[i]))
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: addFiles, accept: ACCEPTED, multiple: true, noClick: true, maxSize: MAX_MB * 1024 * 1024,
  })

  const uploading = items.some((it) => it.status === 'uploading')
  const allDone = items.length > 0 && items.every((it) => it.status === 'done')

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('nav.upload')}
        subtitle="Originals are preserved exactly as received — AI output never overwrites the source document."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* Dropzone + queue */}
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              'flex flex-col items-center justify-center rounded-panel border-2 border-dashed px-6 py-12 text-center transition-colors',
              isDragActive ? 'border-accent bg-accent-soft/50' : 'border-line-strong bg-surface hover:border-accent/60',
            )}
          >
            <input {...getInputProps()} />
            <span className="flex h-12 w-12 items-center justify-center rounded-panel bg-accent-soft text-accent">
              <UploadCloud className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <p className="mt-4 text-[15px] font-semibold text-ink">Drag &amp; drop land records here</p>
            <p className="mt-1 text-[12.5px] text-ink-muted">PDF, JPG, JPEG or PNG · up to {MAX_MB} MB each · Tamil and English documents</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Button type="button" onClick={open}>Browse files</Button>
              <Button type="button" variant="outline" onClick={() => cameraRef.current?.click()}>
                <Camera className="h-4 w-4" aria-hidden /> Camera capture
              </Button>
            </div>
            <input
              ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { const fs = Array.from(e.target.files ?? []); if (fs.length) addFiles(fs); e.target.value = '' }}
            />
          </div>

          {items.length ? (
            <Card bare padded={false} className="ring-line overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h3 className="text-[13.5px] font-semibold text-ink">Upload queue</h3>
                <Badge tone={uploading ? 'accent' : items.some((i) => i.status === 'error') ? 'danger' : 'success'} size="xs" dot>
                  {uploading ? 'Uploading' : items.some((i) => i.status === 'error') ? 'With errors' : 'Uploaded'}
                </Badge>
              </div>
              <ul className="divide-y divide-line">
                {items.map((it) => (
                  <li key={it.id} className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-panel bg-surface-muted text-ink-muted">
                        {/\.pdf$/i.test(it.name) ? <FileText className="h-4.5 w-4.5" /> : <ImageIcon className="h-4.5 w-4.5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{it.name}</p>
                        <p className="numeric text-[11px] text-ink-faint">{(it.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      {it.status === 'done' ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-label="Uploaded" />
                      ) : it.status === 'error' ? (
                        <X className="h-5 w-5 shrink-0 text-danger" aria-label="Failed" />
                      ) : (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" aria-label="Uploading" />
                      )}
                      <button
                        onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))}
                        className="rounded p-1 text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
                        aria-label={`Remove ${it.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <Progress value={it.progress} className="mt-3" />
                    {it.message ? (
                      <p className={cn('mt-1 text-[11px]', it.status === 'error' ? 'text-danger' : 'text-ink-faint')}>
                        {it.status === 'error' ? it.message : `Reference: ${it.message} — queued for OCR + extraction`}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <div className="flex items-start gap-2.5 rounded-panel border border-info/20 bg-info-bg px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
            <p className="text-[12px] leading-relaxed text-ink-muted">
              Upload progress reflects the real HTTP transfer. Once received, the backend runs Tamil + English OCR (Bhashini models), field extraction and validation — job status appears on the Documents page.
            </p>
          </div>
        </div>

        {/* Metadata */}
        <Card bare className="ring-line h-fit">
          <CardHeader title="Document metadata" subtitle="Applied to every file in this upload batch" />
          <div className="space-y-4">
            <label className="block">
              <span className="label mb-1.5 block">{t('documents.type')}</span>
              <select value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)} className="h-9.5 w-full rounded-field border border-line-strong bg-surface px-3 text-[13px] text-ink outline-none focus:border-accent">
                {DOCUMENT_TYPE_OPTIONS.map((d) => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
              </select>
            </label>
            <fieldset>
              <legend className="label mb-1.5">{t('documents.language')}</legend>
              <div className="flex gap-2">
                {[{ k: 'ta', label: 'தமிழ் Tamil', v: langTa, set: setLangTa }, { k: 'en', label: 'English', v: langEn, set: setLangEn }].map((l) => (
                  <button
                    key={l.k} type="button" onClick={() => l.set(!l.v)} aria-pressed={l.v}
                    className={cn('h-9 rounded-field border px-3 text-[12.5px] font-medium transition-colors', l.v ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong bg-surface text-ink-muted')}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              {!languages.length ? <p className="mt-1.5 text-[11px] text-warning">Select at least one language</p> : null}
            </fieldset>
            <label className="block">
              <span className="label mb-1.5 block">{t('records.district')}</span>
              <select value={district} onChange={(e) => setDistrict(e.target.value)} className="h-9.5 w-full rounded-field border border-line-strong bg-surface px-3 text-[13px] text-ink outline-none focus:border-accent">
                {TN_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label mb-1.5 block">Village (optional)</span>
              <Input value={village} onChange={(e) => setVillage(e.target.value)} placeholder="e.g. Melur South" />
            </label>
            <div className="rounded-panel bg-surface-muted/60 p-3">
              <p className="text-[11.5px] leading-relaxed text-ink-muted">
                Uploaded by <span className="font-semibold text-ink">{user?.fullName ?? '—'}</span> ({user?.role ?? '—'}) · location and language metadata improve extraction accuracy but every value stays verifiable in the workspace.
              </p>
            </div>
            <Button fullWidth disabled={!items.length || uploading} onClick={() => navigate('/documents')}>
              {uploading ? 'Uploading…' : 'Go to Documents'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
