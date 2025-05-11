// Factori de emisie aproximativi (kg CO2e per pasager-km)
// Acestea sunt valori foarte generale și ar trebui rafinate cu date mai precise
// Sursa: Diverse, ex: DEFRA, EPA, studii academice. Pot varia semnificativ.

const EMISSION_FACTORS_PER_PASSENGER_KM // Exportăm și factorii dacă vrem să-i afișăm/folosim altundeva
= {
    PLANE_SHORT_HAUL: 0.250, // < 1500 km
    PLANE_LONG_HAUL: 0.150,  // > 1500 km
    TRAIN_NATIONAL: 0.035,
    TRAIN_EUROSTAR_LIKE: 0.006, // Exemplu foarte eficient
    BUS_COACH: 0.028,
    CAR_GASOLINE_SMALL: 0.170, // Emisii totale mașină, se împart la nr. pasageri
    CAR_GASOLINE_MEDIUM: 0.200,
    CAR_GASOLINE_LARGE: 0.280,
    CAR_HYBRID: 0.120,
    CAR_ELECTRIC: 0.050, // Depinde foarte mult de mixul energetic al rețelei
    MOTORBIKE: 0.100,
    FERRY_FOOT_PASSENGER: 0.018,
    BICYCLE: 0,
    WALK: 0 //(sau neglijabil, considerând producția și întreținerea)
}

function calculateTransportCarbonFootprint( {transportationType, distanceKm, numberOfTravelers = 1}) {
    if(!transportationType || !distanceKm || distanceKm <= 0)
        return 0;

    let factor = 0;
    const numTravelers = Math.max(1,  numberOfTravelers);

    switch(transportationType){
        case 'PLANE':
            factor = distanceKm < 1500 ? EMISSION_FACTORS_PER_PASSENGER_KM.PLANE_SHORT_HAUL : EMISSION_FACTORS_PER_PASSENGER_KM.PLANE_LONG_HAUL;
            // Pentru avion, factorul este de obicei deja per pasager
            return factor * distanceKm; // Nu se împarte la numTravelers aici, factorul e deja per pasager

        case 'TRAIN':
            factor = EMISSION_FACTORS_PER_PASSENGER_KM.TRAIN_NATIONAL;
            return factor * distanceKm; // Factorul e per pasager

        case 'BUS':
            factor = EMISSION_FACTORS_PER_PASSENGER_KM.BUS_COACH;
            return factor*distanceKm;
        
        case 'CAR_GASOLINE':
            factor = EMISSION_FACTORS_PER_PASSENGER_KM.CAR_GASOLINE_MEDIUM;
            return (factor * distanceKm) / numTravelers;
        case 'CAR_HYBRID':
            factor = EMISSION_FACTORS_PER_PASSENGER_KM.CAR_HYBRID;
            return (factor * distanceKm) / numTravelers;
        case 'CAR_ELECTRIC':
            factor = EMISSION_FACTORS_PER_PASSENGER_KM.CAR_ELECTRIC;
            return (factor * distanceKm) / numTravelers;
        case 'BICYCLE': return 0;
        case 'WALK': return 0;
        default: return 0;
    }
}

function calculateEcoScore({carbonFootprintKgCO2e, transportationType}) {
    let score = 100;

    if(carbonFootprintKgCO2e > 0) {
        Math.min(carbonFootprintKgCO2e / 10, 70);    }

    if(['TRAIN','BUS','BICYCLE','WALK'].includes(transportationType)) {
        score+=10;
    }    

    if(transportationType === 'CAR_ELECTRIC')
        score += 5;

    // TO DO update pentru alti factori
    //spre exemplu cazare, activitati

    return Math.max(0,Math.min(100,Math.round(score)));
}

module.exports = {
    calculateTransportCarbonFootprint,
    calculateEcoScore,
    EMISSION_FACTORS_PER_PASSENGER_KM // Exportăm și factorii dacă vrem să-i afișăm/folosim altundeva
  };