"use client"

import { useState, useEffect } from "react"
import { Link } from "wouter"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import logoImage from "@/assets/images/new_logo.png";
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
    <div className="min-h-screen bg-gray-100">
      {/* Header Navigation */}
      <header className="bg-white py-4 px-6 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img
              src={logoImage}
              alt="STEM Masters Logo"
              className="h-10 object-contain mr-6"
            />
          </div>

          <div className="flex space-x-3">
            <Link href="/auth?login=true">
              <Button className="rounded-full bg-green-500 hover:bg-green-600 text-white font-medium">Login</Button>
            </Link>
          </div>
        </div>
      </header>
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-2">Choose Your Learning Path</h2>
          <div className="h-1 w-20 bg-green-500 rounded-full mb-6"></div>
          <p className="text-lg mb-10 text-gray-700">
            Select the program type that best fits your learning goals and schedule.
          </p>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <p>Loading offerings...</p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {offerings.map((offering) => {
                const route = offering.name.toLowerCase().includes("marathon")
                  ? "/marathon"
                  : offering.name.toLowerCase().includes("sprint")
                    ? "/sprint"
                    : `/offering/${offering._id}`

                const imagePath = offering.name.toLowerCase().includes("marathon")
                  ? smclassroomImg
                  : smcodingImg

                return (
                  <Card key={offering._id} className="overflow-hidden rounded-2xl border-0 shadow-lg transition-all hover:shadow-xl">
                    <div className="relative h-56 w-full">
                      <img
                        src={imagePath || "/placeholder.svg"}
                        alt={offering.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold">{offering.name}</CardTitle>
                      <CardDescription className="text-base">{offering.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-gray-700">
                      <p>{offering.description2}</p>
                    </CardContent>
                    <CardFooter>
                      <Link href={route}>
                        <Button className="w-full rounded-full bg-green-500 hover:bg-green-600 text-white">
                          Explore {offering.name} Programs
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex space-x-20 mb-8">
                <div>
                  <h3 className="text-5xl font-bold mb-2">99k+</h3>
                  <p className="text-gray-600">Satisfied students</p>
                </div>
                <div>
                  <h3 className="text-5xl font-bold mb-2">10k+</h3>
                  <p className="text-gray-600">Learning resources</p>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden h-64">
                <img
                  src={smcodingImg}
                  alt="STEM Masters Classroom"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold mb-6">We have 99+ online courses to try this year</h2>
              <p className="text-lg text-gray-700 mb-8">
                Our comprehensive curriculum covers everything from beginner to advanced levels across
                various STEM disciplines. Join thousands of students on their educational journey.
              </p>
              <div className="flex space-x-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}