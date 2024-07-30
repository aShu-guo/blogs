type Longitude = number;
type Latitude = number;

/**
 *
 * @param coordinate
 */
export const transformDMSFromDD = function(coordinate: [Longitude, Latitude]) {
  return coordinate.map((item, index) => {
    const D = Math.floor(item);
    const M = Math.floor((item - D) * 60);
    const S = Math.floor(((item - D) * 60 - M) * 60);
    let result = D + '°' + M + '´' + S + '\"';

    if (index === 0) {
      D > 0 ? result += 'E' : result += 'W';
      return result;
    }
    if (index === 1) {
      D > 0 ? result += 'N' : result += 'S';
      return result;
    }
  });
};

