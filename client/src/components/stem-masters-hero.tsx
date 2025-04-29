import { Button } from "@/components/ui/button"
import { Link } from "wouter"

interface StemMastersHeroProps {
  title: string
  description: string
  buttonText: string
  buttonLink: string
  imageSrc: string
}

export function StemMastersHero({ title, description, buttonText, buttonLink, imageSrc }: StemMastersHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900 mb-8">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">{description}</p>
            <div className="mt-8">
              <Link href={buttonLink}>
                <Button size="lg" className="px-8">
                  {buttonText}
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-64 w-full overflow-hidden rounded-xl sm:h-80 lg:h-96">
              <img
                src={imageSrc || "/placeholder.svg"}
                alt="STEM Masters Students"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
