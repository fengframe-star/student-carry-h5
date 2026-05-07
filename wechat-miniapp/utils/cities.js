const countryCityMap = {
  China: ["Shanghai", "Beijing", "Guangzhou", "Shenzhen", "Xi'an", "Chengdu"],
  France: ["Paris", "Lyon", "Marseille", "Nice"],
  Italy: ["Milan", "Rome", "Florence"],
  Spain: ["Barcelona", "Madrid"],
  UK: ["London", "Manchester", "Edinburgh"]
};

const countryNames = Object.keys(countryCityMap);
const anyOption = "Any / 不限";

function getCities(countryName) {
  return countryCityMap[countryName] || [];
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/'/g, "");
}

function routeIncludes(routeText, city) {
  if (!city || city === anyOption) {
    return true;
  }

  return normalize(routeText).includes(normalize(city));
}

function countryMatches(routeText, countryName) {
  if (!countryName || countryName === anyOption) {
    return true;
  }

  return getCities(countryName).some((city) => routeIncludes(routeText, city));
}

function routeMatchesFilters(routeText, fromCountry, fromCity, toCountry, toCity) {
  const fromMatches =
    routeIncludes(routeText, fromCity) && countryMatches(routeText, fromCountry);
  const toMatches =
    routeIncludes(routeText, toCity) && countryMatches(routeText, toCountry);

  return fromMatches && toMatches;
}

module.exports = {
  anyOption,
  countryNames,
  countryCityMap,
  getCities,
  routeMatchesFilters
};
