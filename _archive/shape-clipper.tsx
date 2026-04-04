"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Download, RefreshCcw, ZoomIn, ZoomOut, Move, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileUploadZone } from "@/components/file-upload-zone"
import { Slider } from "@/components/ui/slider"
import { SvgGallery } from "@/components/svg-gallery"

export function ShapeClipper() {
  const [svgFile, setSvgFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [svgContent, setSvgContent] = useState<string>("")
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [scale, setScale] = useState<number>(100)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // サンプルSVGを選択
  const handleSampleSelect = useCallback((sample: { id: string; name: string; svg: string }) => {
    setSelectedSampleId(sample.id)
    setSvgContent(sample.svg)
    setSvgFile(null)
    setShowFileUpload(false)
  }, [])

  // SVGファイルを読み込み
  useEffect(() => {
    if (svgFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setSvgContent(content)
        setSelectedSampleId(null)
      }
      reader.readAsText(svgFile)
    }
  }, [svgFile])

  // 画像ファイルを読み込み
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [imageFile])

  // SVGからパスを抽出
  const extractSvgPath = useCallback((svgString: string): string => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, "image/svg+xml")
    const paths = doc.querySelectorAll("path")
    const polygons = doc.querySelectorAll("polygon")
    
    let allPaths = ""
    
    paths.forEach((path) => {
      const d = path.getAttribute("d")
      if (d) allPaths += d + " "
    })
    
    polygons.forEach((polygon) => {
      const points = polygon.getAttribute("points")
      if (points) {
        const coords = points.trim().split(/[\s,]+/)
        if (coords.length >= 2) {
          let pathD = `M ${coords[0]} ${coords[1]} `
          for (let i = 2; i < coords.length; i += 2) {
            pathD += `L ${coords[i]} ${coords[i + 1]} `
          }
          pathD += "Z "
          allPaths += pathD
        }
      }
    })
    
    return allPaths
  }, [])

  // SVGのviewBoxを取得
  const getSvgDimensions = useCallback((svgString: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, "image/svg+xml")
    const svg = doc.querySelector("svg")
    
    if (svg) {
      const viewBox = svg.getAttribute("viewBox")
      if (viewBox) {
        const [, , w, h] = viewBox.split(/[\s,]+/).map(Number)
        return { width: w, height: h }
      }
      const width = parseFloat(svg.getAttribute("width") || "100")
      const height = parseFloat(svg.getAttribute("height") || "100")
      return { width, height }
    }
    return { width: 100, height: 100 }
  }, [])

  // ドラッグ操作
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }, [position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 画像をダウンロード
  const handleDownload = useCallback(() => {
    if (!svgContent || !imageUrl || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dimensions = getSvgDimensions(svgContent)
    const outputSize = 1024
    const scaleFactor = Math.min(outputSize / dimensions.width, outputSize / dimensions.height)
    
    canvas.width = dimensions.width * scaleFactor
    canvas.height = dimensions.height * scaleFactor

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // クリッピングパスを作成
      const pathData = extractSvgPath(svgContent)
      const path = new Path2D(pathData)
      
      ctx.save()
      ctx.scale(scaleFactor, scaleFactor)
      ctx.clip(path)
      
      // 画像を描画（スケールと位置を適用）
      const imgScale = (scale / 100)
      const imgWidth = dimensions.width * imgScale
      const imgHeight = (img.height / img.width) * imgWidth
      
      const offsetX = (dimensions.width - imgWidth) / 2 + position.x
      const offsetY = (dimensions.height - imgHeight) / 2 + position.y
      
      ctx.drawImage(img, offsetX, offsetY, imgWidth, imgHeight)
      ctx.restore()
      
      // ダウンロード
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `clipped-${Date.now()}.png`
          a.click()
          URL.revokeObjectURL(url)
        }
      }, "image/png")
    }
    img.src = imageUrl
  }, [svgContent, imageUrl, scale, position, extractSvgPath, getSvgDimensions])

  // リセット
  const handleReset = useCallback(() => {
    setSvgFile(null)
    setImageFile(null)
    setSvgContent("")
    setImageUrl("")
    setScale(100)
    setPosition({ x: 0, y: 0 })
    setSelectedSampleId(null)
    setShowFileUpload(false)
  }, [])

  const dimensions = svgContent ? getSvgDimensions(svgContent) : { width: 300, height: 300 }
  const previewScale = Math.min(300 / dimensions.width, 300 / dimensions.height)

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* ステップ1: SVGを選択 */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold uppercase tracking-wide text-foreground">
          ステップ 1: 形状を選択
        </h2>
        <p className="text-muted-foreground">
          サンプルから選択するか、自分のSVGファイルをアップロードしてください
        </p>
        
        <SvgGallery selectedId={selectedSampleId} onSelect={handleSampleSelect} />
        
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">または</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        
        {showFileUpload ? (
          <FileUploadZone
            accept=".svg"
            onFileSelect={setSvgFile}
            label="SVGファイルをドロップ"
            description="またはクリックして選択"
            file={svgFile}
          />
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowFileUpload(true)}
            className="w-full border-dashed border-2 py-6"
          >
            <Upload className="mr-2 h-4 w-4" />
            自分のSVGファイルをアップロード
          </Button>
        )}
      </section>

      {/* ステップ2: 画像をアップロード */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold uppercase tracking-wide text-foreground">
          ステップ 2: 画像ファイルをアップロード
        </h2>
        <p className="text-muted-foreground">
          切り抜きたい画像をアップロードしてください
        </p>
        <FileUploadZone
          accept="image/*"
          onFileSelect={setImageFile}
          label="画像ファイルをドロップ"
          description="またはクリックして選択"
          file={imageFile}
        />
      </section>

      {/* ステップ3: プレビューと調整 */}
      {svgContent && imageUrl && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold uppercase tracking-wide text-foreground">
            ステップ 3: 位置とサイズを調整
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* プレビュー */}
            <div className="flex flex-col items-center gap-4">
              <div
                ref={previewRef}
                className="relative cursor-move overflow-hidden rounded border-2 border-border bg-[repeating-conic-gradient(#80808020_0%_25%,transparent_0%_50%)] bg-[length:20px_20px]"
                style={{
                  width: dimensions.width * previewScale,
                  height: dimensions.height * previewScale,
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <svg
                  width={dimensions.width * previewScale}
                  height={dimensions.height * previewScale}
                  viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                  className="absolute inset-0"
                >
                  <defs>
                    <clipPath id="shape-clip">
                      <path d={extractSvgPath(svgContent)} />
                    </clipPath>
                  </defs>
                  <g clipPath="url(#shape-clip)">
                    <image
                      href={imageUrl}
                      x={(dimensions.width - dimensions.width * scale / 100) / 2 + position.x}
                      y={(dimensions.height - dimensions.width * scale / 100) / 2 + position.y}
                      width={dimensions.width * scale / 100}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </g>
                  <path
                    d={extractSvgPath(svgContent)}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-border"
                  />
                </svg>
              </div>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Move className="h-4 w-4" />
                ドラッグして画像の位置を調整
              </p>
            </div>

            {/* コントロール */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-semibold text-foreground">
                    <ZoomIn className="h-4 w-4" />
                    スケール
                  </label>
                  <span className="text-sm text-muted-foreground">{scale}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <ZoomOut className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[scale]}
                    onValueChange={([value]) => setScale(value)}
                    min={50}
                    max={200}
                    step={1}
                    className="flex-1"
                  />
                  <ZoomIn className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleDownload}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="mr-2 h-4 w-4" />
                  PNGでダウンロード
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-muted"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  リセット
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 非表示のキャンバス（ダウンロード用） */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
