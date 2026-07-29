import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, FolderOpen, Loader2, Trash2, Upload } from 'lucide-react'
import { api, apiUnreachableMessage } from '../lib/api'
import { formatDate } from '../lib/format'
import { Alert, ConfirmDialog, EmptyState, PageTitle, Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const humanSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function Media() {
  const { can } = useAuth()
  const writable = can('media.write')

  const [assets, setAssets] = useState([])
  const [folders, setFolders] = useState([])
  const [folder, setFolder] = useState('')
  const [uploadFolder, setUploadFolder] = useState('general')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [assetList, folderList] = await Promise.all([api.media(folder), api.mediaFolders()])
      setAssets(assetList)
      setFolders(folderList)
    } catch (err) {
      setError(err.status === undefined ? apiUnreachableMessage() : err.message)
    } finally {
      setLoading(false)
    }
  }, [folder])

  useEffect(() => {
    load()
  }, [load])

  const upload = async (files) => {
    if (!files?.length) return

    setUploading(true)
    setError('')

    try {
      const saved = await api.uploadMedia(Array.from(files), uploadFolder)
      setNotice(`Uploaded ${saved.length} file${saved.length === 1 ? '' : 's'}.`)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      setNotice(`Copied ${url}`)
    } catch {
      // Clipboard is blocked outside a secure context — show the URL so it can be copied by hand.
      setError(`Copy failed. The URL is ${url}`)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.deleteMedia(deleting.id)
      setDeleting(null)
      await load()
    } catch (err) {
      setError(err.message)
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageTitle title="Media" subtitle="Uploaded images and video, organised into folders" />

      <Alert onDismiss={() => setError('')}>{error}</Alert>
      <Alert tone="good" onDismiss={() => setNotice('')}>
        {notice}
      </Alert>

      {writable && (
        <div
          className="card mb-5 p-5"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            upload(event.dataTransfer.files)
          }}
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px]">
              <label htmlFor="upload-folder" className="field-label">
                Upload into folder
              </label>
              <input
                id="upload-folder"
                className="field"
                value={uploadFolder}
                onChange={(event) => setUploadFolder(event.target.value)}
                placeholder="general"
              />
            </div>

            <button
              type="button"
              className="btn-primary"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading…' : 'Choose files'}
            </button>

            <p className="pb-2.5 text-[12px] text-text-secondary">
              …or drag files onto this panel. JPG, PNG, WebP, AVIF, GIF, MP4 and WebM up to 25 MB.
            </p>
          </div>

          <input
            ref={fileInput}
            type="file"
            multiple
            accept="image/*,video/mp4,video/webm"
            className="hidden"
            onChange={(event) => upload(event.target.files)}
          />
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFolder('')}
          className={`rounded-lg px-4 py-2 text-[13px] transition-colors ${
            folder === '' ? 'bg-brand/12 font-medium text-brand-ink' : 'text-text-secondary hover:bg-background-warm'
          }`}
        >
          All
        </button>
        {folders.map((entry) => (
          <button
            key={entry.folder}
            type="button"
            onClick={() => setFolder(entry.folder)}
            className={`rounded-lg px-4 py-2 text-[13px] transition-colors ${
              folder === entry.folder ? 'bg-brand/12 font-medium text-brand-ink' : 'text-text-secondary hover:bg-background-warm'
            }`}
          >
            {entry.folder}
            <span className="ml-2 text-text-secondary">{entry.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading media" />
      ) : assets.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FolderOpen}
            title="Nothing here yet"
            message={
              writable
                ? 'Upload images to use them in room galleries, hero slides and amenity cards.'
                : 'No files have been uploaded to this folder.'
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((asset) => (
            <figure key={asset.id} className="card overflow-hidden">
              {asset.contentType?.startsWith('video/') ? (
                <video src={asset.url} className="h-40 w-full bg-background object-cover" controls preload="metadata" />
              ) : (
                <img src={asset.url} alt={asset.altText} className="h-40 w-full bg-background object-cover" loading="lazy" />
              )}

              <figcaption className="p-4">
                <p className="truncate text-[13px] text-text-primary" title={asset.fileName}>
                  {asset.fileName}
                </p>
                <p className="mt-0.5 text-[11px] text-text-secondary">
                  {humanSize(asset.sizeBytes)} · {asset.folder} · {formatDate(asset.createdAt)}
                </p>

                <div className="mt-3 flex gap-2">
                  <button type="button" className="btn-secondary btn-sm flex-1" onClick={() => copyUrl(asset.url)}>
                    <Copy className="h-3.5 w-3.5" />
                    Copy URL
                  </button>
                  {writable && (
                    <button
                      type="button"
                      aria-label={`Delete ${asset.fileName}`}
                      className="btn-danger btn-sm"
                      onClick={() => setDeleting(asset)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.fileName}?`}
        message="The file is removed from disk. Anything still referencing its URL will show a broken image."
        onConfirm={remove}
        onClose={() => setDeleting(null)}
        busy={busy}
      />
    </>
  )
}
