import { getData } from "@/lib/storage";
import { getStravaActivities } from "@/lib/strava";
import StorefrontPage from "@/components/StorefrontPage";

export const revalidate = 60;

export default async function Home() {
  const [data, stravaActivities] = await Promise.all([
    getData(),
    getStravaActivities(10),
  ]);

  return (
    <StorefrontPage
      creator={data.creator}
      apps={data.apps}
      products={data.products}
      categories={data.categories}
      currency={data.currency}
      contacts={data.contacts}
      workoutPlans={data.workoutPlans}
      transformations={data.transformations || []}
      discountCodes={(data.discountCodes || []).filter((dc) => dc.active)}
      faq={data.faq || []}
      achievements={data.achievements || []}
      schedule={data.schedule || []}
      socialFeed={data.socialFeed || {}}
      seo={data.seo || {}}
      consultation={data.consultation || {}}
      tip={data.tip || {}}
      sectionVisibility={data.sectionVisibility || {}}
      newsletterEnabled={data.newsletterEnabled ?? false}
      stravaActivities={stravaActivities}
    />
  );
}
