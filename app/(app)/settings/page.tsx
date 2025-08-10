import { UserProfile } from "@clerk/nextjs";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <UserProfile
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-lg rounded-xl",
            navbar: "hidden",
            pageScrollBox: "p-0",
            formButtonPrimary:
              "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600",
          },
        }}
      />
    </div>
  );
}
