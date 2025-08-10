import NewRecipeClientWrapper from "./client-wrapper";
import AiRecipeGenerator from "@/components/recipes/ai-recipe-generator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function NewRecipePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const defaultTab = params.tab || "manual";
  
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Recipe</h1>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>
        <TabsContent value="manual" className="pt-4">
          <NewRecipeClientWrapper />
        </TabsContent>
        <TabsContent value="ai" className="pt-4">
          <AiRecipeGenerator />
        </TabsContent>
        <TabsContent value="import" className="pt-4">
          <p className="text-sm text-muted-foreground">
            Import from URL placeholder.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
