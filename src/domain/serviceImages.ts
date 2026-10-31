export const HERO_BANNER_IMAGE = '/images/services/hero_technician_banner.jpg';

export const SERVICE_CATEGORY_IMAGES: Record<string, string> = {
  electrician: '/images/services/electrician.jpg',
  'srv-electrician': '/images/services/electrician.jpg',
  plumber: '/images/services/plumber.jpg',
  'srv-plumber': '/images/services/plumber.jpg',
  carpenter: '/images/services/carpenter.jpg',
  'srv-carpenter': '/images/services/carpenter.jpg',
  ac_repair: '/images/services/ac_repair.jpg',
  'srv-ac': '/images/services/ac_repair.jpg',
  painter: '/images/services/painter.jpg',
  'srv-painter': '/images/services/painter.jpg',
  refrigerator_repair: '/images/services/refrigerator_repair.jpg',
  'srv-fridge': '/images/services/refrigerator_repair.jpg',
  washing_machine_repair: '/images/services/washing_machine_repair.jpg',
  'srv-washing': '/images/services/washing_machine_repair.jpg',
  house_cleaning: '/images/services/house_cleaning.jpg',
  'srv-cleaning': '/images/services/house_cleaning.jpg',
  ro_water_purifier: '/images/services/ro_water_purifier.jpg',
  'srv-ro': '/images/services/ro_water_purifier.jpg',
  other_home_services: '/images/services/other_home_services.jpg',
  'srv-other': '/images/services/other_home_services.jpg',
};

export function getServiceCategoryImage(serviceId: string): string {
  return SERVICE_CATEGORY_IMAGES[serviceId] || '/images/services/other_home_services.jpg';
}
