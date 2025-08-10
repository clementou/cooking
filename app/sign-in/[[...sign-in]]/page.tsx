import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl rounded-2xl",
            headerTitle: "font-bold",
            headerSubtitle: "text-gray-600",
            formButtonPrimary:
              "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600",
            footerActionLink: "text-orange-600 hover:text-orange-700",
            identityPreviewEditButtonIcon: "text-orange-600",
          },
        }}
      />
    </div>
  );
}
