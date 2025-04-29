"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "wouter"
import { useToast } from "@/hooks/use-toast"


interface Program {
  _id: string
  name: string
  description: string
  estimatedDuration: number
  price: number
  offering: {
    _id: string
    name: string
  }
  modules?: any[]
}

export default function SprintPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPrograms = async () => {
      setIsLoading(true)
      try {
        // Fetch programs using the updated endpoint that accepts offering name
        const response = await fetch("/api/programs/public/offering-type/Sprint")

        if (!response.ok) {
          throw new Error("Failed to fetch Sprint programs")
        }

        const data = await response.json()
        setPrograms(data.programs || [])
      } catch (error) {
        console.error("Error fetching programs:", error)
        toast({
          title: "Error",
          description: "Failed to load Sprint programs. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrograms()
  }, [toast])

  function formatDuration(days: number): string {
    if (days < 7) {
      return `${days} days`
    } else if (days < 30) {
      const weeks = Math.round(days / 7)
      return `${weeks} ${weeks === 1 ? "week" : "weeks"}`
    } else if (days < 365) {
      const months = Math.round(days / 30)
      return `${months} ${months === 1 ? "month" : "months"}`
    } else {
      const years = Math.round((days / 365) * 10) / 10
      return `${years} ${years === 1 ? "year" : "years"}`
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-primary">STEM Masters</h1>
            <p className="text-muted-foreground mt-1">Excellence in STEM Education</p>
          </div>
          <Link href="/enroll">
            <Button variant="outline" size="sm">
              ← Back to offerings
            </Button>
          </Link>
        </div>
        <div className="mt-6">
          <h2 className="text-3xl font-bold">Sprint Programs</h2>
          <div className="h-1 w-20 bg-primary mt-2 rounded-full"></div>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-lg mb-4">
          Our Sprint programs are intensive, short-term courses designed for quick skill acquisition. Perfect for busy
          professionals who need specific knowledge fast.
        </p>
        <ul className="space-y-2 pl-5">
          <li className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-primary mr-3"></div>
            <span>Accelerated learning in just days or weeks</span>
          </li>
          <li className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-primary mr-3"></div>
            <span>Focused curriculum targeting specific skills</span>
          </li>
          <li className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-primary mr-3"></div>
            <span>Immediate application to real-world challenges</span>
          </li>
        </ul>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <p>Loading programs...</p>
        </div>
      ) : programs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <Card key={program._id} className="flex flex-col h-full">
              <CardHeader>
                <CardTitle>{program.name}</CardTitle>
                <CardDescription>{program.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mt-2">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Duration:</span>
                    <span>{formatDuration(program.estimatedDuration)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Price:</span>
                    <span>${program.price}</span>
                  </div>
                  {program.modules && (
                    <div className="flex justify-between">
                      <span className="font-medium">Modules:</span>
                      <span>{program.modules.length}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" >Enroll Now</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-muted p-8 rounded-lg text-center">
          <h3 className="text-xl font-medium mb-2">No Programs Available</h3>
          <p>
            There are currently no Sprint programs available. Please check back later or contact support for more
            information.
          </p>
        </div>
      )}
    </div>
  )
}
