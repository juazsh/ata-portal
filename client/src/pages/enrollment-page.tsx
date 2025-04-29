"use client"

import { useState, useEffect } from "react"
import { Link } from "wouter"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { StemMastersHero } from "@/components/stem-masters-hero"
import smstudentImg from "@/assets/images/stem-master-logo.jpeg";
import smclassroomImg from "@/assets/images/stem-masters-classrom.jpeg";
import smcodingImg from "@/assets/images/stem-masters-coding.jpeg";

interface Offering {
  _id: string
  name: string
  description: string
  description2: string
  estimatedDuration: number
}

export default function EnrollmentPage() {
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchOfferings = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/offerings/public")
        if (!response.ok) {
          throw new Error("Failed to fetch offerings")
        }
        const data = await response.json()
        setOfferings(data)
      } catch (error) {
        console.error("Error fetching offerings:", error)
        toast({
          title: "Error",
          description: "Failed to load offerings. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOfferings()
  }, [toast])

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-primary">STEM Masters</h1>
          <p className="text-muted-foreground mt-1">Excellence in STEM Education</p>
        </div>
        <div className="mt-6">
          <h2 className="text-3xl font-bold">Choose Your Learning Path</h2>
          <div className="h-1 w-20 bg-primary mt-2 rounded-full"></div>
          <p className="text-lg mt-4">Select the program type that best fits your learning goals and schedule.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <p>Loading offerings...</p>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {offerings.map((offering) => {
            // Determine the route based on the name
            const route = offering.name.toLowerCase().includes("marathon")
              ? "/marathon"
              : offering.name.toLowerCase().includes("sprint")
                ? "/sprint"
                : `/offering/${offering._id}`

            // Determine the image based on the offering name
            const imagePath = offering.name.toLowerCase().includes("marathon")
              ? smclassroomImg
              : smcodingImg

            return (
              <Card key={offering._id} className="flex flex-col h-full overflow-hidden">
                <div className="relative h-48 w-full">
                  <img
                    src={imagePath || "/placeholder.svg"}
                    alt={offering.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{offering.name}</CardTitle>
                  <CardDescription>{offering.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p>{offering.description2}</p>
                </CardContent>
                <CardFooter>
                  <Link href={route}>
                    <Button className="w-full">Explore {offering.name} Programs</Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
