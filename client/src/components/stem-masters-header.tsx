
import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import logoImage from "@/assets/images/stem-masters-laptops.jpeg";
interface StemMastersHeaderProps {
  title: string
  showBackButton?: boolean
  backUrl?: string
  backText?: string
}

export function StemMastersHeader({
  title,
  showBackButton = false,
  backUrl = "/enroll",
  backText = "Back to offerings",
}: StemMastersHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <img
                src={logoImage}
                alt="STEM Masters"
                width={60}
                height={60}
                className="rounded-md"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-primary">STEM Masters</h1>
          </div>
          <p className="text-muted-foreground mt-1">Excellence in STEM Education</p>
        </div>
        {showBackButton && (
          <Link href={backUrl}>
            <Button variant="outline" size="sm">
              ← {backText}
            </Button>
          </Link>
        )}
      </div>
      <div className="mt-6">
        <h2 className="text-3xl font-bold">{title}</h2>
        <div className="h-1 w-20 bg-primary mt-2 rounded-full"></div>
      </div>
    </div>
  )
}
