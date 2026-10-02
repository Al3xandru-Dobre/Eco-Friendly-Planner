import { EcoScore } from '../EcoScore';
import { VenueArt } from '../VenueArt';
import { Badges, Rating } from '../Primitives';
import { Modal } from '../Modal';
import { HotelBookingPanel } from './HotelBookingPanel';
import { RestaurantBookingPanel } from './RestaurantBookingPanel';
import { humanize, PRICE_LEVELS } from '../../lib/format';
import { MapPin } from '../Icons';

function VenueFacts({ venue, kind }) {
  return (
    <div className="stack" style={{ gap: 14 }}>
      <VenueArt theme={venue.imageTheme} kind={kind} className="compact">
        <div className="art-score"><EcoScore value={venue.ecoScore} size={60} label="eco" stroke={5} /></div>
      </VenueArt>
      <div className="row" style={{ gap: 8 }}>
        <Rating value={venue.rating} />
        <span className="badge"><MapPin width={13} height={13} /> {venue.address || `${venue.city}, ${venue.country}`}</span>
        {kind === 'restaurant' && <span className="badge">{PRICE_LEVELS[venue.priceLevel]}</span>}
      </div>
      <p className="muted" style={{ margin: 0 }}>{venue.description}</p>
      {venue.highlights?.length > 0 && (
        <ul className="list-plain list-check small">{venue.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
      )}
      {venue.certifications?.length > 0 && (
        <div>
          <div className="tiny faint" style={{ marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Certifications</div>
          <Badges items={venue.certifications} max={10} variant="badge-primary" />
        </div>
      )}
      <div>
        <div className="tiny faint" style={{ marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Sustainability</div>
        <Badges items={venue.sustainabilityFeatures} max={20} />
      </div>
      {kind === 'restaurant' && venue.dietaryOptions?.length > 0 && (
        <div>
          <div className="tiny faint" style={{ marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Dietary</div>
          <div className="badges">{venue.dietaryOptions.map((d) => <span key={d} className="badge badge-accent">{humanize(d)}</span>)}</div>
        </div>
      )}
      <div className="tiny muted">
        {kind === 'hotel'
          ? `${venue.carbonKgPerGuestNight} kg CO₂e per guest-night, against an indicative 20 kg for a conventional hotel.`
          : `${venue.carbonKgPerCover} kg CO₂e per meal, against an indicative 3.5 kg for a conventional restaurant meal.`}
      </div>
    </div>
  );
}

export function HotelDetailModal({ hotel, onClose, defaults, lockedTrip, onBooked }) {
  return (
    <Modal title={hotel.name} subtitle={`${hotel.city}, ${hotel.country}`} onClose={onClose} wide>
      <div className="detail-grid">
        <VenueFacts venue={hotel} kind="hotel" />
        <div className="card card-body sticky">
          <h3 style={{ marginTop: 0 }}>Check availability</h3>
          <HotelBookingPanel hotel={hotel} defaults={defaults} lockedTrip={lockedTrip} onBooked={onBooked} />
        </div>
      </div>
    </Modal>
  );
}

export function RestaurantDetailModal({ restaurant, onClose, defaults, dateBounds, lockedTrip, onBooked }) {
  return (
    <Modal title={restaurant.name} subtitle={`${restaurant.cuisine.join(' · ')} · ${restaurant.city}`} onClose={onClose} wide>
      <div className="detail-grid">
        <VenueFacts venue={restaurant} kind="restaurant" />
        <div className="card card-body sticky">
          <h3 style={{ marginTop: 0 }}>Reserve a table</h3>
          <RestaurantBookingPanel restaurant={restaurant} defaults={defaults} dateBounds={dateBounds} lockedTrip={lockedTrip} onBooked={onBooked} />
        </div>
      </div>
    </Modal>
  );
}
