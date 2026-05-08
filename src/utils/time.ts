export function formatPostedTime(
  createdAt?: string | number | Date,
  language: "zh" | "en" = "en"
) {
  if (!createdAt) {
    return language === "zh" ? "今天发布" : "Posted today";
  }

  const created = new Date(createdAt).getTime();
  const now = Date.now();

  const diffMs = now - created;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return language === "zh"
      ? "今天发布"
      : "Posted today";
  }

  if (diffDays === 1) {
    return language === "zh"
      ? "1天前发布"
      : "Posted 1 day ago";
  }

  return language === "zh"
    ? `${diffDays}天前发布`
    : `Posted ${diffDays} days ago`;
}