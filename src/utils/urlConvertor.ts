import { IMAGE_BASE_URL } from "../var/config";

const getImageUrl = (url?: string) => {
  if (!url) {
    return '';
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${IMAGE_BASE_URL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

export default getImageUrl;