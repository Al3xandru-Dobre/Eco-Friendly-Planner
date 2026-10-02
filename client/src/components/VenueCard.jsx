import { EcoScore } from './EcoScore';
import { VenueArt } from './VenueArt';
import { Badges, Rating } from './Primitives';
import { money, PRICE_LEVELS } from '../lib/format';
import { MapPin } from './Icons';

export function HotelCard({ hotel, onSelect, cta = 'View rooms' }) {
  return (
    <article className="card card-hover" style={{ display: 'grid' }}>
      <VenueArt theme={hotel.imageTheme} kind="hotel">
        <div className="art-badges"><Badges items={hotel.certifications} max={2} onArt /></div>
        <div className="art-score"><EcoScore value={hotel.ecoScore} size={52} label="" stroke={5} /></div>
      </VenueArt>
      <div className="card-body stack" style={{ gap: 10 }}>
        <div>
          <h3 className="card-title">{hotel.name}</h3>
          <div className="card-sub row" style={{ gap: 6 }}><MapPin width={14} height={14} /> {hotel.city}, {hotel.country}</div>
        </div>
        <p className="small muted" style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{hotel.description}</p>
        <Badges items={hotel.sustainabilityFeatures} max={3} />
        <div className="row between" style={{ marginTop: 4 }}>
          <div>
            <div className="price">{money(hotel.lowestPricePerNight, hotel.currency)} <small>/ night from</small></div>
            <div className="tiny muted">{hotel.carbonKgPerGuestNight} kg CO₂e per guest-night</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Rating value={hotel.rating} />
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onSelect?.(hotel)}>{cta}</button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function RestaurantCard({ restaurant, onSelect, cta = 'Reserve' }) {
  return (
    <article className="card card-hover" style={{ display: 'grid' }}>
      <VenueArt theme={restaurant.imageTheme} kind="restaurant">
        <div className="art-badges">
          {restaurant.cuisine.slice(0, 2).map((c) => <span key={c} className="badge badge-onart">{c}</span>)}
        </div>
        <div className="art-score"><EcoScore value={restaurant.ecoScore} size={52} label="" stroke={5} /></div>
      </VenueArt>
      <div className="card-body stack" style={{ gap: 10 }}>
        <div>
          <h3 className="card-title">{restaurant.name}</h3>
          <div className="card-sub row" style={{ gap: 6 }}><MapPin width={14} height={14} /> {restaurant.city}, {restaurant.country}</div>
        </div>
        <p className="small muted" style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{restaurant.description}</p>
        <Badges items={restaurant.dietaryOptions} max={3} />
        <div className="row between" style={{ marginTop: 4 }}>
          <div>
            <div className="price">{PRICE_LEVELS[restaurant.priceLevel]} <small>· about {money(restaurant.averagePricePerCover, restaurant.currency)} per person</small></div>
            <div className="tiny muted">{restaurant.carbonKgPerCover} kg CO₂e per meal</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Rating value={restaurant.rating} />
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onSelect?.(restaurant)}>{cta}</button>
          </div>
        </div>
      </div>
    </article>
  );
}
