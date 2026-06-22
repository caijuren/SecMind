import { MarketingNav } from "@/components/marketing-nav"
import { MarketingFooter } from "@/components/marketing-footer"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <MarketingNav />
      {children}
      <MarketingFooter />
    </div>
  )
}