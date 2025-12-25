import { useRef } from 'react'
import { useStore } from '../store/useStore'
import { Download, Upload } from 'lucide-react'

export function DataSync() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { exportData, importData } = useStore()

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `web3tracker-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const success = importData(content)
      if (success) {
        alert('导入成功！')
      } else {
        alert('导入失败，请检查文件格式')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="px-3 py-2.5 bg-[#1a1a24] border border-white/5 rounded-xl text-sm hover:bg-[#22222e] hover:border-white/10 flex items-center gap-2 text-gray-400 hover:text-white transition-all"
      >
        <Download className="w-4 h-4" />
        导出
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-3 py-2.5 bg-[#1a1a24] border border-white/5 rounded-xl text-sm hover:bg-[#22222e] hover:border-white/10 flex items-center gap-2 text-gray-400 hover:text-white transition-all"
      >
        <Upload className="w-4 h-4" />
        导入
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  )
}
