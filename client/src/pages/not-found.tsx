"use client"

import { useLocation } from "wouter"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Beaker, Brain, Calculator, Lightbulb } from "lucide-react"
import mascot from "@/assets/images/mascot.png";

export default function NotFound() {
  const [_, setLocation] = useLocation()

  const goBack = () => {
    window.history.back()
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md shadow-lg border-2 border-blue-100">
        <div className="flex justify-center -mt-12">
          <div className="bg-white p-2 rounded-full shadow-md">
            <img
              src={mascot} alt="STEM Masters Logo"
              className="w-[80x] h-[80px] rounded-full"
            />
          </div>
        </div>

        <CardContent className="pt-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Experiment Not Found!</h2>

          <div className="flex justify-center mb-6 space-x-4">
            <Beaker className="h-8 w-8 text-purple-500 animate-bounce" />
            <Calculator className="h-8 w-8 text-blue-500 animate-bounce delay-100" />
            <Brain className="h-8 w-8 text-green-500 animate-bounce delay-200" />
            <Lightbulb className="h-8 w-8 text-yellow-500 animate-bounce delay-300" />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-4 text-left">
            <p className="text-gray-700 font-medium mb-2">
              Oops! Looks like this page has gone quantum and exists in a superposition of states - just not the one
              you're looking for!
            </p>
            <p className="text-gray-600">
              Even Einstein would be confused by this one. Maybe try a different equation?
            </p>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            <p className="text-sm text-gray-600 flex items-center">
              <span className="mr-2">💡</span>
              <span>
                Fun fact: In computer science, a 404 error occurs when a server can't find the requested resource!
              </span>
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center pb-6">
          <Button onClick={goBack} className="bg-blue-600 hover:bg-blue-700 text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Learning
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
