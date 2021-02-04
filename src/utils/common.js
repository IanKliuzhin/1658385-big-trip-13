export const updatePoint = (points, updatedPoint) => {
  return points.map((point) => point.id === updatedPoint.id ? updatedPoint : point);
};

export const compareOffers = (offersA, offersB) => {
  return JSON.stringify(offersA.map((offer) => offer.name).sort()) === JSON.stringify(offersB.map((offer) => offer.name).sort());
};

export const handleEscape = (evt, callback) => {
  if (evt.key === `Esc` || evt.key === `Escape`) {
    evt.preventDefault();
    callback();
  }
};

export const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const getIsOnline = () => {
  return window.navigator.onLine;
};
