import { DashboardHeader } from "@/components/dashboard-header"
import { ProfileCard } from "@/components/profile-card"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader activeTab="Profile" />

      <main className="mx-auto max-w-[1200px] px-6 py-20">
        {/* Section heading */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Profile
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Your wallet and balances
          </p>
        </div>

        {/* Profile card */}
        <ProfileCard />
      </main>
    </div>
  )
}
