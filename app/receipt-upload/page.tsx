"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Upload, Camera, CheckCircle, AlertTriangle, FileText, DollarSign, Calendar, Store } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DashboardTopbar } from "@/components/dashboard-topbar"

interface ReconciliationResult {
  success: boolean
  confidence: number
  extractedData: {
    vendor: string
    total: number
    items: Array<{
      name: string
      price: number
      quantity: number
    }>
    date: string
  }
  discrepancies: string[]
  recommendations: string[]
}

export default function ReceiptUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [transactionSig, setTransactionSig] = useState("")
  const [expectedTotal, setExpectedTotal] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ReconciliationResult | null>(null)
  const [progress, setProgress] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith("image/")) {
        setSelectedFile(file)
        setResult(null)
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (PNG, JPG, etc.)",
          variant: "destructive",
        })
      }
    }
  }

  const processReceipt = async () => {
    if (!selectedFile || !transactionSig || !expectedTotal) {
      toast({
        title: "Missing Information",
        description: "Please provide receipt image, transaction signature, and expected total.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      // Simulate processing steps
      const steps = [
        { message: "Uploading receipt image...", progress: 20 },
        { message: "Extracting text with OCR...", progress: 40 },
        { message: "Parsing receipt data...", progress: 60 },
        { message: "Matching with blockchain transaction...", progress: 80 },
        { message: "Generating reconciliation report...", progress: 100 },
      ]

      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        setProgress(step.progress)
      }

      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(selectedFile)
      })

      const response = await fetch("/api/ai/receipt-reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptImage: base64.split(",")[1], // Remove data:image/... prefix
          transactionSig,
          expectedTotal: Math.round(Number.parseFloat(expectedTotal) * 100), // Convert to cents
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to process receipt")
      }

      const reconciliationResult = await response.json()
      setResult(reconciliationResult)

      toast({
        title: reconciliationResult.success ? "Receipt Processed Successfully" : "Processing Complete",
        description: `Confidence: ${(reconciliationResult.confidence * 100).toFixed(0)}%`,
      })
    } catch (error) {
      console.error("Receipt processing error:", error)
      toast({
        title: "Processing Failed",
        description: "Unable to process receipt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <DashboardTopbar active="profile" />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Upload Section */}
          <div className="space-y-6 h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Receipt
                </CardTitle>
                <CardDescription>Upload a photo of your receipt to verify your Solana Pay transaction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex flex-col h-full">
                <div className="space-y-2">
                  <Label htmlFor="receipt-upload">Receipt Image</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    {selectedFile ? (
                      <div className="space-y-2">
                        <FileText className="w-8 h-8 mx-auto text-green-600" />
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-sm">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                          Select File
                        </Button>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction-sig">Solana Transaction Signature</Label>
                  <Input
                    id="transaction-sig"
                    placeholder="5KJp7wM8..."
                    value={transactionSig}
                    onChange={(e) => setTransactionSig(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected-total">Expected Total ($)</Label>
                  <Input
                    id="expected-total"
                    type="number"
                    step="0.01"
                    placeholder="29.99"
                    value={expectedTotal}
                    onChange={(e) => setExpectedTotal(e.target.value)}
                  />
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Processing receipt...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}

                <div className="mt-6">
                  <Button
                    onClick={processReceipt}
                    disabled={!selectedFile || !transactionSig || !expectedTotal || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? "Processing..." : "Process Receipt"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {result ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      )}
                      Reconciliation Results
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2">
                        <span>Confidence: {(result.confidence * 100).toFixed(0)}%</span>
                        <Badge variant={result.success ? "default" : "secondary"}>
                          {result.success ? "Verified" : "Needs Review"}
                        </Badge>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Store className="w-3 h-3" />
                          Vendor
                        </div>
                        <p className="font-medium">{result.extractedData.vendor}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <DollarSign className="w-3 h-3" />
                          Total
                        </div>
                        <p className="font-medium">{formatPrice(result.extractedData.total)}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Date
                        </div>
                        <p className="font-medium">{result.extractedData.date}</p>
                      </div>
                    </div>

                    {result.extractedData.items.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Items</h4>
                        <div className="space-y-1">
                          {result.extractedData.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>
                                {item.name} (x{item.quantity})
                              </span>
                              <span>{formatPrice(item.price)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {result.discrepancies.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-600">
                        <AlertTriangle className="w-5 h-5" />
                        Discrepancies Found
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {result.discrepancies.map((discrepancy, idx) => (
                          <li key={idx} className="text-sm">
                            • {discrepancy}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {result.recommendations.map((recommendation, idx) => (
                        <li key={idx} className="text-sm">
                          • {recommendation}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Upload a receipt to see reconciliation results</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
