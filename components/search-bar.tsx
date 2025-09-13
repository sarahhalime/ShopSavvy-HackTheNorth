"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Sparkles } from "lucide-react"

interface SearchBarProps {
  onSearch: (query: string) => void
  initialValue?: string
  examples?: string[]
}

export function SearchBar({ onSearch, initialValue = "", examples = [] }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const [showExamples, setShowExamples] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setShowExamples(false)
    }
  }

  const handleExampleClick = (example: string) => {
    setQuery(example)
    onSearch(example)
    setShowExamples(false)
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for anything... (e.g., waterproof laptop backpack under $80)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowExamples(true)}
            className="pl-10 pr-24 h-12 text-base"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              <Sparkles className="w-3 h-3" />
              <span>AI</span>
            </div>
            <Button type="submit" size="sm">
              Search
            </Button>
          </div>
        </div>
      </form>

      {/* Examples Dropdown */}
      {showExamples && examples.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowExamples(false)} />
          <Card className="absolute top-full mt-2 w-full z-20 shadow-lg">
            <CardContent className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Try these examples:</div>
              {examples.map((example, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(example)}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-muted rounded transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Search className="w-3 h-3 text-muted-foreground" />
                    <span>{example}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
