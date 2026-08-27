export {
  Skeleton as SkeletonLoader,
  CatalogSkeleton,
  HomeScreenSkeleton,
  OrdersScreenSkeleton,
} from "./skeleton";
export type { SkeletonProps as SkeletonLoaderProps } from "./skeleton";
export default function LegacySkeletonLoader(props: any) {
  const { Skeleton } = require("./skeleton");
  return <Skeleton {...props} />;
}