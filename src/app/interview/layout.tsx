export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Interview pages render without sidebar - full screen experience
  return (
    <div className="fixed inset-0 z-50 bg-background">
      {children}
    </div>
  )
}
