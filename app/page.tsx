import { getData } from "@/lib/storage";
import StorefrontPage from "@/components/StorefrontPage";

export const revalidate = 60;

export default async function Home() {
  const data = await getData();

  return (
    <StorefrontPage
      creator={data.creator}
      apps={data.apps}
      products={data.products}
      categories={data.categories}
      currency={data.currency}
      contacts={data.contacts}
      workoutPlans={data.workoutPlans}
    />
  );
}
